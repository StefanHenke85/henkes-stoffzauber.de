import paypal from '@paypal/checkout-server-sdk';
import { env } from '../config/environment';
import { logger } from '../utils/logger';
import { IOrder } from '../types';

// Configure PayPal environment
const getPayPalClient = () => {
  const environment =
    env.PAYPAL_ENV === 'live'
      ? new paypal.core.LiveEnvironment(env.PAYPAL_CLIENT_ID, env.PAYPAL_CLIENT_SECRET)
      : new paypal.core.SandboxEnvironment(env.PAYPAL_CLIENT_ID, env.PAYPAL_CLIENT_SECRET);

  return new paypal.core.PayPalHttpClient(environment);
};

const client = getPayPalClient();

interface PayPalOrderResult {
  orderId: string;
  approvalUrl: string;
}

/**
 * Create PayPal order
 */
export async function createPayPalOrder(
  order: IOrder,
  returnUrl: string,
  cancelUrl: string
): Promise<PayPalOrderResult | null> {
  try {
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer('return=representation');

    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: order.orderNumber,
          description: `Bestellung ${order.orderNumber} - Henkes Stoffzauber`,
          amount: {
            currency_code: 'EUR',
            value: order.total.toFixed(2),
            breakdown: {
              item_total: {
                currency_code: 'EUR',
                value: order.subtotal.toFixed(2),
              },
              shipping: {
                currency_code: 'EUR',
                value: order.shipping.toFixed(2),
              },
            },
          },
          items: order.items.map((item) => ({
            name: item.name.substring(0, 127),
            unit_amount: {
              currency_code: 'EUR',
              value: item.price.toFixed(2),
            },
            quantity: item.quantity.toString(),
            category: 'PHYSICAL_GOODS' as const,
          })),
          shipping: {
            name: {
              full_name: `${order.customer.firstName} ${order.customer.lastName}`,
            },
            address: {
              address_line_1: `${order.customer.street} ${order.customer.houseNumber}`,
              admin_area_2: order.customer.city,
              postal_code: order.customer.zip,
              country_code: 'DE',
            },
          },
        },
      ],
      application_context: {
        brand_name: 'Henkes Stoffzauber',
        locale: 'de-DE',
        landing_page: 'BILLING',
        shipping_preference: 'SET_PROVIDED_ADDRESS',
        user_action: 'PAY_NOW',
        return_url: returnUrl,
        cancel_url: cancelUrl,
      },
    });

    const response = await client.execute(request);
    const result = response.result as {
      id: string;
      links: Array<{ rel: string; href: string }>;
    };

    const approvalLink = result.links.find((link) => link.rel === 'approve');

    if (!approvalLink) {
      throw new Error('No approval URL in PayPal response');
    }

    logger.info(`PayPal order created: ${result.id}`);

    return {
      orderId: result.id,
      approvalUrl: approvalLink.href,
    };
  } catch (error) {
    logger.error('PayPal order creation failed:', error);
    return null;
  }
}

/**
 * Capture PayPal payment
 */
export async function capturePayPalPayment(paypalOrderId: string): Promise<boolean> {
  try {
    const request = new paypal.orders.OrdersCaptureRequest(paypalOrderId);
    request.requestBody({} as never);

    const response = await client.execute(request);
    const result = response.result as { status: string };

    if (result.status === 'COMPLETED') {
      logger.info(`PayPal payment captured: ${paypalOrderId}`);
      return true;
    }

    logger.warn(`PayPal capture status: ${result.status}`);
    return false;
  } catch (error) {
    logger.error('PayPal capture failed:', error);
    return false;
  }
}

/**
 * Get PayPal order details
 */
export async function getPayPalOrderDetails(paypalOrderId: string): Promise<unknown | null> {
  try {
    const request = new paypal.orders.OrdersGetRequest(paypalOrderId);
    const response = await client.execute(request);
    return response.result;
  } catch (error) {
    logger.error('PayPal get order failed:', error);
    return null;
  }
}

/**
 * Refund PayPal payment
 */
export async function refundPayPalPayment(
  captureId: string,
  amount?: number
): Promise<boolean> {
  try {
    const request = new paypal.payments.CapturesRefundRequest(captureId);

    if (amount) {
      request.requestBody({
        amount: {
          currency_code: 'EUR',
          value: amount.toFixed(2),
        },
      });
    } else {
      request.requestBody({});
    }

    const response = await client.execute(request);
    const result = response.result as { status: string };

    if (result.status === 'COMPLETED') {
      logger.info(`PayPal refund completed: ${captureId}`);
      return true;
    }

    return false;
  } catch (error) {
    logger.error('PayPal refund failed:', error);
    return false;
  }
}
