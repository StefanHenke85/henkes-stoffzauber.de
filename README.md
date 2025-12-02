# Henkes Stoffzauber 🧵

Moderne E-Commerce Plattform für handgefertigte Stoffe und Nähkreationen aus Rheinberg.

🌐 **Live:** [henkes-stoffzauber.de](https://henkes-stoffzauber.de)

## 🚀 Tech Stack

### Backend (API)
- **Node.js 20** mit TypeScript
- **Express.js 4.18** - REST API
- **JSON File Storage** - Einfache Datenhaltung
- **Security**: Helmet, CORS, Rate Limiting, bcrypt, JWT (httpOnly Cookies)
- **Email**: Nodemailer → Postfix → Gmail Relay
- **PDF**: PDFKit für Rechnungserstellung (SEPA QR-Codes)
- **Payment**: PayPal SDK
- **Deployment**: PM2 Process Manager

### Frontend (Web)
- **React 18** mit TypeScript
- **Vite** - Build Tool
- **Tailwind CSS** - Styling
- **React Router 6** - Navigation
- **React Helmet Async** - SEO Optimization
- **Lucide React** - Icons
- **Tawk.to** - Live Chat Integration

### Infrastructure
- **VPS Server**: 81.7.11.191
- **Nginx** - Reverse Proxy & Static File Serving
- **PM2** - Process Management
- **Postfix** - SMTP Server mit Gmail Relay
- **Let's Encrypt** - SSL Zertifikate
- **DNS**: SPF & DMARC konfiguriert

## 📁 Projektstruktur

```
henkes-stoffzauber/
├── api/                      # Express Backend
│   ├── src/
│   │   ├── config/           # Environment, Logger
│   │   ├── data/             # JSON File Store
│   │   ├── middleware/       # Auth, Security, Rate Limiting
│   │   ├── models/           # TypeScript Interfaces
│   │   ├── routes/           # API Routes
│   │   │   ├── auth.ts       # Login, Logout, Auth Check
│   │   │   ├── orders.ts     # Bestellungen, Checkout
│   │   │   ├── products.ts   # Produktverwaltung
│   │   │   └── fabrics.ts    # Stoffverwaltung
│   │   ├── services/         # Business Logic
│   │   │   ├── emailService.ts   # Nodemailer
│   │   │   ├── pdfService.ts     # PDF-Rechnungen
│   │   │   └── paypalService.ts  # PayPal Integration
│   │   ├── types/            # TypeScript Types
│   │   └── utils/            # Helper Functions
│   ├── uploads/              # Produktbilder
│   ├── invoices/             # PDF-Rechnungen
│   └── data/                 # JSON Datenbank
│
├── web/                      # Vite + React Frontend
│   ├── src/
│   │   ├── components/       # UI Components
│   │   │   ├── Layout.tsx        # Header, Footer, Nav
│   │   │   ├── ProductCard.tsx   # Produktkarte
│   │   │   ├── CartSidebar.tsx   # Warenkorb Sidebar
│   │   │   └── TawkToChat.tsx    # Live Chat Widget
│   │   ├── contexts/         # React Context API
│   │   │   ├── CartContext.tsx   # Warenkorb State
│   │   │   └── AuthContext.tsx   # Admin Auth
│   │   ├── pages/            # Seiten-Komponenten
│   │   │   ├── Home.tsx          # Startseite
│   │   │   ├── Shop.tsx          # Produktliste
│   │   │   ├── ProductDetail.tsx # Produktdetails
│   │   │   ├── Stoffe.tsx        # Stoffübersicht
│   │   │   ├── Checkout.tsx      # Checkout-Flow
│   │   │   ├── AdminDashboard.tsx # Admin Panel
│   │   │   ├── Impressum.tsx
│   │   │   └── Datenschutz.tsx
│   │   ├── types/            # TypeScript Types
│   │   └── utils/            # API Client, Helpers
│   ├── public/
│   │   ├── robots.txt        # SEO Crawler Config
│   │   └── sitemap.xml       # SEO Sitemap
│   └── index.html            # SEO Meta Tags
│
├── nginx/                    # Nginx Konfiguration
│   └── sites-available/
│       └── henkes-stoffzauber.de
│
├── deploy.sh                 # Lokales Deployment
├── deploy-server.sh          # Server Deployment
├── fix-nginx-uploads*.sh     # Server Maintenance
└── .env.example              # Environment Template
```

## 🛠️ Lokale Entwicklung

### Voraussetzungen
- Node.js 20+
- npm oder yarn

### Setup

1. **Repository klonen & Dependencies installieren:**
```bash
cd henkes-stoffzauber

# API
cd api
npm install
cp .env.example .env  # Anpassen!

# Web
cd ../web
npm install
```

2. **Entwicklungsserver starten:**
```bash
# Terminal 1: API
cd api
npm run dev       # Läuft auf Port 3001

# Terminal 2: Web
cd web
npm run dev       # Läuft auf Port 5173
```

3. **Öffnen:** http://localhost:5173

### Environment Variablen (.env)

**API (.env):**

```env
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=SecurePassword123!
JWT_SECRET=your-secret-key

# Email (SMTP)
SMTP_HOST=localhost
SMTP_PORT=25
SMTP_USER=
SMTP_PASS=
SHOP_EMAIL=info@henkes-stoffzauber.de
ADMIN_EMAIL=henke.stefan1985@gmail.com

# PayPal
PAYPAL_CLIENT_ID=your-client-id
PAYPAL_CLIENT_SECRET=your-client-secret
PAYPAL_MODE=sandbox

# Storage
UPLOAD_PATH=./uploads
```

## 🚢 Production Deployment

### Aktuelle Server-Konfiguration

- **Server:** VPS 81.7.11.191
- **Domain:** henkes-stoffzauber.de
- **SSL:** Let's Encrypt (Auto-Renewal)
- **Deployment:** PM2 mit GitHub Auto-Deploy

### Deployment-Prozess

1. **Code pushen:**

```bash
git add .
git commit -m "feat: Neue Funktion"
git push
```

2. **Auf Server deployen:**

```bash
./deploy-server.sh
```

Oder manuell:

```bash
ssh root@81.7.11.191
cd /var/www/henkes-stoffzauber.de
git pull
cd api && npm install && pm2 restart henkes-api
cd ../web && npm run build
```

### Server-Struktur

```text
/var/www/henkes-stoffzauber.de/
├── api/              # Backend (läuft mit PM2)
├── web/dist/         # Frontend Build (served by Nginx)
└── api/uploads/      # Hochgeladene Bilder (Nginx Static)
```

### PM2 Prozesse

```bash
pm2 list              # Alle Prozesse anzeigen
pm2 restart henkes-api # API neu starten
pm2 logs henkes-api   # Logs anzeigen
pm2 monit             # Monitoring
```

### Nginx Konfiguration

- **Port 80:** HTTP → HTTPS Redirect
- **Port 443:** HTTPS mit SSL
- **Frontend:** Root `/var/www/henkes-stoffzauber.de/web/dist`
- **API:** Proxy zu `http://localhost:3001/api`
- **Uploads:** Static Files `/var/www/henkes-stoffzauber.de/api/uploads`

## 📡 API Endpoints

### Public Endpoints

- `GET /api/products` - Alle aktiven Produkte
- `GET /api/products/featured` - Featured Produkte
- `GET /api/products/:id` - Einzelnes Produkt
- `GET /api/fabrics` - Alle Stoffe
- `POST /api/checkout` - Bestellung erstellen
- `POST /api/checkout/capture/:orderId` - PayPal Payment capturen
- `GET /api/checkout/order/:id` - Bestelldetails abrufen

### Admin Endpoints (Auth required)

- `POST /api/auth/login` - Admin Login
- `POST /api/auth/logout` - Admin Logout
- `GET /api/auth/me` - Session Check

**Produkte:**

- `GET /api/products/admin` - Alle Produkte (inkl. inaktive)
- `POST /api/products` - Produkt erstellen (mit Upload)
- `PATCH /api/products/:id` - Produkt aktualisieren
- `DELETE /api/products/:id` - Produkt löschen

**Bestellungen:**

- `GET /api/orders/admin` - Alle Bestellungen (mit Pagination)
- `GET /api/orders/admin/:id` - Einzelne Bestellung
- `PATCH /api/orders/admin/:id` - Bestellung aktualisieren
- `DELETE /api/orders/admin/:id` - Bestellung löschen

**Stoffe:**

- `GET /api/fabrics/admin` - Alle Stoffe
- `POST /api/fabrics` - Stoff erstellen (mit Upload)
- `PATCH /api/fabrics/:id` - Stoff aktualisieren
- `DELETE /api/fabrics/:id` - Stoff löschen

## 🔒 Sicherheit

- ✅ **Helmet** - Security Headers
- ✅ **CORS** - Nur Frontend-Origin erlaubt
- ✅ **Rate Limiting** - API (100/15min), Checkout (5/15min), Login (5/15min)
- ✅ **JWT Auth** - httpOnly Cookies (7 Tage)
- ✅ **bcrypt** - Passwort-Hashing (12 Rounds)
- ✅ **File Upload** - Nur Bilder, max 5MB, Validierung
- ✅ **HTTPS** - Let's Encrypt SSL
- ✅ **CSP** - Content Security Policy
- ✅ **ARIA** - Barrierefreiheit (WCAG konform)

## 📧 Email-System

**Konfiguration:**
- Node.js App → Localhost:25 (Postfix)
- Postfix → Gmail SMTP (smtp.gmail.com:587)
- SPF Record: `v=spf1 ip4:81.7.11.191 mx ~all`
- DMARC: `v=DMARC1; p=none; rua=mailto:info@henkes-stoffzauber.de`

**Email-Typen:**

1. **Bestellbestätigung** (an Kunde) - Mit PDF-Rechnung
2. **Admin-Benachrichtigung** (an Admin) - Neue Bestellung
3. **Versandbestätigung** (an Kunde) - Mit Tracking-Nummer

## 📄 PDF-Rechnungen

Features:

- ✅ Vollständige Rechnungsdaten
- ✅ SEPA QR-Code (EPC Format)
- ✅ Bankdaten & IBAN
- ✅ Optimiertes Layout (alles auf 1 Seite)
- ✅ Henkes Stoffzauber Logo
- ✅ Kleinunternehmer § 19 UStG

Speicherort: `api/invoices/invoice-{orderNumber}.pdf`

## 🔍 SEO Optimierung

**Umgesetzt:**

- ✅ robots.txt & sitemap.xml
- ✅ Canonical URLs auf allen Seiten
- ✅ Optimierte Meta-Tags mit "Rheinberg" (Local SEO)
- ✅ Open Graph Tags (Facebook/WhatsApp)
- ✅ Twitter Cards
- ✅ Structured Data (Schema.org Store + Product)
- ✅ Semantic HTML (h1, h2, nav, section, article)
- ✅ Image Alt-Attributes
- ✅ WCAG Barrierefreiheit

**SEO Score: 9/10** ⭐⭐⭐⭐⭐

## 🛟 Troubleshooting

### API startet nicht

```bash
pm2 logs henkes-api    # Fehler anzeigen
pm2 restart henkes-api # Neu starten
```

### Uploads funktionieren nicht

```bash
./fix-nginx-uploads-v2.sh  # Nginx Upload-Route fixen
```

### Email kommt nicht an

```bash
# Postfix Status prüfen
ssh root@81.7.11.191 "systemctl status postfix"

# Mail Queue prüfen
ssh root@81.7.11.191 "mailq"

# Logs anzeigen
ssh root@81.7.11.191 "tail -f /var/log/mail.log"
```

### SSL Probleme

```bash
# Zertifikat erneuern
ssh root@81.7.11.191 "certbot renew"
ssh root@81.7.11.191 "systemctl reload nginx"
```

## 📊 Monitoring

**Live-Checks:**

- API Health: <https://henkes-stoffzauber.de/api/health>
- Frontend: <https://henkes-stoffzauber.de>
- PM2 Status: `ssh root@81.7.11.191 "pm2 status"`

## 💾 Backup

**Wichtige Daten:**
```bash
# JSON Datenbank
api/data/products.json
api/data/orders.json
api/data/fabrics.json

# Uploads
api/uploads/

# Rechnungen
api/invoices/
```

**Backup erstellen:**
```bash
ssh root@81.7.11.191 "tar -czf backup-$(date +%Y%m%d).tar.gz /var/www/henkes-stoffzauber.de/api/data /var/www/henkes-stoffzauber.de/api/uploads /var/www/henkes-stoffzauber.de/api/invoices"
```

## 📱 Features

### Für Kunden

- 🛍️ Produktkatalog mit Suche & Filter
- 🧵 Stoffübersicht mit Details
- 🛒 Warenkorb mit LocalStorage
- 💳 PayPal, Rechnung, Vorkasse, Barzahlung bei Abholung
- 📄 Automatische PDF-Rechnung
- 📧 Email-Bestätigungen
- 💬 Live-Chat (Tawk.to)
- 📱 Voll Responsive

### Für Admin

- 🔐 Sicheres Login-System
- 📦 Produktverwaltung (CRUD)
- 🧵 Stoffverwaltung (CRUD)
- 📋 Bestellverwaltung mit Statusänderung
- 📷 Bild-Upload mit Vorschau
- 🔔 Bestellbenachrichtigungen per Email

## 🚧 Roadmap

- [ ] Google Business Profile einrichten
- [ ] Bing Webmaster Tools
- [ ] Newsletter-System
- [ ] Kundenbewertungen
- [ ] Produktvarianten (Größen, Farben)
- [ ] Rabattcodes/Gutscheine
- [ ] DHL Versandlabel-Integration

---

## 👨‍💻 Entwicklung

Entwickelt mit ❤️ für Henkes Stoffzauber

© 2025 Stefan Henke | [henkes-stoffzauber.de](https://henkes-stoffzauber.de)
