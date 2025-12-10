import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import fs from 'fs/promises';
import path from 'path';
import { generateId } from '../utils/helpers';
import { logger } from '../utils/logger';

const router = Router();
const vouchersFilePath = path.resolve('./data/vouchers.json');

// Voucher interface
interface Voucher {
  id: string;
  code: string;
  value: number;
  isPercentage?: boolean;
  isUsed: boolean;
  usedBy?: string;
  usedAt?: string;
  createdAt: string;
}

// Load vouchers
async function loadVouchers(): Promise<Voucher[]> {
  try {
    const data = await fs.readFile(vouchersFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, create it with empty array
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      await fs.writeFile(vouchersFilePath, JSON.stringify([], null, 2));
      return [];
    }
    throw error;
  }
}

// Save vouchers
async function saveVouchers(vouchers: Voucher[]): Promise<void> {
  await fs.writeFile(vouchersFilePath, JSON.stringify(vouchers, null, 2));
}

// Generate voucher code
function generateVoucherCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'HS-'; // HS = Henkes Stoffzauber
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// GET /api/vouchers - Get all vouchers (Admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const vouchers = await loadVouchers();
    res.json({ success: true, data: vouchers });
  } catch (error) {
    logger.error('Error loading vouchers:', error);
    res.status(500).json({ success: false, error: 'Failed to load vouchers' });
  }
});

// POST /api/vouchers/validate - Validate voucher code
router.post(
  '/validate',
  body('code').isString().notEmpty().withMessage('Code is required'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { code } = req.body;
      const vouchers = await loadVouchers();
      const voucher = vouchers.find(v => v.code.toUpperCase() === code.toUpperCase() && !v.isUsed);

      if (!voucher) {
        return res.status(404).json({
          success: false,
          error: 'Ungültiger oder bereits verwendeter Gutscheincode',
        });
      }

      res.json({
        success: true,
        data: {
          code: voucher.code,
          value: voucher.value,
          isPercentage: voucher.isPercentage || false,
        },
      });
    } catch (error) {
      logger.error('Error validating voucher:', error);
      res.status(500).json({ success: false, error: 'Failed to validate voucher' });
    }
  }
);

// POST /api/vouchers/use - Mark voucher as used
router.post(
  '/use',
  body('code').isString().notEmpty(),
  body('customerEmail').isEmail(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { code, customerEmail } = req.body;
      const vouchers = await loadVouchers();
      const voucherIndex = vouchers.findIndex(
        v => v.code.toUpperCase() === code.toUpperCase() && !v.isUsed
      );

      if (voucherIndex === -1) {
        return res.status(404).json({
          success: false,
          error: 'Ungültiger oder bereits verwendeter Gutscheincode',
        });
      }

      vouchers[voucherIndex].isUsed = true;
      vouchers[voucherIndex].usedBy = customerEmail;
      vouchers[voucherIndex].usedAt = new Date().toISOString();

      await saveVouchers(vouchers);
      logger.info(`Voucher ${code} used by ${customerEmail}`);

      res.json({ success: true, data: vouchers[voucherIndex] });
    } catch (error) {
      logger.error('Error using voucher:', error);
      res.status(500).json({ success: false, error: 'Failed to use voucher' });
    }
  }
);

// POST /api/vouchers - Create new voucher (Admin only)
router.post(
  '/',
  authenticateToken,
  requireAdmin,
  body('value').isFloat({ min: 1 }).withMessage('Value must be at least 1'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { value } = req.body;
      const vouchers = await loadVouchers();

      const newVoucher: Voucher = {
        id: generateId(),
        code: generateVoucherCode(),
        value: parseFloat(value),
        isUsed: false,
        createdAt: new Date().toISOString(),
      };

      vouchers.push(newVoucher);
      await saveVouchers(vouchers);
      logger.info(`New voucher created: ${newVoucher.code} (${value}€)`);

      res.status(201).json({ success: true, data: newVoucher });
    } catch (error) {
      logger.error('Error creating voucher:', error);
      res.status(500).json({ success: false, error: 'Failed to create voucher' });
    }
  }
);

// DELETE /api/vouchers/:id - Delete voucher (Admin only)
router.delete(
  '/:id',
  authenticateToken,
  requireAdmin,
  param('id').isString(),
  async (req, res) => {
    try {
      const { id } = req.params;
      const vouchers = await loadVouchers();
      const filteredVouchers = vouchers.filter(v => v.id !== id);

      if (filteredVouchers.length === vouchers.length) {
        return res.status(404).json({ success: false, error: 'Voucher not found' });
      }

      await saveVouchers(filteredVouchers);
      logger.info(`Voucher ${id} deleted`);

      res.json({ success: true, message: 'Voucher deleted successfully' });
    } catch (error) {
      logger.error('Error deleting voucher:', error);
      res.status(500).json({ success: false, error: 'Failed to delete voucher' });
    }
  }
);

export default router;
