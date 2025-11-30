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
const fabricsFile = path.join(__dirname, 'fabrics.json');
const ordersFile = path.join(__dirname, 'orders.json');

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

const safeWriteJSON = (file, data) =>
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');

const loadProducts = () => {
    const arr = safeReadJSON(productsFile);
    return arr.map(p => ({
        ...p,
        price: Number(p.price || 0),
        stock: Number(p.stock || 0),
        imageUrl: p.imageUrl || p.image || ""
    }));
};
const saveProducts = (arr) => safeWriteJSON(productsFile, arr);

const loadFabrics = () => {
    const arr = safeReadJSON(fabricsFile);
    return arr.map(f => ({
        ...f,
        width: Number(f.width || 0),
        length: Number(f.length || 0),
        imageUrl: f.imageUrl || f.image || ""
    }));
};
const saveFabrics = (arr) => safeWriteJSON(fabricsFile, arr);

const loadOrders = () => safeReadJSON(ordersFile);
const saveOrders = (arr) => safeWriteJSON(ordersFile, arr);

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

// PayPal
let payPalClient = null;
try {
    const env = process.env.PAYPAL_ENV || "sandbox";
    const cid = process.env.PAYPAL_CLIENT_ID;
    const secret = process.env.PAYPAL_CLIENT_SECRET;

    if (cid && secret) {
        payPalClient = new paypal.core.PayPalHttpClient(
            env === "live"
                ? new paypal.core.LiveEnvironment(cid, secret)
                : new paypal.core.SandboxEnvironment(cid, secret)
        );
    }
} catch (err) {
    console.error("PayPal init error:", err);
}

// Mailer
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

const SHOP_EMAIL = process.env.SHOP_EMAIL || "info@henkes-stoffzauber.de";

// ---------------- CONFIG ENDPOINT ----------------
app.get("/api/config", (_, res) => {
    res.json({
        paypalClientId: process.env.PAYPAL_CLIENT_ID,
        paypalEnv: process.env.PAYPAL_ENV || "sandbox"
    });
});

// ---------------- PRODUCTS ----------------
app.get('/api/products', (_, res) => res.json(loadProducts()));
app.get('/api/products/featured', (_, res) => res.json(loadProducts().filter(p => p.isFeatured)));
app.get('/api/products/:id', (req, res) => {
    const p = loadProducts().find(x => String(x.id) === req.params.id);
    if (!p) return res.status(404).json({ error: "Produkt nicht gefunden" });
    res.json(p);
});

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
        fabricId: req.body.fabricId || "",
        fabricName: req.body.fabricName || "",
        fabrics: req.body.fabrics || "",
        isFeatured: req.body.isFeatured === "true",
        imageUrl
    };

    products.push(newProduct);
    saveProducts(products);
    res.json(newProduct);
});

// ---------------- FABRICS ----------------
app.get('/api/fabrics', (_, res) => res.json(loadFabrics()));
app.get('/api/fabrics/featured', (_, res) => res.json(loadFabrics().filter(f => f.isFeatured)));
app.post('/api/fabrics', checkAdmin, upload.single("imageFile"), (req, res) => {
    const fabrics = loadFabrics();
    const id = Date.now().toString();
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : (req.body.imageUrl || "");

    const fabric = {
        id,
        name: req.body.name || "",
        fabricType: req.body.fabricType || "",
        width: Number(req.body.width || 0),
        length: Number(req.body.length || 0),
        suitableFor: req.body.suitableFor || "",
        isFeatured: req.body.isFeatured === "true",
        imageUrl
    };

    fabrics.push(fabric);
    saveFabrics(fabrics);
    res.json(fabric);
});

