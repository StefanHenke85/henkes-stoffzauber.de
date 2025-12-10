import { Router, Response, Request } from 'express';
import { ordersStore, productsStore } from '../data/jsonStore';
import { AuthRequest, ApiResponse, PaginatedResponse } from '../types';
import {
  authenticateToken,
  requireAdmin,
  checkoutRateLimiter,
} from '../middleware';
import {
  createPayPalOrder,
  capturePayPalPayment,
  generateInvoice,
  sendOrderConfirmation,
  sendOrderNotification,
  sendShippingNotification,
} from '../services';
import { env } from '../config/environment';
import { logger } from '../utils/logger';
import { generateId } from '../utils/helpers';
import fs from 'fs/promises';
import path from 'path';

const router = Router();

// Voucher helper functions
const vouchersFilePath = path.resolve('./data/vouchers.json');

interface Voucher {
  id: string;
  code: string;
  value: number;
  isPercentage?: boolean;
  isUsed: boolean;
  usedBy?: string;
  usedAt?: string;
  orderId?: string; // Link to the order that purchased this voucher
  createdAt: string;
}

async function loadVouchers(): Promise<Voucher[]> {
  try {
    const data = await fs.readFile(vouchersFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      await fs.writeFile(vouchersFilePath, JSON.stringify([], null, 2));
      return [];
    }
    throw error;
  }
}

async function saveVouchers(vouchers: Voucher[]): Promise<void> {
  await fs.writeFile(vouchersFilePath, JSON.stringify(vouchers, null, 2));
}

function generateVoucherCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'HS-'; // HS = Henkes Stoffzauber
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Generate voucher codes for purchased vouchers in an order
async function generateVouchersForOrder(order: any): Promise<Voucher[]> {
  const voucherItems = order.items.filter((item: any) => item.productId.startsWith('voucher-'));

  if (voucherItems.length === 0) {
    return [];
  }

  const vouchers = await loadVouchers();
  const newVouchers: Voucher[] = [];

  for (const item of voucherItems) {
    // Generate one voucher per quantity
    for (let i = 0; i < item.quantity; i++) {
      const newVoucher: Voucher = {
        id: generateId(),
        code: generateVoucherCode(),
        value: item.price,
        isUsed: false,
        orderId: order.id,
        createdAt: new Date().toISOString(),
      };
      vouchers.push(newVoucher);
      newVouchers.push(newVoucher);
    }
  }

  await saveVouchers(vouchers);
  logger.info(`Generated ${newVouchers.length} voucher codes for order ${order.orderNumber}`);

  return newVouchers;
}

/**
 * POST /api/checkout
 * Create new order
 */
