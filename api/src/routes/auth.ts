import { Router, Response, Request } from 'express';
import bcrypt from 'bcryptjs';
import { adminsStore } from '../data/jsonStore';
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
  if (!adminsStore.exists()) {
    const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 12);
    adminsStore.create({
      username: env.ADMIN_USERNAME,
      email: env.ADMIN_EMAIL,
      passwordHash,
      role: 'superadmin',
      isActive: true,
    });
    logger.info(`Initial admin created: ${env.ADMIN_USERNAME}`);
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
        res.status(400).json({
          success: false,
          error: 'Benutzername und Passwort erforderlich',
        });
        return;
      }

      const admin = adminsStore.getByUsername(username);

      if (!admin) {
        res.status(401).json({
          success: false,
          error: 'Ungültige Anmeldedaten',
        });
        return;
      }

      if (!admin.isActive) {
        res.status(401).json({
          success: false,
          error: 'Konto deaktiviert',
        });
        return;
      }

      const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);

      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          error: 'Ungültige Anmeldedaten',
        });
        return;
      }

      // Update last login
      adminsStore.update(admin.id, { lastLogin: new Date().toISOString() });

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
      const admin = adminsStore.getById(req.user!.userId);

      if (!admin || !admin.isActive) {
        res.status(401).json({
          success: false,
          error: 'Ungültiger Benutzer',
        });
        return;
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
      const admin = adminsStore.getById(req.user!.userId);

      if (!admin || !admin.isActive) {
        res.status(401).json({
          success: false,
          error: 'Ungültiger Benutzer',
        });
        return;
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