// ---------------- CHECKOUT ----------------
app.post('/api/checkout', async (req, res) => {
    try {
        const { cart, address, paymentMethod } = req.body;
        if (!cart || !cart.length) return res.status(400).json({ success: false, error: "Warenkorb leer" });

        const items = cart.map(i => ({ id: i.id, name: i.name, price: Number(i.price), quantity: Number(i.quantity || 1) }));
        const total = items.reduce((s, i) => s + (i.price * i.quantity), 0);

        const orders = loadOrders();
        const orderId = Date.now().toString();
        // 🛑 Füge den Zahlungsstatus hinzu, wird später in Capture aktualisiert
        const order = { id: orderId, date: new Date().toISOString(), cart: items, address, paymentMethod, total, paymentStatus: paymentMethod === 'paypal' ? 'PENDING' : 'OPEN_INVOICE' };
        orders.push(order);
        saveOrders(orders);

        // PDF
        const filename = `rechnung_${orderId}.pdf`;
        const pdfPath = path.join(uploadsDir, filename);
        await createInvoicePDF(order, pdfPath);

        let paypalOrderId = null;
        let approvalUrl = null; 
        
        if (paymentMethod === "paypal" && payPalClient) {
            const request = new paypal.orders.OrdersCreateRequest();
            
            // 🛑 DIE KORRIGIERTEN HTTP-ADRESSEN VERWENDEN
            // (Wird auf HTTPS umgestellt, sobald SSL verfügbar ist)
            request.requestBody({ 
                intent: "CAPTURE", 
                purchase_units: [{ amount: { currency_code: "EUR", value: total.toFixed(2) } }],
                application_context: {
                    return_url: "http://www.henkes-stoffzauber.de/checkout/success", 
                    cancel_url: "http://www.henkes-stoffzauber.de/checkout/cancel"
                }
            });
            
            const response = await payPalClient.execute(request);
            paypalOrderId = response.result.id;
            
            // Approval Link extrahieren
            approvalUrl = response.result.links.find(link => link.rel === 'approve')?.href;

            // Wichtig: Bei PayPal leiten wir den Kunden sofort weiter und senden die E-Mails ERST,
            // wenn die Zahlung in der Capture-Route abgeschlossen wurde.
            
            return res.json({ success: true, orderId, invoicePath: `/uploads/${filename}`, paypalOrderId, approvalUrl });
        }


        // ------------------ Rechnungs- oder Nicht-PayPal-Logik (Emails senden) ------------------
        
        // Email an Kunde
        if (mailer && address.email) {
            await mailer.sendMail({
                from: SHOP_EMAIL,
                to: address.email,
                subject: `Bestellbestätigung #${orderId}`,
                html: `<h2>Danke für deine Bestellung!</h2>
                       <p>Sie finden Ihre Rechnung im Anhang.</p>`,
                attachments: [{ filename, path: pdfPath }]
            });
        }

        // Email an Shop (HTML)
        if (mailer) {
            const itemsHtml = items.map(i => `<tr><td>${i.name}</td><td>${i.quantity}</td><td>€${i.price.toFixed(2)}</td><td>€${(i.price*i.quantity).toFixed(2)}</td></tr>`).join('');
            const htmlContent = `<h2>Neue Bestellung #${orderId}</h2>
                <p><strong>Zahlungsmethode:</strong> Rechnung</p>
                <p><strong>Kunde:</strong> ${address.firstName} ${address.lastName}</p>
                <p><strong>E-Mail:</strong> ${address.email}</p>
                <table border="1" cellpadding="5" cellspacing="0">
                  <thead><tr><th>Produkt</th><th>Menge</th><th>Preis</th><th>Summe</th></tr></thead>
                  <tbody>${itemsHtml}</tbody>
                </table>
                <p><strong>Gesamt: €${total.toFixed(2)}</strong></p>`;

            await mailer.sendMail({
                from: SHOP_EMAIL,
                to: SHOP_EMAIL,
                subject: `Neue Bestellung #${orderId}`,
                html: htmlContent,
                attachments: [{ filename, path: pdfPath }]
            });
        }
        
        res.json({ success: true, orderId, invoicePath: `/uploads/${filename}`, paypalOrderId, approvalUrl: null });

    } catch (err) {
        console.error("Checkout Error:", err);
        res.status(500).json({ success: false, error: "Serverfehler" });
    }
});


