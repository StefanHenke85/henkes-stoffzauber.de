import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, JwtPayload, ApiResponse } from '../types';
import { env } from '../config/environment';
import { logger } from '../utils/logger';

export const authenticateToken = (
  req: AuthRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): void => {
  try {
    // Get token from httpOnly cookie or Authorization header (for backwards compatibility)
    const tokenFromCookie = req.cookies?.authToken;
    const authHeader = req.headers.authorization;
    const tokenFromHeader = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    const token = tokenFromCookie || tokenFromHeader;

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Authentifizierung erforderlich',
      });
      return;
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: 'Token abgelaufen. Bitte erneut anmelden.',
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: 'Ungültiger Token',
      });
      return;
    }

    logger.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentifizierungsfehler',
    });
  }
};

export const requireAdmin = (
  req: AuthRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): void => {
  if (!req.user || !['admin', 'superadmin'].includes(req.user.role)) {
    res.status(403).json({
      success: false,
      error: 'Admin-Berechtigung erforderlich',
    });
    return;
  }
  next();
};

export const requireSuperAdmin = (
  req: AuthRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): void => {
  if (!req.user || req.user.role !== 'superadmin') {
    res.status(403).json({
      success: false,
      error: 'Superadmin-Berechtigung erforderlich',
    });
    return;
  }
  next();
};

export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as string,
  } as jwt.SignOptions);
};

export const setAuthCookie = (res: Response, token: string): void => {
  res.cookie('authToken', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export const clearAuthCookie = (res: Response): void => {
  res.clearCookie('authToken', {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
};
