import express from 'express';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import path from 'path';
import fs from 'fs';

// Load environment variables first
import { env, isProd } from './config/environment';
import { logger } from './utils/logger';
import {
  helmetMiddleware,
  corsMiddleware,
  generalRateLimiter,
  requestLogger,
  errorHandler,
  notFoundHandler,
} from './middleware';
import routes from './routes';
import { testEmailConnection } from './services';

const app = express();

// Ensure required directories exist
const uploadsDir = path.resolve(env.UPLOAD_PATH);
const dataDir = path.resolve('./data');
const invoicesDir = path.resolve('./invoices');

[uploadsDir, dataDir, invoicesDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    logger.info(`Created directory: ${dir}`);
  }
});

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmetMiddleware);
app.use(corsMiddleware);

// General middleware
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Request logging
if (isProd) {
  app.use(requestLogger);
}

// Rate limiting
app.use('/api', generalRateLimiter);

// Health check endpoint (before rate limiting)
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// Static files for uploads
app.use('/uploads', express.static(uploadsDir, {
  maxAge: isProd ? '7d' : 0,
  etag: true,
}));

// Static files for invoices (only accessible to admin)
app.use('/invoices', express.static(invoicesDir, {
  maxAge: 0,
}));

// API routes
app.use('/api', routes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Test email connection (optional, don't fail if it doesn't work)
    try {
      await testEmailConnection();
    } catch (emailError) {
      logger.warn('Email connection test failed (non-critical):', emailError);
    }

    // Start listening
    app.listen(env.PORT, () => {
      logger.info(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
      logger.info(`API available at http://localhost:${env.PORT}/api`);
      logger.info(`Using JSON file storage in: ${dataDir}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
  process.exit(1);
});

export default app;
