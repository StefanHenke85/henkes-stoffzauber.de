import crypto from 'crypto';

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Sanitize filename
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Format date to ISO string
 */
export function formatDate(date: Date = new Date()): string {
  return date.toISOString();
}

/**
 * Generate random string
 */
export function randomString(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex').slice(0, length);
}
