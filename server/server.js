require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const paypal = require('@paypal/checkout-server-sdk');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

// File paths
const productsFile = path.join(__dirname, 'products.json');

// JSON helpers
const safeReadJSON = (file) => {
  try {
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, '[]', 'utf8');
      return [];
    }
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return [];
  }
};
const safeWriteJSON = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');

const loadProducts = () => safeReadJSON(productsFile);
const saveProducts = (arr) => safeWriteJSON(productsFile, arr);

// Multer config
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadsDir),
  filename: (_, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// Admin
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "stoffzauber2025";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "stoffzauber2025";

const checkAdmin = (req, res, next) => {
  if (req.headers.authorization !== `Bearer ${ADMIN_TOKEN}`)
    return res.status(401).json({ error: "Unauthorized" });
  next();
};

// ---------------- PRODUCTS ----------------
app.get('/api/products', (_, res) => res.json(loadProducts()));
app.post('/api/products', checkAdmin, upload.single('imageFile'), (req, res) => {
  const products = loadProducts();
  const id = Date.now().toString();
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : (req.body.imageUrl || "");

  const newProduct = {
    id,
    name: req.body.name || "",
    description: req.body.description || "",
    price: Number(req.body.price || 0),
    stock: Number(req.body.stock || 0),
    isFeatured: req.body.isFeatured === "true",
    imageUrl
  };

  products.push(newProduct);
  saveProducts(products);
  res.json(newProduct);
});

// ---------------- DELETE PRODUCT ----------------
app.delete('/api/products/:id', checkAdmin, (req, res) => {
  const products = loadProducts();
  const id = String(req.params.id);
  const index = products.findIndex(p => String(p.id) === id);

  if (index === -1) return res.status(404).json({ error: "Produkt nicht gefunden" });

  const deleted = products.splice(index, 1)[0];
  saveProducts(products);

  // Bild löschen, falls vorhanden
  if (deleted.imageUrl && deleted.imageUrl.startsWith('/uploads/')) {
    const filePath = path.join(__dirname, deleted.imageUrl);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  res.json({ success: true, deleted });
});

// ---------------- ADMIN LOGIN ----------------
app.post('/api/admin/login', (req, res) => {
  if (req.body.password === ADMIN_PASSWORD)
    return res.json({ token: ADMIN_TOKEN });
  res.status(401).json({ error: "Falsches Passwort" });
});

// ---------------- START SERVER ----------------
app.listen(PORT, () => console.log(`Server läuft auf port ${PORT}`));
