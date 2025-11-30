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
const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

// Files
const productsFile = path.join(__dirname, 'products.json');
const fabricsFile = path.join(__dirname, 'fabrics.json');
const ordersFile = path.join(__dirname, 'orders.json');

const safeReadJSON = (file) => {
  try {
    if (!fs.existsSync(file)) { fs.writeFileSync(file, '[]', 'utf8'); return []; }
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch { return []; }
};
const safeWriteJSON = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');

const loadProducts = () => safeReadJSON(productsFile).map(p => ({ ...p, price: Number(p.price || 0), stock: Number(p.stock || 0), imageUrl: p.imageUrl || p.image || "" }));
const saveProducts = (arr) => safeWriteJSON(productsFile, arr);
const loadFabrics = () => safeReadJSON(fabricsFile).map(f => ({ ...f, width: Number(f.width||0), length: Number(f.length||0), imageUrl: f.imageUrl || f.image || "" }));
const saveFabrics = (arr) => safeWriteJSON(fabricsFile, arr);
const loadOrders = () => safeReadJSON(ordersFile);
const saveOrders = (arr) => safeWriteJSON(ordersFile, arr);

// Multer
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadsDir),
  filename: (_, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// Admin
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'stoffzauber2025';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'stoffzauber2025';
const checkAdmin = (req, res, next) => {
  if (req.headers.authorization !== `Bearer ${ADMIN_TOKEN}`) return res.status(401).json({ error: 'Unauthorized' });
  next();
};

// PayPal init
let payPalClient = null;
try {
  const env = process.env.PAYPAL_ENV || 'sandbox';
  const cid = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (cid && secret) {
    payPalClient = new paypal.core.PayPalHttpClient(env === 'live'
      ? new paypal.core.LiveEnvironment(cid, secret)
      : new paypal.core.SandboxEnvironment(cid, secret));
    console.log('PayPal client initialized for', env);
  } else {
    console.warn('PayPal not configured (PAYPAL_CLIENT_ID/SECRET missing).');
  }
} catch (err) { console.error('PayPal init error:', err); }

// Mailer (optional)
let mailer = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  mailer = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    tls: { rejectUnauthorized: false }
  });
}
const SHOP_EMAIL = process.env.SHOP_EMAIL || process.env.SMTP_USER || 'info@henkes-stoffzauber.de';

// Config endpoint
app.get('/api/config', (_, res) => {
  res.json({ paypalClientId: process.env.PAYPAL_CLIENT_ID, paypalEnv: process.env.PAYPAL_ENV || 'sandbox', frontendUrl: FRONTEND_URL });
});

// Products / Fabrics endpoints (unchanged basics)
app.get('/api/products', (_, res) => res.json(loadProducts()));
app.get('/api/products/featured', (_, res) => res.json(loadProducts().filter(p => p.isFeatured)));
app.get('/api/products/:id', (req, res) => {
  const p = loadProducts().find(x => String(x.id) === req.params.id);
  if (!p) return res.status(404).json({ error: 'Produkt nicht gefunden' });
  res.json(p);
});
app.post('/api/products', checkAdmin, upload.single('imageFile'), (req, res) => {
  const products = loadProducts();
  const id = Date.now().toString();
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : (req.body.imageUrl || '');
  const newProduct = { id, name: req.body.name||'', description: req.body.description||'', price: Number(req.body.price||0), stock: Number(req.body.stock||0), fabrics: req.body.fabrics||'', isFeatured: req.body.isFeatured === 'true', imageUrl };
  products.push(newProduct); saveProducts(products);
  res.json(newProduct);
});

app.get('/api/fabrics', (_, res) => res.json(loadFabrics()));
app.get('/api/fabrics/featured', (_, res) => res.json(loadFabrics().filter(f => f.isFeatured)));
app.post('/api/fabrics', checkAdmin, upload.single('imageFile'), (req, res) => {
  const fabrics = loadFabrics();
  const id = Date.now().toString();
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : (req.body.imageUrl || '');
  const fabric = { id, name: req.body.name||'', fabricType: req.body.fabricType||'', width: Number(req.body.width||0), length: Number(req.body.length||0), suitableFor: req.body.suitableFor||'', isFeatured: req.body.isFeatured === 'true', imageUrl };
  fabrics.push(fabric); saveFabrics(fabrics);
  res.json(fabric);
});

