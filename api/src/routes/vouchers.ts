import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';

const router = Router();

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
    const { data: vouchers, error } = await supabase
      .from('vouchers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error loading vouchers:', error);
      return res.status(500).json({ success: false, error: 'Failed to load vouchers' });
    }

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

      const { data: voucher, error } = await supabase
        .from('vouchers')
        .select('*')
        .ilike('code', code)
        .eq('is_used', false)
        .single();

      if (error || !voucher) {
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
          isPercentage: voucher.is_percentage || false,
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

      const { data: voucher, error: fetchError } = await supabase
        .from('vouchers')
        .select('*')
        .ilike('code', code)
        .eq('is_used', false)
        .single();

      if (fetchError || !voucher) {
        return res.status(404).json({
          success: false,
          error: 'Ungültiger oder bereits verwendeter Gutscheincode',
        });
      }

      const { data: updatedVoucher, error: updateError } = await supabase
        .from('vouchers')
        .update({
          is_used: true,
          used_by: customerEmail,
          used_at: new Date().toISOString(),
        })
        .eq('id', voucher.id)
        .select()
        .single();

      if (updateError) {
        logger.error('Error using voucher:', updateError);
        return res.status(500).json({ success: false, error: 'Failed to use voucher' });
      }

      logger.info(`Voucher ${code} used by ${customerEmail}`);
      res.json({ success: true, data: updatedVoucher });
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
      const voucherId = `${Date.now()}`;

      const newVoucherData = {
        id: voucherId,
        code: generateVoucherCode(),
        value: parseFloat(value),
        is_percentage: false,
        is_used: false,
      };

      const { data: newVoucher, error } = await supabase
        .from('vouchers')
        .insert(newVoucherData)
        .select()
        .single();

      if (error) {
        logger.error('Error creating voucher:', error);
        return res.status(500).json({ success: false, error: 'Failed to create voucher' });
      }

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

      const { error } = await supabase
        .from('vouchers')
        .delete()
        .eq('id', id);

      if (error) {
        logger.error('Error deleting voucher:', error);
        return res.status(404).json({ success: false, error: 'Voucher not found' });
      }

      logger.info(`Voucher ${id} deleted`);
      res.json({ success: true, message: 'Voucher deleted successfully' });
    } catch (error) {
      logger.error('Error deleting voucher:', error);
      res.status(500).json({ success: false, error: 'Failed to delete voucher' });
    }
  }
);

export default router;
