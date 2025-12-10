import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { env, isProd } from '../config/environment';
import { logger } from '../utils/logger';

// Helmet configuration for security headers
export const helmetMiddleware = helmet({
  contentSecurityPolicy: isProd
    ? {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
          scriptSrc: ["'self'", 'https://www.paypal.com', 'https://www.paypalobjects.com'],
          frameSrc: ["'self'", 'https://www.paypal.com', 'https://www.sandbox.paypal.com'],
          connectSrc: ["'self'", 'https://www.paypal.com', 'https://www.sandbox.paypal.com'],
        },
      }
    : false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
});

// CORS configuration
const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim());

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin) || !isProd) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Disposition'],
  maxAge: 86400, // 24 hours
});

// Rate limiting for general API
export const generalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: isProd ? env.RATE_LIMIT_MAX_REQUESTS : 1000, // Much higher limit in development
  message: {
    success: false,
    error: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks and in development mode for static files
    if (req.path === '/health') return true;
    if (!isProd && req.path.startsWith('/api/uploads/')) return true;
    return false;
  },
});

// Stricter rate limiting for authentication routes
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  message: {
    success: false,
    error: 'Zu viele Anmeldeversuche. Bitte warten Sie 15 Minuten.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for checkout/orders
export const checkoutRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 orders per hour
  message: {
    success: false,
    error: 'Zu viele Bestellungen. Bitte versuchen Sie es später erneut.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Request logging middleware
export const requestLogger = (req: Request, _res: Response, next: NextFunction): void => {
  const start = Date.now();

  _res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = _res.statusCode >= 400 ? 'warn' : 'info';

    logger[logLevel](
      `${req.method} ${req.originalUrl} ${_res.statusCode} - ${duration}ms - ${req.ip}`
    );
  });

  next();
};

// Error handler for unhandled errors
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error('Unhandled error:', err);

  res.status(500).json({
    success: false,
    error: isProd ? 'Ein Fehler ist aufgetreten' : err.message,
  });
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.originalUrl} nicht gefunden`,
  });
};
