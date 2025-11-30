# Henkes Stoffzauber

Moderne E-Commerce Plattform für handgefertigte Stoffe und Nähkreationen.

## Tech Stack

### Backend (API)
- **Node.js 20** mit TypeScript
- **Express.js 4.18** (stabil, nicht Beta)
- **MongoDB** mit Mongoose ODM
- **Security**: Helmet, CORS, Rate Limiting, bcrypt, JWT (httpOnly Cookies)
- **Image Processing**: Sharp (WebP-Konvertierung, Thumbnails)
- **Email**: Nodemailer
- **Payment**: PayPal SDK

### Frontend (Web)
- **React 18** mit TypeScript
- **Vite** (statt Create React App)
- **Tailwind CSS** für Styling
- **React Router 6** für Navigation
- **React Helmet Async** für SEO
- **Lucide React** für Icons

### Infrastructure
- **Docker** mit Docker Compose
- **MongoDB 7.0** als Datenbank
- **Nginx** als Reverse Proxy
- **Let's Encrypt** für SSL

## Projektstruktur

```
henkes-stoffzauber.de/
├── api/                    # Backend (Express + TypeScript)
│   ├── src/
│   │   ├── config/         # Konfiguration (DB, Environment)
│   │   ├── controllers/    # Route Handler
│   │   ├── middleware/     # Auth, Security, Validation
│   │   ├── models/         # Mongoose Models
│   │   ├── routes/         # API Routes
│   │   ├── services/       # Business Logic (Email, PDF, PayPal)
│   │   ├── types/          # TypeScript Typen
│   │   └── utils/          # Hilfsfunktionen
│   ├── Dockerfile
│   └── package.json
│
├── web/                    # Frontend (Vite + React)
│   ├── src/
│   │   ├── components/     # UI Komponenten
│   │   ├── contexts/       # React Contexts (Cart, Auth)
│   │   ├── pages/          # Seiten-Komponenten
│   │   ├── types/          # TypeScript Typen
│   │   └── utils/          # API Client, Helpers
│   ├── Dockerfile
│   └── package.json
│
├── nginx/                  # Nginx Konfiguration
├── docker/                 # Docker-spezifische Dateien
├── docker-compose.yml      # Docker Orchestrierung
└── .env.example            # Umgebungsvariablen Template
```

## Lokale Entwicklung

### Voraussetzungen
- Node.js 20+
- npm oder yarn
- Docker (optional, für MongoDB)

### Setup

1. **Repository klonen & Dependencies installieren:**
```bash
cd henkes-stoffzauber.de

# API
cd api
npm install
cp .env.example .env  # Anpassen!

# Web
cd ../web
npm install
```

2. **MongoDB starten (mit Docker):**
```bash
docker run -d --name mongodb -p 27017:27017 mongo:7.0
```

3. **Entwicklungsserver starten:**
```bash
# Terminal 1: API
cd api
npm run dev

# Terminal 2: Web
cd web
npm run dev
```

4. **Öffnen:** http://localhost:5173

### Migration bestehender Daten

Falls Daten aus dem alten JSON-basierten System existieren:

```bash
cd api
npx tsx src/scripts/migrate.ts
```

## Production Deployment

### 1. Server vorbereiten (Ubuntu/Debian)

```bash
# Docker installieren
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Docker Compose installieren
sudo apt install docker-compose-plugin
```

### 2. Projekt auf Server kopieren

```bash
scp -r henkes-stoffzauber.de user@server:/var/www/
```

### 3. Umgebungsvariablen konfigurieren

```bash
cd /var/www/henkes-stoffzauber.de
cp .env.example .env
nano .env  # Alle Werte anpassen!
```

### 4. SSL-Zertifikat erstellen (Let's Encrypt)

```bash
# Erst mal Nginx mit HTTP starten für Zertifikatserstellung
docker compose up -d nginx

# Zertifikat erstellen
docker compose run --rm certbot certonly --webroot \
  --webroot-path /var/www/certbot \
  -d henkes-stoffzauber.de \
  -d www.henkes-stoffzauber.de \
  --email info@henkes-stoffzauber.de \
  --agree-tos

# Nginx neustarten mit SSL
docker compose restart nginx
```

### 5. Alle Services starten

```bash
docker compose up -d
```

### 6. Logs prüfen

```bash
docker compose logs -f
```

## API Endpoints

### Public
- `GET /api/products` - Alle Produkte
- `GET /api/products/featured` - Featured Produkte
- `GET /api/products/:id` - Einzelnes Produkt
- `POST /api/checkout` - Bestellung erstellen
- `POST /api/checkout/capture/:id` - PayPal Payment capturen
- `GET /api/checkout/order/:id` - Bestellung abrufen

### Admin (Auth required)
- `POST /api/auth/login` - Anmelden
- `POST /api/auth/logout` - Abmelden
- `GET /api/auth/me` - Aktueller Benutzer
- `GET /api/products/admin` - Alle Produkte (inkl. inaktive)
- `POST /api/products` - Produkt erstellen
- `PUT /api/products/:id` - Produkt aktualisieren
- `DELETE /api/products/:id` - Produkt löschen
- `GET /api/orders/admin` - Alle Bestellungen
- `PATCH /api/orders/admin/:id` - Bestellung aktualisieren

## Sicherheit

- ✅ Helmet Security Headers
- ✅ CORS auf spezifische Origins begrenzt
- ✅ Rate Limiting (API & Login)
- ✅ JWT in httpOnly Cookies
- ✅ Passwort-Hashing mit bcrypt
- ✅ Input-Validierung mit Zod
- ✅ File Upload Validierung (nur Bilder, max 5MB)
- ✅ HTTPS erzwungen in Production
- ✅ CSP Headers

## Backup

```bash
# MongoDB Backup
docker exec henkes-mongodb mongodump --out /dump --authenticationDatabase admin -u $MONGO_USER -p $MONGO_PASSWORD

# Uploads Backup
docker cp henkes-api:/app/uploads ./backup/uploads
```

## Troubleshooting

### API startet nicht
```bash
docker compose logs api
# Prüfen ob MongoDB läuft
docker compose ps
```

### MongoDB Connection Error
```bash
# Container neu starten
docker compose restart mongodb
# Warten bis healthy
docker compose ps
```

### SSL Probleme
```bash
# Zertifikat manuell erneuern
docker compose run --rm certbot renew
docker compose restart nginx
```

---

© 2025 Henkes Stoffzauber
