// Product types
export type SizeType = 'headCircumference' | 'clothing' | 'oneSize' | 'dimensions';

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
  maskUrl?: string; // Chameleon mask image URL
  fabricScale?: number; // Fabric pattern scale multiplier (0.25-3.0, default 1.0)
  productScale?: number; // Product scale multiplier for preview (0.25-3.0, default 1.0)
  fabrics?: string;
  availableFabrics?: string[]; // Array of fabric IDs
  isFeatured: boolean;
  isActive: boolean;
  sizeType?: SizeType; // Type of size selection
  availableSizes?: string[]; // e.g., ['S', 'M', 'L'] or ['52', '54', '56']
  tailorId?: string; // ID des Verkäufers
  tailorName?: string; // Name des Verkäufers
  createdAt?: string;
  updatedAt?: string;
}

// Cart types
export interface CartItem extends Product {
  quantity: number;
  selectedOuterFabric?: { fabricId: string; fabricName: string; fabricImageUrl?: string }; // Outer fabric
  selectedInnerFabric?: { fabricId: string; fabricName: string; fabricImageUrl?: string }; // Inner fabric
  selectedSize?: string; // Selected size
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
  selectedOuterFabric?: { fabricId: string; fabricName: string; fabricImageUrl?: string };
  selectedInnerFabric?: { fabricId: string; fabricName: string; fabricImageUrl?: string };
  selectedSize?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customer: Customer;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  paymentMethod: 'paypal' | 'invoice' | 'prepayment' | 'cash_on_pickup';
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
  _id?: string;
  name: string;
  description: string;
  fabricType: string;
  imageUrl?: string;
  imageUrlWebp?: string;
  thumbnailUrl?: string;
  color?: string;
  pattern?: string;
  material?: string;
  width?: number;
  isActive: boolean;
  isFeatured: boolean;
  tailorId?: string;
  tailorName?: string;
  tailorEmail?: string;
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
  paymentMethod: 'paypal' | 'invoice' | 'prepayment' | 'cash_on_pickup';
  customerNotes?: string;
}

export interface CheckoutResponse {
  order: Order;
  approvalUrl?: string;
}
