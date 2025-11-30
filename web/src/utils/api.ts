import axios, { AxiosError } from 'axios';
import type { ApiResponse, Product, Order, CheckoutData, CheckoutResponse, PaginatedResponse, AuthUser, Fabric } from '@/types';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
    const { data } = await api.get<ApiResponse<Product[]>>('/products');
    return data.data || [];
  },

  getFeatured: async (): Promise<Product[]> => {
    const { data } = await api.get<ApiResponse<Product[]>>('/products/featured');
    return data.data || [];
  },

  getById: async (id: string): Promise<Product | null> => {
    const { data } = await api.get<ApiResponse<Product>>(`/products/${id}`);
    return data.data || null;
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
    const { data } = await api.get<ApiResponse<Fabric[]>>('/fabrics');
    return data.data || [];
  },

  getFeatured: async (): Promise<Fabric[]> => {
    const { data } = await api.get<ApiResponse<Fabric[]>>('/fabrics/featured');
    return data.data || [];
  },

  getById: async (id: string): Promise<Fabric | null> => {
    const { data } = await api.get<ApiResponse<Fabric>>(`/fabrics/${id}`);
    return data.data || null;
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

export default api;
