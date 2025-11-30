const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const paypal = require('@paypal/checkout-server-sdk');

const ordersPath = path.join(__dirname, 'orders.json');
const invoicesDir = path.join(__dirname, 'invoices');
if (!fs.existsSync(invoicesDir)) fs.mkdirSync(invoicesDir);

// --- PayPal Live Setup ---
const payPalEnv = new paypal.core.LiveEnvironment(
  process.env.PAYPAL_CLIENT_ID,
  process.env.PAYPAL_SECRET
);
const payPalClient = new paypal.core.PayPalHttpClient(payPalEnv);

// Bestellung laden/speichern
function loadOrders() {
  try { return JSON.parse(fs.readFileSync(ordersPath)); } 
  catch { return []; }
}

function saveOrders(orders) {
  fs.writeFileSync(ordersPath, JSON.stringify(orders, null, 2));
}

// PDF-Rechnung erstellen
function createInvoicePDF(order, filePath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Logo
    const logoPath = path.join(__dirname, 'logo.png');
    if (fs.existsSync(logoPath)) doc.image(logoPath, 50, 20, { width: 120 });

    // Händleradresse & Bankinfos
    doc.fontSize(12).text("Henke's Stoffzauber", 50, 100);
    doc.text("Musterstraße 1, 12345 Berlin");
    doc.text("Bank: DE12345678901234567890, BIC: TESTBIC");
    doc.text("PayPal QR: pay@henkes-stoffzauber.de");
    doc.moveDown();

    doc.fontSize(18).text(`Rechnung #${order.id}`, { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).text(`Name: ${order.customer.firstName} ${order.customer.lastName}`);
    doc.text(`Adresse: ${order.customer.street} ${order.customer.houseNumber}, ${order.customer.zip} ${order.customer.city}`);
    doc.text(`E-Mail: ${order.customer.email}`);
    doc.text(`Telefon: ${order.customer.phone}`);
    doc.moveDown();

    doc.text("Bestellte Artikel:");
    order.cartItems.forEach(item => {
      doc.text(`${item.name} x ${item.quantity} – € ${item.price.toFixed(2)}`);
    });
    doc.moveDown();
    doc.text(`Gesamt: € ${order.total.toFixed(2)}`);
    doc.text(`Zahlungsart: ${order.paymentMethod}`);

    doc.end();
    stream.on('finish', () => resolve());
    stream.on('error', reject);
  });
}

// E-Mail verschicken
async function sendOrderEmail(order, pdfPath) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Kunde
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: order.customer.email,
    subject: `Bestellbestätigung #${order.id}`,
    text: `Vielen Dank für Ihre Bestellung! Sie finden Ihre Rechnung im Anhang.`,
    attachments: [{ filename: `Rechnung-${order.id}.pdf`, path: pdfPath }],
  });

  // Händler
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER,
    subject: `Neue Bestellung #${order.id}`,
    text: `Neue Bestellung eingegangen:\n${JSON.stringify(order, null, 2)}`,
    attachments: [{ filename: `Rechnung-${order.id}.pdf`, path: pdfPath }],
  });
}

// Neue Bestellung
router.post('/', async (req, res) => {
  const { customer, cartItems, total, paymentMethod } = req.body;
  const orders = loadOrders();
  const id = Date.now().toString();
  const newOrder = { id, customer, cartItems, total, paymentMethod, status: 'offen' };
  orders.push(newOrder);
  saveOrders(orders);

  const invoicePath = path.join('invoices', `invoice-${id}.pdf`);
  try {
    // PDF erstellen
    await createInvoicePDF(newOrder, path.join(__dirname, invoicePath));

    // E-Mail verschicken
    await sendOrderEmail(newOrder, path.join(__dirname, invoicePath));

    // PayPal Order anlegen (nur bei PayPal)
    let paypalOrderId = null;
    if (paymentMethod === 'paypal') {
      const request = new paypal.orders.OrdersCreateRequest();
      request.prefer("return=representation");
      request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{ amount: { currency_code: 'EUR', value: total.toFixed(2) } }]
      });
      const orderResponse = await payPalClient.execute(request);
      paypalOrderId = orderResponse.result.id;
    }

    res.json({ success: true, order: newOrder, invoicePath, paypalOrderId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Alle Bestellungen (Admin)
router.get('/', (req, res) => {
  const orders = loadOrders();
  res.json(orders);
});

module.exports = router;
