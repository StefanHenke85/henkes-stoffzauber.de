/**
 * Migration script to import existing JSON data into MongoDB
 * Run with: npx tsx src/scripts/migrate.ts
 */

import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Simplified Product schema for migration
const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  stock: Number,
  imageUrl: String,
  imageUrlWebp: String,
  thumbnailUrl: String,
  fabrics: String,
  isFeatured: Boolean,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

// Simplified Order schema for migration
const orderSchema = new mongoose.Schema({
  orderNumber: String,
  customer: {
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    street: String,
    houseNumber: String,
    zip: String,
    city: String,
    country: { type: String, default: 'Deutschland' },
  },
  items: [{
    productId: String,
    name: String,
    price: Number,
    quantity: Number,
    imageUrl: String,
  }],
  subtotal: Number,
  shipping: { type: Number, default: 0 },
  total: Number,
  paymentMethod: String,
  paymentStatus: { type: String, default: 'pending' },
  orderStatus: { type: String, default: 'new' },
  invoicePath: String,
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/henkes-stoffzauber';

// Paths to old JSON files
const OLD_SERVER_PATH = path.join(__dirname, '../../../server');
const PRODUCTS_FILE = path.join(OLD_SERVER_PATH, 'products.json');
const ORDERS_FILE = path.join(OLD_SERVER_PATH, 'orders.json');

async function migrate() {
  console.log('🚀 Starting migration...\n');

  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Migrate Products
    if (fs.existsSync(PRODUCTS_FILE)) {
      console.log('📦 Migrating products...');
      const productsData = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf8'));

      let migrated = 0;
      let skipped = 0;

      for (const product of productsData) {
        // Check if product already exists (by name)
        const existing = await Product.findOne({ name: product.name });
        if (existing) {
          console.log(`  ⏭️  Skipped (exists): ${product.name}`);
          skipped++;
          continue;
        }

        // Create new product
        const newProduct = new Product({
          name: product.name || '',
          description: product.description || '',
          price: Number(product.price) || 0,
          stock: Number(product.stock) || 0,
          imageUrl: product.imageUrl || '',
          fabrics: product.fabrics || product.fabricName || '',
          isFeatured: product.isFeatured === true || product.isFeatured === 'true',
          isActive: true,
        });

        await newProduct.save();
        console.log(`  ✅ Migrated: ${product.name}`);
        migrated++;
      }

      console.log(`\n📦 Products: ${migrated} migrated, ${skipped} skipped\n`);
    } else {
      console.log('⚠️  No products.json found, skipping...\n');
    }

    // Migrate Orders
    if (fs.existsSync(ORDERS_FILE)) {
      console.log('🛒 Migrating orders...');
      const ordersData = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));

      let migrated = 0;
      let skipped = 0;

      for (const order of ordersData) {
        // Check if order already exists (by old ID or by customer email + total)
        const orderNumber = `HS-OLD-${order.id || Date.now()}`;
        const existing = await Order.findOne({ orderNumber });
        if (existing) {
          console.log(`  ⏭️  Skipped (exists): ${orderNumber}`);
          skipped++;
          continue;
        }

        // Map old format to new format
        const items = (order.cartItems || []).map((item: { id: string; name: string; price: number; quantity: number; imageUrl?: string }) => ({
          productId: item.id || '',
          name: item.name || '',
          price: Number(item.price) || 0,
          quantity: Number(item.quantity) || 1,
          imageUrl: item.imageUrl || '',
        }));

        const subtotal = items.reduce((sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity, 0);

        const newOrder = new Order({
          orderNumber,
          customer: {
            firstName: order.customer?.firstName || '',
            lastName: order.customer?.lastName || '',
            email: order.customer?.email || '',
            phone: order.customer?.phone || '',
            street: order.customer?.street || '',
            houseNumber: order.customer?.houseNumber || '',
            zip: order.customer?.zip || '',
            city: order.customer?.city || '',
            country: 'Deutschland',
          },
          items,
          subtotal,
          shipping: 0,
          total: Number(order.total) || subtotal,
          paymentMethod: order.paymentMethod || 'invoice',
          paymentStatus: order.status === 'bezahlt' ? 'paid' : 'pending',
          orderStatus: 'processing',
        });

        await newOrder.save();
        console.log(`  ✅ Migrated: ${orderNumber}`);
        migrated++;
      }

      console.log(`\n🛒 Orders: ${migrated} migrated, ${skipped} skipped\n`);
    } else {
      console.log('⚠️  No orders.json found, skipping...\n');
    }

    console.log('✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n📡 Disconnected from MongoDB');
  }
}

// Run migration
migrate();