router.post(
  '/',
  checkoutRateLimiter,
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const { cart, address, paymentMethod, customerNotes } = req.body;

      if (!cart || !Array.isArray(cart) || cart.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Warenkorb ist leer',
        });
        return;
      }

      // Calculate totals and verify stock
      let subtotal = 0;
      const orderItems = [];

      for (const item of cart) {
        // Check if this is a voucher (virtual product)
        const isVoucher = item.id.startsWith('voucher-');

        if (isVoucher) {
          // Vouchers don't need product validation
          const itemTotal = item.price * item.quantity;
          subtotal += itemTotal;

          orderItems.push({
            productId: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            imageUrl: item.imageUrl || '/voucher-placeholder.jpg',
          });
        } else {
          // Regular product validation
          const product = productsStore.getById(item.id);

          if (!product) {
            res.status(400).json({
              success: false,
              error: `Produkt nicht gefunden: ${item.name}`,
            });
            return;
          }

          if (product.stock < item.quantity) {
            res.status(400).json({
              success: false,
              error: `Nicht genug Bestand für: ${product.name}`,
            });
            return;
          }

          const itemTotal = product.price * item.quantity;
          subtotal += itemTotal;

          orderItems.push({
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: item.quantity,
            imageUrl: product.imageUrl,
          });
        }
      }

      // Calculate shipping (free over 50 EUR or if only vouchers)
      const hasOnlyVouchers = orderItems.every(item => item.productId.startsWith('voucher-'));
      const shipping = hasOnlyVouchers || subtotal >= 50 ? 0 : 4.99;
      const total = subtotal + shipping;

      // Create order
      const order = ordersStore.create({
        customer: {
          firstName: address.firstName,
          lastName: address.lastName,
          email: address.email,
          phone: address.phone,
          street: address.street,
          houseNumber: address.houseNumber,
          zip: address.zip,
          city: address.city,
          country: address.country || 'Deutschland',
        },
        items: orderItems,
        subtotal,
        shipping,
        total,
        paymentMethod: paymentMethod || 'paypal',
        paymentStatus: 'pending',
        orderStatus: 'new',
        customerNotes: customerNotes || undefined,
      });

      // Update stock
      for (const item of cart) {
        const product = productsStore.getById(item.id);
        if (product) {
          productsStore.update(item.id, {
            stock: product.stock - item.quantity,
          });
        }
      }

      // Handle PayPal payment
      if (paymentMethod === 'paypal') {
        const frontendUrl = env.FRONTEND_URL;
        const paypalResult = await createPayPalOrder(
          order as any,
          `${frontendUrl}/checkout/success?orderId=${order.id}`,
          `${frontendUrl}/checkout/cancel?orderId=${order.id}`
        );

        if (paypalResult) {
          ordersStore.update(order.id, { paypalOrderId: paypalResult.orderId });

          res.json({
            success: true,
            data: {
              order,
              approvalUrl: paypalResult.approvalUrl,
            },
          });
          return;
        } else {
          res.status(500).json({
            success: false,
            error: 'PayPal-Fehler. Bitte versuchen Sie es erneut.',
          });
          return;
        }
      }

      // Generate invoice for non-PayPal orders
      try {
        const invoicePath = await generateInvoice(order as any);
        ordersStore.update(order.id, { invoicePath });

        // Send emails
        await Promise.all([
          sendOrderConfirmation(order as any, invoicePath),
          sendOrderNotification(order as any, invoicePath),
        ]);
      } catch (emailError) {
        logger.error('Email/Invoice error:', emailError);
      }

      logger.info(`Order created: ${order.orderNumber}`);

      res.status(201).json({
        success: true,
        data: { order },
        message: 'Bestellung erfolgreich erstellt',
      });
    } catch (error) {
      logger.error('Checkout error:', error);
      res.status(500).json({
        success: false,
        error: 'Fehler beim Erstellen der Bestellung',
      });
    }
  }
);

/**
 * POST /api/checkout/capture/:orderId
 * Capture PayPal payment after approval
 */
router.post('/capture/:orderId', async (req: Request, res: Response<ApiResponse>) => {
  try {
    const order = ordersStore.getById(req.params.orderId);

    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Bestellung nicht gefunden',
      });
      return;
    }

    if (!order.paypalOrderId) {
      res.status(400).json({
        success: false,
        error: 'Keine PayPal-Bestellung',
      });
      return;
    }

    const captured = await capturePayPalPayment(order.paypalOrderId);

    if (captured) {
      ordersStore.update(order.id, {
        paymentStatus: 'paid',
        orderStatus: 'processing',
      });

      // Generate invoice and vouchers after successful payment
      try {
        const invoicePath = await generateInvoice(order as any);
        ordersStore.update(order.id, { invoicePath });

        // Generate voucher codes for any purchased vouchers
        const generatedVouchers = await generateVouchersForOrder(order);

        // Send emails
        await Promise.all([
          sendOrderConfirmation(order as any, invoicePath, generatedVouchers),
          sendOrderNotification(order as any, invoicePath),
        ]);
      } catch (emailError) {
        logger.error('Email/Invoice error:', emailError);
      }

      logger.info(`PayPal payment captured: ${order.orderNumber}`);

      const updatedOrder = ordersStore.getById(order.id);
      res.json({
        success: true,
        data: updatedOrder,
        message: 'Zahlung erfolgreich',
      });
    } else {
      ordersStore.update(order.id, { paymentStatus: 'failed' });

      res.status(400).json({
        success: false,
        error: 'Zahlung fehlgeschlagen',
      });
    }
  } catch (error) {
    logger.error('Payment capture error:', error);
    res.status(500).json({
      success: false,
      error: 'Fehler bei der Zahlungsverarbeitung',
    });
  }
});

/**
 * GET /api/checkout/order/:id
 * Get order by ID (for customer confirmation page)
 */
router.get('/order/:id', async (req: Request, res: Response<ApiResponse>) => {
  try {
    const order = ordersStore.getById(req.params.id);

    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Bestellung nicht gefunden',
      });
      return;
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    logger.error('Get order error:', error);
    res.status(500).json({
      success: false,
      error: 'Fehler beim Laden der Bestellung',
    });
  }
});

