import { Router, Response, Request } from 'express';
import bcrypt from 'bcryptjs';
import { supabase } from '../config/supabase';
import { AuthRequest, ApiResponse } from '../types';
import {
  authenticateToken,
  generateToken,
  setAuthCookie,
  clearAuthCookie,
  authRateLimiter,
} from '../middleware';
import { env } from '../config/environment';
import { logger } from '../utils/logger';

const router = Router();

// Ensure initial admin exists
async function ensureInitialAdmin() {
  try {
    const { data: existingAdmins, error } = await supabase
      .from('admins')
      .select('count');

    if (error || !existingAdmins || existingAdmins.length === 0) {
      const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 12);
      const adminId = `${Date.now()}`;

      await supabase.from('admins').insert({
        id: adminId,
        username: env.ADMIN_USERNAME,
        email: env.ADMIN_EMAIL,
        password_hash: passwordHash,
        role: 'superadmin',
        is_active: true,
      });

      logger.info(`Initial admin created: ${env.ADMIN_USERNAME}`);
    }
  } catch (error) {
    logger.error('Failed to ensure initial admin:', error);
  }
}

// Run on module load
ensureInitialAdmin();

/**
 * POST /api/auth/login
 * Admin login
 */
router.post(
  '/login',
  authRateLimiter,
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          error: 'Benutzername und Passwort erforderlich',
        });
      }

      const { data: admin, error } = await supabase
        .from('admins')
        .select('*')
        .eq('username', username)
        .single();

      if (error || !admin) {
        return res.status(401).json({
          success: false,
          error: 'Ungültige Anmeldedaten',
        });
      }

      if (!admin.is_active) {
        return res.status(401).json({
          success: false,
          error: 'Konto deaktiviert',
        });
      }

      const isPasswordValid = await bcrypt.compare(password, admin.password_hash);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: 'Ungültige Anmeldedaten',
        });
      }

      // Update last login
      await supabase
        .from('admins')
        .update({ last_login: new Date().toISOString() })
        .eq('id', admin.id);

      // Generate JWT token
      const token = generateToken({
        userId: admin.id,
        username: admin.username,
        role: admin.role,
      });

      // Set httpOnly cookie
      setAuthCookie(res, token);

      logger.info(`Admin logged in: ${admin.username}`);

      res.json({
        success: true,
        data: {
          user: {
            id: admin.id,
            username: admin.username,
            email: admin.email,
            role: admin.role,
          },
          token, // Also send token for clients that need it
        },
        message: 'Erfolgreich angemeldet',
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: 'Anmeldefehler',
      });
    }
  }
);

/**
 * POST /api/auth/logout
 * Admin logout
 */
router.post('/logout', (req: Request, res: Response<ApiResponse>) => {
  clearAuthCookie(res);
  res.json({
    success: true,
    message: 'Erfolgreich abgemeldet',
  });
});

/**
 * GET /api/auth/verify
 * Verify current token
 */
router.get(
  '/verify',
  authenticateToken,
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    try {
      const { data: admin, error } = await supabase
        .from('admins')
        .select('*')
        .eq('id', req.user!.userId)
        .single();

      if (error || !admin || !admin.is_active) {
        return res.status(401).json({
          success: false,
          error: 'Ungültiger Benutzer',
        });
      }

      res.json({
        success: true,
        data: {
          user: {
            id: admin.id,
            username: admin.username,
            email: admin.email,
            role: admin.role,
          },
        },
      });
    } catch (error) {
      logger.error('Verify error:', error);
      res.status(500).json({
        success: false,
        error: 'Verifizierungsfehler',
      });
    }
  }
);

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get(
  '/me',
  authenticateToken,
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    try {
      const { data: admin, error } = await supabase
        .from('admins')
        .select('*')
        .eq('id', req.user!.userId)
        .single();

      if (error || !admin || !admin.is_active) {
        return res.status(401).json({
          success: false,
          error: 'Ungültiger Benutzer',
        });
      }

      res.json({
        success: true,
        data: {
          user: {
            id: admin.id,
            username: admin.username,
            email: admin.email,
            role: admin.role,
          },
        },
      });
    } catch (error) {
      logger.error('Get me error:', error);
      res.status(500).json({
        success: false,
        error: 'Fehler beim Abrufen des Benutzers',
      });
    }
  }
);

export default router;
