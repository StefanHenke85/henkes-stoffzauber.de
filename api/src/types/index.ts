import { Request } from 'express';

// Product Types
export interface IProduct {
  _id?: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string;
  imageUrlWebp?: string;
  thumbnailUrl?: string;
  fabrics?: string; // Comma-separated fabric IDs for backward compatibility
  availableFabrics?: string[]; // Array of fabric IDs that can be selected for this product
  isFeatured: boolean;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Customer Types
export interface ICustomer {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  street: string;
  houseNumber: string;
  zip: string;
  city: string;
  country: string;
}

// Order Types
export interface IOrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  selectedFabrics?: Array<{ fabricId: string; fabricName: string }>; // Selected fabrics for this order item
}

export interface IOrder {
  _id?: string;
  orderNumber: string;
  customer: ICustomer;
  items: IOrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  paymentMethod: 'paypal' | 'invoice' | 'prepayment' | 'cash_on_pickup';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  orderStatus: 'new' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paypalOrderId?: string;
  invoicePath?: string;
  trackingNumber?: string;
  notes?: string; // Admin notes
  customerNotes?: string; // Customer remarks/wishes
  createdAt?: Date;
  updatedAt?: Date;
}

// Admin User Types
export interface IAdmin {
  _id?: string;
  username: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'superadmin';
  isActive: boolean;
  lastLogin?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// Auth Types
export interface JwtPayload {
  userId: string;
  username: string;
  role: string;
}

export interface TailorPayload {
  id: string;
  username: string;
  name: string;
  slug: string;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
  tailor?: TailorPayload;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Array<{ field: string; message: string }>;
}

// Pagination Types
export interface PaginationParams {
  page: number;
  limit: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Email Types
export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer;
  }>;
}