// Helper: send shop email (HTML)
async function sendShopNotification(order, pdfPath, extra = '') {
  if (!mailer) return;
  const itemsHtml = order.cart.map(i => `<tr><td>${i.name}</td><td>${i.quantity}</td><td>€${Number(i.price).toFixed(2)}</td><td>€${(i.quantity*Number(i.price)).toFixed(2)}</td></tr>`).join('');
  const html = `<h2>Neue Bestellung #${order.id}</h2>
    <p><strong>Zahlungsmethode:</strong> ${order.paymentMethod}</p>
    <p><strong>Kunde:</strong> ${order.address.firstName} ${order.address.lastName} (${order.address.email})</p>
    ${extra}
    <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;">
      <thead><tr><th>Produkt</th><th>Menge</th><th>Preis</th><th>Summe</th></tr></thead>
      <tbody>${itemsHtml}</tbody>
    </table>
    <p><strong>Gesamt: €${order.total.toFixed(2)}</strong></p>`;
  try {
    await mailer.sendMail({ from: SHOP_EMAIL, to: SHOP_EMAIL, subject: `Neue Bestellung #${order.id}`, html, attachments: [{ filename: path.basename(pdfPath), path: pdfPath }] });
  } catch (e) { console.error('Shop email error', e); }
}

// ---------------- CHECKOUT (creates local order, returns approval link for PayPal) ----------------
app.post('/api/checkout', async (req, res) => {
  try {
    const { cart, address, paymentMethod } = req.body;
    if (!cart || !cart.length) return res.status(400).json({ success: false, error: 'Warenkorb leer' });

    const items = cart.map(i => ({ id: i.id, name: i.name, price: Number(i.price), quantity: Number(i.quantity || 1) }));
    const total = items.reduce((s,i)=>s + i.price * i.quantity, 0);

    const orders = loadOrders();
    const orderId = Date.now().toString();
    const order = { id: orderId, date: new Date().toISOString(), cart: items, address, paymentMethod, total, paymentStatus: paymentMethod === 'paypal' ? 'PENDING' : 'OPEN' };
    orders.push(order); saveOrders(orders);

    // create PDF invoice right away
    const filename = `rechnung_${orderId}.pdf`;
    const pdfPath = path.join(uploadsDir, filename);
    await createInvoicePDF(order, pdfPath);

    // PayPal flow
    if (paymentMethod === 'paypal') {
      if (!payPalClient) return res.status(500).json({ success:false, error: 'PayPal nicht konfiguriert' });

      const request = new paypal.orders.OrdersCreateRequest();
      request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: { currency_code: 'EUR', value: total.toFixed(2) },
          description: `Bestellung #${orderId}`
        }],
        application_context: {
          return_url: `${FRONTEND_URL}/checkout/success`,
          cancel_url: `${FRONTEND_URL}/checkout/cancel`
        }
      });

      try {
        const response = await payPalClient.execute(request);
        const paypalOrderId = response.result?.id || null;
        const approvalUrl = Array.isArray(response.result?.links) ? response.result.links.find(l=>l.rel==='approve')?.href : null;
        console.info('PayPal create order response:', response.result?.links || response.result);
        return res.json({ success:true, orderId, invoicePath: `/uploads/${filename}`, paypalOrderId, approvalUrl });
      } catch (ppErr) {
        console.error('PayPal create error:', ppErr);
        return res.status(500).json({ success:false, error:'PayPal Fehler', details: ppErr?.message || ppErr });
      }
    }

    // non-PayPal: send emails now
    if (mailer && address?.email) {
      await mailer.sendMail({ from: SHOP_EMAIL, to: address.email, subject: `Bestellbestätigung #${orderId}`, html:`<h2>Danke für deine Bestellung</h2><p>Rechnung im Anhang.</p>`, attachments: [{ filename, path: pdfPath }] });
    }
    await sendShopNotification(order, pdfPath);

    return res.json({ success:true, orderId, invoicePath: `/uploads/${filename}` });
  } catch (err) {
    console.error('Checkout Error:', err);
    return res.status(500).json({ success:false, error:'Serverfehler beim Checkout', details: err?.message || null });
  }
});

