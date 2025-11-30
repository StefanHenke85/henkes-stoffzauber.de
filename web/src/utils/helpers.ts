const FALLBACK_IMAGE = 'https://placehold.co/400x400/F2B2B4/ffffff?text=Stoffzauber';

/**
 * Get optimized image URL (prefer WebP)
 */
export function getImageUrl(
  imageUrl?: string,
  webpUrl?: string,
  _thumbnail = false
): string {
  if (!imageUrl) return FALLBACK_IMAGE;

  // If WebP is available and browser supports it
  if (webpUrl && supportsWebP()) {
    return webpUrl;
  }

  // Return original if starts with /uploads/
  if (imageUrl.startsWith('/uploads/')) {
    return imageUrl;
  }

  return imageUrl || FALLBACK_IMAGE;
}

/**
 * Check WebP support
 */
let webpSupported: boolean | null = null;

export function supportsWebP(): boolean {
  if (webpSupported !== null) return webpSupported;

  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  webpSupported = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  return webpSupported;
}

/**
 * Format currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

/**
 * Format date
 */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: Parameters<T>) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Truncate text
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Get order status label
 */
export function getOrderStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    new: 'Neu',
    processing: 'In Bearbeitung',
    shipped: 'Versandt',
    delivered: 'Geliefert',
    cancelled: 'Storniert',
  };
  return labels[status] || status;
}

/**
 * Get payment status label
 */
export function getPaymentStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Ausstehend',
    paid: 'Bezahlt',
    failed: 'Fehlgeschlagen',
    refunded: 'Erstattet',
  };
  return labels[status] || status;
}

/**
 * Get payment method label
 */
export function getPaymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    paypal: 'PayPal',
    invoice: 'Rechnung',
    prepayment: 'Vorkasse',
  };
  return labels[method] || method;
}

/**
 * Validate email
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate German postal code
 */
export function isValidZip(zip: string): boolean {
  return /^\d{5}$/.test(zip);
}

/**
 * classNames helper (like clsx)
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
