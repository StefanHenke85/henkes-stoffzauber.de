// Fabric types
export interface Fabric {
  id: string;
  _id?: string;
  name: string;
  description: string;
  imageUrl?: string;
  isFeatured: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Product types
export interface Product {
  id: string;
  _id?: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string;
  imageUrlWebp?: string;
  thumbnailUrl?: string;
  fabrics?: string;
  availableFabrics?: string[]; // Array of fabric IDs
  isFeatured: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Cart types
export interface CartItem extends Product {
  quantity: number;
  selectedFabrics?: Array<{ fabricId: string; fabricName: string }>; // Selected fabrics
}

// Customer types
export interface Customer {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  street: string;
  houseNumber: string;
  zip: string;
  city: string;
  country?: string;
}

// Order types
export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  selectedFabrics?: Array<{ fabricId: string; fabricName: string }>;
}

export interface Order {
  id: string;
  orderNumber: string;
  customer: Customer;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  paymentMethod: 'paypal' | 'invoice' | 'prepayment';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  orderStatus: 'new' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  invoicePath?: string;
  trackingNumber?: string;
  createdAt?: string;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Array<{ field: string; message: string }>;
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

// Fabric types
export interface Fabric {
  id: string;
  name: string;
  description: string;
  fabricType: string;
  imageUrl: string;
  imageUrlWebp?: string;
  thumbnailUrl?: string;
  color?: string;
  pattern?: string;
  material?: string;
  width?: number;
  isActive: boolean;
  isFeatured: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Auth types
export interface AuthUser {
  username: string;
  role: string;
}

// Checkout types
export interface CheckoutData {
  cart: CartItem[];
  address: Customer;
  paymentMethod: 'paypal' | 'invoice' | 'prepayment';
}

export interface CheckoutResponse {
  order: Order;
  approvalUrl?: string;
}