// ---------------- PAYPAL CAPTURE ROUTE (NEU) ----------------
app.post('/api/paypal/capture', async (req, res) => {
    const { orderID } = req.body; 

    if (!payPalClient || !orderID) {
        return res.status(400).json({ success: false, error: "Fehlende PayPal-Konfiguration oder Bestell-ID." });
    }

    try {
        const request = new paypal.orders.OrdersCaptureRequest(orderID);
        const response = await payPalClient.execute(request);
        const capture = response.result;
        
        // 💡 ACHTUNG: Hier sollte die Bestellung mit der ID aus der Datenbank/JSON gefunden werden,
        // um den Zahlungsstatus auf 'COMPLETED' zu setzen und ggf. E-Mails zu senden.

        // Da die Bestell-Einträge bereits in der Checkout-Route erstellt wurden,
        // aktualisieren wir hier nur den Status für die Client-Anzeige.

        res.json({ success: true, captureStatus: capture.status, paypalResponse: capture });
    } catch (err) {
        console.error("PayPal Capture Error:", err);
        res.status(500).json({ success: false, error: "Fehler beim Abschließen der Zahlung.", details: err.message });
    }
});


// ---------------- PDF HELPER ----------------
function createInvoicePDF(order, file) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const stream = fs.createWriteStream(file);
        doc.pipe(stream);

        // Logo
        const logoPath = path.join(__dirname, 'uploads', 'logo.jpg');
        if (fs.existsSync(logoPath)) doc.image(logoPath, 50, 20, { width: 120 });

        doc.fontSize(20).fillColor('#5A4747').text("Henke's Stoffzauber", 200, 30);
        doc.moveDown(2);
        doc.fontSize(12).fillColor('#4F3C3C');
        doc.text(`Rechnung #: ${order.id}`, { align: 'right' });
        doc.text(`Datum: ${new Date().toLocaleDateString()}`, { align: 'right' });

        doc.moveDown(1);
        doc.text("Kundendaten:", { underline: true });
        doc.text(`${order.address.firstName} ${order.address.lastName}`);
        doc.text(`${order.address.street} ${order.address.houseNumber}`);
        doc.text(`${order.address.zip} ${order.address.city}`);
        doc.text(order.address.email);

        doc.moveDown(1);
        doc.text("Produkte:", { underline: true });
        const tableTop = doc.y;
        const itemX = 50, qtyX = 300, priceX = 370, totalX = 450;
        doc.font('Helvetica-Bold');
        doc.text('Produkt', itemX, tableTop);
        doc.text('Menge', qtyX, tableTop);
        doc.text('Preis', priceX, tableTop);
        doc.text('Summe', totalX, tableTop);
        doc.moveDown(0.5);
        doc.font('Helvetica');

        order.cart.forEach((i, idx) => {
            const y = tableTop + 25 + idx * 20;
            doc.text(i.name, itemX, y);
            doc.text(i.quantity, qtyX, y);
            doc.text(`€${Number(i.price).toFixed(2)}`, priceX, y);
            doc.text(`€${(Number(i.price)*i.quantity).toFixed(2)}`, totalX, y);
        });

        doc.moveDown(2);
        doc.font('Helvetica-Bold').fontSize(14);
        doc.text(`Gesamtbetrag: €${order.total.toFixed(2)}`, { align: 'right' });

        doc.end();
        stream.on('finish', resolve);
        stream.on('error', reject);
    });
}

// ---------------- ADMIN LOGIN ----------------
app.post('/api/admin/login', (req, res) => {
    if (req.body.password === ADMIN_PASSWORD)
        return res.json({ token: ADMIN_TOKEN });
    res.status(401).json({ error: "Falsches Passwort" });
});

// ---------------- START SERVER ----------------
app.listen(PORT, () => console.log(`Server läuft auf http://localhost:${PORT}`));