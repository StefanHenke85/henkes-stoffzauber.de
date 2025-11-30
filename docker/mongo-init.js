// MongoDB initialization script
// This runs on first container start

db = db.getSiblingDB('henkes-stoffzauber');

// Create indexes for products collection
db.products.createIndex({ name: 'text', description: 'text' });
db.products.createIndex({ isFeatured: 1, isActive: 1 });
db.products.createIndex({ price: 1 });
db.products.createIndex({ createdAt: -1 });

// Create indexes for orders collection
db.orders.createIndex({ orderNumber: 1 });
db.orders.createIndex({ 'customer.email': 1 });
db.orders.createIndex({ orderStatus: 1 });
db.orders.createIndex({ paymentStatus: 1 });
db.orders.createIndex({ createdAt: -1 });

// Create indexes for admins collection
db.admins.createIndex({ username: 1 });
db.admins.createIndex({ email: 1 });

print('Database initialized with indexes');
