import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3001'),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // Admin (initial setup)
  ADMIN_USERNAME: z.string().default('admin'),
  ADMIN_PASSWORD: z.string().min(8),
  ADMIN_EMAIL: z.string().email().default('admin@henkes-stoffzauber.de'),

  // CORS
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  ALLOWED_ORIGINS: z.string().default('http://localhost:5173,https://henkes-stoffzauber.de'),

  // Email (Gmail SMTP for now)
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.string().transform(Number).default('587'),
  SMTP_USER: z.string().email(),
  SMTP_PASS: z.string(),
  SHOP_EMAIL: z.string().email().default('info@henkes-stoffzauber.de'),

  // PayPal
  PAYPAL_ENV: z.enum(['sandbox', 'live']).default('sandbox'),
  PAYPAL_CLIENT_ID: z.string(),
  PAYPAL_CLIENT_SECRET: z.string(),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),

  // File Upload
  MAX_FILE_SIZE_MB: z.string().transform(Number).default('5'),
  UPLOAD_PATH: z.string().default('./uploads'),
});

const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      console.error('Environment validation failed:');
      missingVars.forEach(v => console.error(`  - ${v}`));
      process.exit(1);
    }
    throw error;
  }
};

export const env = parseEnv();

export const isProd = env.NODE_ENV === 'production';
export const isDev = env.NODE_ENV === 'development';
