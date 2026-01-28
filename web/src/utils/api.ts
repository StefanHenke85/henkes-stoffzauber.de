import axios, { AxiosError } from 'axios';
import type { ApiResponse, Product, Order, CheckoutData, CheckoutResponse, PaginatedResponse, AuthUser, Fabric } from '@/types';

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper function to get cached data
const getCached = <T>(key: string): T | null => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data as T;
  }
  cache.delete(key);
  return null;
};

// Helper function to set cached data
const setCached = (key: string, data: any): void => {
  cache.set(key, { data, timestamp: Date.now() });
};

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse>) => {
    const message = error.response?.data?.error || 'Ein Fehler ist aufgetreten';
    return Promise.reject(new Error(message));
  }
);

// Products API
export const productsApi = {
  getAll: async (): Promise<Product[]> => {
    const cacheKey = 'products:all';
    const cached = getCached<Product[]>(cacheKey);
    if (cached) return cached;

    const { data } = await api.get<ApiResponse<Product[]>>('/products');
    const products = data.data || [];
    setCached(cacheKey, products);
    return products;
  },

  getFeatured: async (): Promise<Product[]> => {
    const cacheKey = 'products:featured';
    const cached = getCached<Product[]>(cacheKey);
    if (cached) return cached;

    const { data } = await api.get<ApiResponse<Product[]>>('/products/featured');
    const products = data.data || [];
    setCached(cacheKey, products);
    return products;
  },

  getById: async (id: string): Promise<Product | null> => {
    const cacheKey = `products:${id}`;
    const cached = getCached<Product | null>(cacheKey);
    if (cached) return cached;

    const { data } = await api.get<ApiResponse<Product>>(`/products/${id}`);
    const product = data.data || null;
    setCached(cacheKey, product);
    return product;
  },

  // Admin methods
  getAdmin: async (page = 1, limit = 20, search?: string): Promise<PaginatedResponse<Product>> => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.append('search', search);
    const { data } = await api.get<ApiResponse<PaginatedResponse<Product>>>(`/products/admin?${params}`);
    return data.data!;
  },

  create: async (formData: FormData): Promise<Product> => {
    const { data } = await api.post<ApiResponse<Product>>('/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data!;
  },

  update: async (id: string, formData: FormData): Promise<Product> => {
    const { data } = await api.put<ApiResponse<Product>>(`/products/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data!;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/products/${id}`);
  },
};