// ---------------- PAYPAL CAPTURE (called from frontend success route) ----------------
app.post('/api/paypal/capture', async (req, res) => {
  try {
    const { orderID, localOrderId } = req.body;
    if (!payPalClient || !orderID) return res.status(400).json({ success:false, error:'Fehlende PayPal-Konfiguration oder orderID.' });

    const request = new paypal.orders.OrdersCaptureRequest(orderID);
    request.requestBody({});
    const captureResponse = await payPalClient.execute(request);
    const capture = captureResponse.result;

    // update local order by localOrderId if provided
    if (localOrderId) {
      const orders = loadOrders();
      const idx = orders.findIndex(o => String(o.id) === String(localOrderId));
      if (idx !== -1) {
        orders[idx].paymentStatus = capture.status || 'COMPLETED';
        orders[idx].paypalCapture = capture;
        saveOrders(orders);

        // send confirmation email to customer (with invoice)
        const order = orders[idx];
        const pdfPath = path.join(uploadsDir, `rechnung_${order.id}.pdf`);
        if (mailer && order.address?.email) {
          try {
            await mailer.sendMail({ from: SHOP_EMAIL, to: order.address.email, subject: `Zahlung erhalten – Bestellung #${order.id}`, html:`<h2>Vielen Dank! Ihre Zahlung wurde empfangen.</h2><p>Bestellnummer: ${order.id}</p>`, attachments: [{ filename: path.basename(pdfPath), path: pdfPath }] });
          } catch (e) { console.error('Error sending customer confirmation', e); }
        }
        // notify shop
        await sendShopNotification(order, pdfPath, `<p><strong>PayPal capture status:</strong> ${capture.status}</p>`);
      }
    }

    return res.json({ success:true, captureStatus: capture.status, paypalResponse: capture });
  } catch (err) {
    console.error('PayPal Capture Error:', err);
    return res.status(500).json({ success:false, error:'Fehler beim Abschließen der Zahlung', details: err?.message || null });
  }
});

// ---------------- PDF Helper (improved layout) ----------------
function createInvoicePDF(order, file) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size:'A4', margin:40 });
    const stream = fs.createWriteStream(file);
    doc.pipe(stream);

    // logo left if exists
    const logoPath = path.join(__dirname, 'uploads', 'logo.jpg');
    if (fs.existsSync(logoPath)) doc.image(logoPath, 40, 30, { width: 110 });

    // header shop name on top-right
    doc.fontSize(18).fillColor('#222').text("Henke's Stoffzauber", 0, 40, { align: 'right' });
    doc.fontSize(10).fillColor('#444').text("Henke's Stoffzauber\nMusterstraße 1\n12345 Berlin\nUSt-IdNr: DE000000000", { align: 'right' });

    doc.moveDown(3);

    doc.fontSize(12).fillColor('#333').text(`Rechnung #${order.id}`, { align:'left' });
    doc.text(`Datum: ${new Date().toLocaleDateString()}`, { align:'left' });

    doc.moveDown(1);
    // customer block right
    doc.fontSize(12).text('Rechnung an:', 40, doc.y + 6);
    const customerTop = doc.y;
    doc.fontSize(10).text(`${order.address.firstName} ${order.address.lastName}`, 40, customerTop + 15);
    doc.text(`${order.address.street} ${order.address.houseNumber}`, 40);
    doc.text(`${order.address.zip} ${order.address.city}`, 40);
    doc.text(`${order.address.email || ''}`, 40);

    doc.moveDown(2);

    // table header
    const tableTop = doc.y + 10;
    const itemX = 40, qtyX = 320, priceX = 380, totalX = 450;
    doc.font('Helvetica-Bold');
    doc.text('Produkt', itemX, tableTop);
    doc.text('Menge', qtyX, tableTop);
    doc.text('Preis', priceX, tableTop);
    doc.text('Summe', totalX, tableTop);
    doc.moveDown(0.5);
    doc.font('Helvetica');

    order.cart.forEach((i, idx) => {
      const y = tableTop + 20 + idx * 18;
      doc.text(i.name, itemX, y, { width: 260 });
      doc.text(String(i.quantity), qtyX, y);
      doc.text(`€${Number(i.price).toFixed(2)}`, priceX, y);
      doc.text(`€${(Number(i.price) * i.quantity).toFixed(2)}`, totalX, y);
    });

    doc.moveDown(3);
    doc.font('Helvetica-Bold').fontSize(12).text(`Gesamt: €${order.total.toFixed(2)}`, { align: 'right' });

    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

// Admin login route (simple)
app.post('/api/admin/login', (req, res) => {
  if (req.body.password === ADMIN_PASSWORD) return res.json({ token: ADMIN_TOKEN });
  res.status(401).json({ error: 'Falsches Passwort' });
});

app.listen(PORT, () => console.log(`Server läuft auf port ${PORT} (frontend ${FRONTEND_URL})`));
