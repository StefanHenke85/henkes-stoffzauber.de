import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

const DATA_DIR = path.join(__dirname, '../../data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string;
  imageUrlWebp?: string;
  thumbnailUrl?: string;
  fabrics?: string;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

export interface Customer {
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
  paypalOrderId?: string;
  invoicePath?: string;
  trackingNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Admin {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'superadmin';
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

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
  createdAt: string;
  updatedAt: string;
}

// Generic JSON file helpers
function readJsonFile<T>(filename: string, defaultValue: T[] = []): T[] {
  const filepath = path.join(DATA_DIR, filename);
  try {
    if (!fs.existsSync(filepath)) {
      fs.writeFileSync(filepath, JSON.stringify(defaultValue, null, 2), 'utf8');
      return defaultValue;
    }
    const data = fs.readFileSync(filepath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    logger.error(`Error reading ${filename}:`, error);
    return defaultValue;
  }
}

function writeJsonFile<T>(filename: string, data: T[]): void {
  const filepath = path.join(DATA_DIR, filename);
  try {
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    logger.error(`Error writing ${filename}:`, error);
    throw error;
  }
}

// Products Store
export const productsStore = {
  getAll(): Product[] {
    return readJsonFile<Product>('products.json');
  },

  getActive(): Product[] {
    return this.getAll().filter((p: Product) => p.isActive !== false);
  },

  getFeatured(): Product[] {
    return this.getActive().filter((p: Product) => p.isFeatured);
  },

  getById(id: string): Product | undefined {
    return this.getAll().find((p: Product) => p.id === id);
  },

  create(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product {
    const products = this.getAll();
    const now = new Date().toISOString();
    const newProduct: Product = {
      ...product,
      id: Date.now().toString(),
      isActive: product.isActive ?? true,
      isFeatured: product.isFeatured ?? false,
      createdAt: now,
      updatedAt: now,
    };
    products.push(newProduct);
    writeJsonFile('products.json', products);
    return newProduct;
  },

  update(id: string, updates: Partial<Product>): Product | null {
    const products = this.getAll();
    const index = products.findIndex((p: Product) => p.id === id);
    if (index === -1) return null;

    products[index] = {
      ...products[index],
      ...updates,
      id: products[index].id, // Prevent ID change
      createdAt: products[index].createdAt, // Prevent createdAt change
      updatedAt: new Date().toISOString(),
    };
    writeJsonFile('products.json', products);
    return products[index];
  },

  delete(id: string): Product | null {
    const products = this.getAll();
    const index = products.findIndex((p: Product) => p.id === id);
    if (index === -1) return null;

    const deleted = products.splice(index, 1)[0];
    writeJsonFile('products.json', products);
    return deleted;
  },

  search(query: string): Product[] {
    const q = query.toLowerCase();
    return this.getActive().filter((p: Product) =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
    );
  },
};

// Orders Store
export const ordersStore = {
  getAll(): Order[] {
    return readJsonFile<Order>('orders.json');
  },

  getById(id: string): Order | undefined {
    return this.getAll().find((o: Order) => o.id === id);
  },

  getByOrderNumber(orderNumber: string): Order | undefined {
    return this.getAll().find((o: Order) => o.orderNumber === orderNumber);
  },

  generateOrderNumber(): string {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `HS-${year}${month}${day}-${random}`;
  },

  create(order: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>): Order {
    const orders = this.getAll();
    const now = new Date().toISOString();
    const newOrder: Order = {
      ...order,
      id: Date.now().toString(),
      orderNumber: this.generateOrderNumber(),
      createdAt: now,
      updatedAt: now,
    };
    orders.push(newOrder);
    writeJsonFile('orders.json', orders);
    return newOrder;
  },

  update(id: string, updates: Partial<Order>): Order | null {
    const orders = this.getAll();
    const index = orders.findIndex((o: Order) => o.id === id);
    if (index === -1) return null;

    orders[index] = {
      ...orders[index],
      ...updates,
      id: orders[index].id,
      orderNumber: orders[index].orderNumber,
      createdAt: orders[index].createdAt,
      updatedAt: new Date().toISOString(),
    };
    writeJsonFile('orders.json', orders);
    return orders[index];
  },

  getPaginated(page: number, limit: number, filter?: { orderStatus?: string; paymentStatus?: string }) {
    let orders = this.getAll();

    if (filter?.orderStatus) {
      orders = orders.filter((o: Order) => o.orderStatus === filter.orderStatus);
    }
    if (filter?.paymentStatus) {
      orders = orders.filter((o: Order) => o.paymentStatus === filter.paymentStatus);
    }

    // Sort by createdAt descending
    orders.sort((a: Order, b: Order) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = orders.length;
    const start = (page - 1) * limit;
    const data = orders.slice(start, start + limit);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  },
};

// Admins Store
export const adminsStore = {
  getAll(): Admin[] {
    return readJsonFile<Admin>('admins.json');
  },

  getById(id: string): Admin | undefined {
    return this.getAll().find((a: Admin) => a.id === id);
  },

  getByUsername(username: string): Admin | undefined {
    return this.getAll().find((a: Admin) => a.username.toLowerCase() === username.toLowerCase());
  },

  getByEmail(email: string): Admin | undefined {
    return this.getAll().find((a: Admin) => a.email.toLowerCase() === email.toLowerCase());
  },

  create(admin: Omit<Admin, 'id' | 'createdAt' | 'updatedAt'>): Admin {
    const admins = this.getAll();
    const now = new Date().toISOString();
    const newAdmin: Admin = {
      ...admin,
      id: Date.now().toString(),
      createdAt: now,
      updatedAt: now,
    };
    admins.push(newAdmin);
    writeJsonFile('admins.json', admins);
    return newAdmin;
  },

  update(id: string, updates: Partial<Admin>): Admin | null {
    const admins = this.getAll();
    const index = admins.findIndex((a: Admin) => a.id === id);
    if (index === -1) return null;

    admins[index] = {
      ...admins[index],
      ...updates,
      id: admins[index].id,
      createdAt: admins[index].createdAt,
      updatedAt: new Date().toISOString(),
    };
    writeJsonFile('admins.json', admins);
    return admins[index];
  },

  exists(): boolean {
    return this.getAll().length > 0;
  },
};

// Fabrics Store
export const fabricsStore = {
  getAll(): Fabric[] {
    return readJsonFile<Fabric>('fabrics.json');
  },

  getActive(): Fabric[] {
    return this.getAll().filter((f: Fabric) => f.isActive !== false);
  },

  getFeatured(): Fabric[] {
    return this.getActive().filter((f: Fabric) => f.isFeatured);
  },

  getById(id: string): Fabric | undefined {
    return this.getAll().find((f: Fabric) => f.id === id);
  },

  create(fabric: Omit<Fabric, 'id' | 'createdAt' | 'updatedAt'>): Fabric {
    const fabrics = this.getAll();
    const now = new Date().toISOString();
    const newFabric: Fabric = {
      ...fabric,
      id: Date.now().toString(),
      isActive: fabric.isActive ?? true,
      isFeatured: fabric.isFeatured ?? false,
      createdAt: now,
      updatedAt: now,
    };
    fabrics.push(newFabric);
    writeJsonFile('fabrics.json', fabrics);
    return newFabric;
  },

  update(id: string, updates: Partial<Fabric>): Fabric | null {
    const fabrics = this.getAll();
    const index = fabrics.findIndex((f: Fabric) => f.id === id);
    if (index === -1) return null;

    fabrics[index] = {
      ...fabrics[index],
      ...updates,
      id: fabrics[index].id,
      createdAt: fabrics[index].createdAt,
      updatedAt: new Date().toISOString(),
    };
    writeJsonFile('fabrics.json', fabrics);
    return fabrics[index];
  },

  delete(id: string): Fabric | null {
    const fabrics = this.getAll();
    const index = fabrics.findIndex((f: Fabric) => f.id === id);
    if (index === -1) return null;

    const deleted = fabrics.splice(index, 1)[0];
    writeJsonFile('fabrics.json', fabrics);
    return deleted;
  },

  search(query: string): Fabric[] {
    const q = query.toLowerCase();
    return this.getActive().filter((f: Fabric) =>
      f.name.toLowerCase().includes(q) ||
      f.description.toLowerCase().includes(q) ||
      f.fabricType.toLowerCase().includes(q)
    );
  },
};