// Orders/Checkout API
export const ordersApi = {
  checkout: async (checkoutData: CheckoutData): Promise<CheckoutResponse> => {
    const { data } = await api.post<ApiResponse<CheckoutResponse>>('/checkout', checkoutData);
    return data.data!;
  },

  capturePayment: async (orderId: string): Promise<Order> => {
    const { data } = await api.post<ApiResponse<Order>>(`/checkout/capture/${orderId}`);
    return data.data!;
  },

  getOrder: async (orderId: string): Promise<Order | null> => {
    const { data } = await api.get<ApiResponse<Order>>(`/checkout/order/${orderId}`);
    return data.data || null;
  },

  // Admin methods
  getAdmin: async (page = 1, limit = 20, status?: string): Promise<PaginatedResponse<Order>> => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) params.append('status', status);
    const { data } = await api.get<ApiResponse<PaginatedResponse<Order>>>(`/orders/admin?${params}`);
    return data.data!;
  },

  getAdminById: async (id: string): Promise<Order | null> => {
    const { data } = await api.get<ApiResponse<Order>>(`/orders/admin/${id}`);
    return data.data || null;
  },

  updateStatus: async (
    id: string,
    updates: Partial<Pick<Order, 'orderStatus' | 'paymentStatus' | 'trackingNumber'>>
  ): Promise<Order> => {
    const { data } = await api.patch<ApiResponse<Order>>(`/orders/admin/${id}`, updates);
    return data.data!;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/orders/admin/${id}`);
  },
};

// Auth API
export const authApi = {
  login: async (username: string, password: string): Promise<AuthUser> => {
    const { data } = await api.post<ApiResponse<{ user: AuthUser }>>('/auth/login', {
      username,
      password,
    });
    return data.data!.user;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  verify: async (): Promise<boolean> => {
    try {
      const { data } = await api.get<ApiResponse<{ valid: boolean }>>('/auth/verify');
      return data.data?.valid || false;
    } catch {
      return false;
    }
  },

  getMe: async (): Promise<AuthUser | null> => {
    try {
      const { data } = await api.get<ApiResponse<{ user: AuthUser }>>('/auth/me');
      return data.data?.user || null;
    } catch {
      return null;
    }
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await api.post('/auth/change-password', { currentPassword, newPassword });
  },
};

// Fabrics API
export const fabricsApi = {
  getAll: async (): Promise<Fabric[]> => {
    const cacheKey = 'fabrics:all';
    const cached = getCached<Fabric[]>(cacheKey);
    if (cached) return cached;

    const { data } = await api.get<ApiResponse<Fabric[]>>('/fabrics');
    const fabrics = data.data || [];
    setCached(cacheKey, fabrics);
    return fabrics;
  },

  getFeatured: async (): Promise<Fabric[]> => {
    const cacheKey = 'fabrics:featured';
    const cached = getCached<Fabric[]>(cacheKey);
    if (cached) return cached;

    const { data } = await api.get<ApiResponse<Fabric[]>>('/fabrics/featured');
    const fabrics = data.data || [];
    setCached(cacheKey, fabrics);
    return fabrics;
  },

  getById: async (id: string): Promise<Fabric | null> => {
    const cacheKey = `fabrics:${id}`;
    const cached = getCached<Fabric | null>(cacheKey);
    if (cached) return cached;

    const { data } = await api.get<ApiResponse<Fabric>>(`/fabrics/${id}`);
    const fabric = data.data || null;
    setCached(cacheKey, fabric);
    return fabric;
  },

  // Admin methods
  getAdmin: async (): Promise<Fabric[]> => {
    const { data } = await api.get<ApiResponse<Fabric[]>>('/fabrics/admin');
    return data.data || [];
  },

  create: async (formData: FormData): Promise<Fabric> => {
    const { data } = await api.post<ApiResponse<Fabric>>('/fabrics', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data!;
  },

  update: async (id: string, formData: FormData): Promise<Fabric> => {
    const { data } = await api.put<ApiResponse<Fabric>>(`/fabrics/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data!;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/fabrics/${id}`);
  },
};

// Vouchers API
export const vouchersApi = {
  validate: async (code: string): Promise<{ code: string; value: number; isPercentage?: boolean }> => {
    const { data } = await api.post<ApiResponse<{ code: string; value: number; isPercentage?: boolean }>>('/vouchers/validate', { code });
    return data.data!;
  },

  use: async (code: string, customerEmail: string): Promise<void> => {
    await api.post('/vouchers/use', { code, customerEmail });
  },

  // Admin methods
  getAll: async (): Promise<Array<{ id: string; code: string; value: number; isUsed: boolean; usedBy?: string; usedAt?: string; createdAt: string }>> => {
    const { data } = await api.get('/vouchers');
    return data.data || [];
  },

  create: async (value: number): Promise<{ id: string; code: string; value: number }> => {
    const { data } = await api.post('/vouchers', { value });
    return data.data!;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/vouchers/${id}`);
  },
};

// Patterns API (Schnittmuster)
export const patternsApi = {
  getAll: async (search?: string, type?: string): Promise<ApiResponse<Array<{
    id: string;
    filename: string;
    name: string;
    type: 'pdf' | 'zip';
    size: number;
    sizeFormatted: string;
    createdAt: string;
    modifiedAt: string;
  }>>> => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (type && type !== 'all') params.append('type', type);
    const { data } = await api.get(`/patterns?${params}`);
    return data;
  },

  getPreviewUrl: (id: string): string => {
    return `/api/patterns/${id}/preview`;
  },

  getDownloadUrl: async (id: string): Promise<string> => {
    return `/api/patterns/${id}/download`;
  },

  createShareLink: async (id: string): Promise<ApiResponse<{
    shareUrl: string;
    expiresAt: string;
    expiresIn: string;
  }>> => {
    const { data } = await api.post(`/patterns/${id}/share`);
    return data;
  },

  getActiveShares: async (): Promise<ApiResponse<Array<{
    token: string;
    filename: string;
    expiresAt: string;
    createdBy: string;
    shareUrl: string;
  }>>> => {
    const { data } = await api.get('/patterns/shares/active');
    return data;
  },

  deleteShare: async (token: string): Promise<void> => {
    await api.delete(`/patterns/shares/${token}`);
  },
};

export default api;