/**
 * GET /api/orders/admin
 * Get all orders with pagination (admin only)
 */
router.get(
  '/admin',
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response<ApiResponse<PaginatedResponse<unknown>>>) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as string;
      const paymentStatus = req.query.paymentStatus as string;

      const result = ordersStore.getPaginated(page, limit, {
        orderStatus: status,
        paymentStatus,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Admin get orders error:', error);
      res.status(500).json({
        success: false,
        error: 'Fehler beim Laden der Bestellungen',
      });
    }
  }
);

/**
 * GET /api/orders/admin/:id
 * Get single order (admin only)
 */
router.get(
  '/admin/:id',
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    try {
      const order = ordersStore.getById(req.params.id);

      if (!order) {
        res.status(404).json({
          success: false,
          error: 'Bestellung nicht gefunden',
        });
        return;
      }

      res.json({
        success: true,
        data: order,
      });
    } catch (error) {
      logger.error('Admin get order error:', error);
      res.status(500).json({
        success: false,
        error: 'Fehler beim Laden der Bestellung',
      });
    }
  }
);

/**
 * PATCH /api/orders/admin/:id
 * Update order status (admin only)
 */
router.patch(
  '/admin/:id',
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    try {
      const order = ordersStore.getById(req.params.id);

      if (!order) {
        res.status(404).json({
          success: false,
          error: 'Bestellung nicht gefunden',
        });
        return;
      }

      const { orderStatus, paymentStatus, trackingNumber, notes } = req.body;
      const previousStatus = order.orderStatus;
      const previousPaymentStatus = order.paymentStatus;

      const updates: any = {};
      if (orderStatus) updates.orderStatus = orderStatus;
      if (paymentStatus) updates.paymentStatus = paymentStatus;
      if (trackingNumber) updates.trackingNumber = trackingNumber;
      if (notes) updates.notes = notes;

      ordersStore.update(order.id, updates);

      // Generate vouchers and send confirmation if payment status changed to paid
      if (paymentStatus === 'paid' && previousPaymentStatus !== 'paid') {
        try {
          // Generate invoice if not already exists
          let invoicePath = order.invoicePath;
          if (!invoicePath) {
            invoicePath = await generateInvoice(order as any);
            ordersStore.update(order.id, { invoicePath });
          }

          // Generate voucher codes for any purchased vouchers
          const generatedVouchers = await generateVouchersForOrder(order);

          // Send emails
          await Promise.all([
            sendOrderConfirmation(order as any, invoicePath, generatedVouchers),
            sendOrderNotification(order as any, invoicePath),
          ]);
        } catch (emailError) {
          logger.error('Email/Invoice/Voucher error on manual payment confirmation:', emailError);
        }
      }

      // Send shipping notification if status changed to shipped
      if (orderStatus === 'shipped' && previousStatus !== 'shipped') {
        try {
          await sendShippingNotification(order as any);
        } catch (emailError) {
          logger.error('Shipping notification error:', emailError);
        }
      }

      logger.info(`Order ${order.orderNumber} updated by ${req.user?.username}`);

      const updatedOrder = ordersStore.getById(order.id);
      res.json({
        success: true,
        data: updatedOrder,
        message: 'Bestellung aktualisiert',
      });
    } catch (error) {
      logger.error('Update order error:', error);
      res.status(500).json({
        success: false,
        error: 'Fehler beim Aktualisieren der Bestellung',
      });
    }
  }
);

/**
 * DELETE /api/orders/admin/:id
 * Delete order (admin only)
 */
router.delete(
  '/admin/:id',
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    try {
      const order = ordersStore.getById(req.params.id);

      if (!order) {
        res.status(404).json({
          success: false,
          error: 'Bestellung nicht gefunden',
        });
        return;
      }

      // Delete order
      ordersStore.delete(req.params.id);

      logger.info(`Order ${order.orderNumber} deleted by ${req.user?.username}`);

      res.json({
        success: true,
        message: 'Bestellung gelöscht',
      });
    } catch (error) {
      logger.error('Delete order error:', error);
      res.status(500).json({
        success: false,
        error: 'Fehler beim Löschen der Bestellung',
      });
    }
  }
);

export default router;
