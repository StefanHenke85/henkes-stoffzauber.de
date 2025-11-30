# Henkes Stoffzauber - Startanleitung

## Voraussetzungen

### Lokale Entwicklung (Windows/WSL)
- **Node.js 18+** (empfohlen: Node.js 20)
- **npm** (kommt mit Node.js)

### Produktion (Server)
- **Linux Server** (Ubuntu/Debian empfohlen)
- **Node.js 18+**
- **Nginx** als Reverse Proxy
- **PM2** oder **systemd** für Prozess-Management
- Optional: **Let's Encrypt** für SSL

---

## Projektstruktur

```
henkes-stoffzauber.de/
├── api/                    # Backend (Express + TypeScript)
│   ├── src/                # Source Code
│   ├── data/               # JSON-Datenbank (Produkte, Bestellungen, Stoffe)
│   ├── uploads/            # Hochgeladene Bilder
│   ├── invoices/           # Generierte Rechnungen
│   ├── .env                # Umgebungsvariablen (NICHT committen!)
│   └── package.json
│
├── web/                    # Frontend (Vite + React + TypeScript)
│   ├── src/
│   │   ├── components/     # UI Komponenten
│   │   ├── contexts/       # React Contexts (Cart, Auth)
│   │   ├── pages/          # Seiten
│   │   └── utils/          # API Client, Helpers
│   ├── public/             # Statische Dateien (logo.jpg)
│   └── package.json
│
├── nginx/                  # Nginx Konfiguration (für Produktion)
├── Media/                  # Medien-Dateien
└── .env.example            # Vorlage für Umgebungsvariablen
```

---

## LOKALE ENTWICKLUNG

### Schritt 1: Dependencies installieren

```bash
# Im Projektverzeichnis
cd C:\Users\BreunigChristopher\henkes-stoffzauber.de

# API Dependencies
cd api
npm install

# Web Dependencies
cd ../web
npm install
```

### Schritt 2: Umgebungsvariablen prüfen

Die Datei `api/.env` sollte bereits existieren. Falls nicht:

```bash
cd api
cp .env.example .env
```

**Wichtige Variablen in api/.env:**
```env
NODE_ENV=development
PORT=3001
JWT_SECRET=dein-geheimer-schluessel
ADMIN_USERNAME=admin
ADMIN_PASSWORD=stoffzauber2025
FRONTEND_URL=http://localhost:5173
```

### Schritt 3: Server starten

**Terminal 1 - Backend (API):**
```bash
cd C:\Users\BreunigChristopher\henkes-stoffzauber.de\api
npm run dev
```
→ Läuft auf **http://localhost:3001**

**Terminal 2 - Frontend (Web):**
```bash
cd C:\Users\BreunigChristopher\henkes-stoffzauber.de\web
npm run dev
```
→ Läuft auf **http://localhost:5173**

### Schritt 4: Im Browser öffnen

- **Frontend:** http://localhost:5173
- **Admin:** http://localhost:5173/admin
- **API Health:** http://localhost:3001/health

### Admin-Zugangsdaten
- **Benutzername:** admin
- **Passwort:** stoffzauber2025

---

## PRODUKTION (Server Deployment)

### Option A: Direkt mit Node.js + PM2

#### 1. Projekt auf Server kopieren
```bash
scp -r henkes-stoffzauber.de user@server:/var/www/
```

#### 2. Dependencies installieren
```bash
cd /var/www/henkes-stoffzauber.de

# API
cd api
npm install --production
npm run build

# Web
cd ../web
npm install
npm run build
```

#### 3. Umgebungsvariablen für Produktion
```bash
cd /var/www/henkes-stoffzauber.de/api
nano .env
```

**Wichtige Änderungen für Produktion:**
```env
NODE_ENV=production
FRONTEND_URL=https://henkes-stoffzauber.de
ALLOWED_ORIGINS=https://henkes-stoffzauber.de,https://www.henkes-stoffzauber.de
```

#### 4. PM2 installieren und starten
```bash
# PM2 global installieren
npm install -g pm2

# API mit PM2 starten
cd /var/www/henkes-stoffzauber.de/api
pm2 start dist/index.js --name "henkes-api"

# PM2 beim Systemstart aktivieren
pm2 startup
pm2 save
```

#### 5. Nginx konfigurieren
```bash
sudo nano /etc/nginx/sites-available/henkes-stoffzauber.de
```

```nginx
server {
    listen 80;
    server_name henkes-stoffzauber.de www.henkes-stoffzauber.de;

    # API Proxy
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Uploads
    location /uploads {
        alias /var/www/henkes-stoffzauber.de/api/uploads;
        expires 7d;
    }

    # Health Check
    location /health {
        proxy_pass http://localhost:3001;
    }

    # Frontend (statische Dateien)
    location / {
        root /var/www/henkes-stoffzauber.de/web/dist;
        try_files $uri $uri/ /index.html;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# Aktivieren
sudo ln -s /etc/nginx/sites-available/henkes-stoffzauber.de /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 6. SSL mit Let's Encrypt
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d henkes-stoffzauber.de -d www.henkes-stoffzauber.de
```

---

## API Endpoints

### Public (ohne Login)
| Method | Endpoint | Beschreibung |
|--------|----------|--------------|
| GET | /api/products | Alle aktiven Produkte |
| GET | /api/products/featured | Featured Produkte |
| GET | /api/products/:id | Einzelnes Produkt |
| GET | /api/fabrics | Alle aktiven Stoffe |
| GET | /api/fabrics/featured | Featured Stoffe |
| POST | /api/orders | Bestellung erstellen |
| GET | /health | Server Status |

### Admin (Login erforderlich)
| Method | Endpoint | Beschreibung |
|--------|----------|--------------|
| POST | /api/auth/login | Admin Login |
| POST | /api/auth/logout | Admin Logout |
| GET | /api/products/admin | Alle Produkte (inkl. inaktive) |
| POST | /api/products | Produkt erstellen |
| PUT | /api/products/:id | Produkt bearbeiten |
| DELETE | /api/products/:id | Produkt löschen |
| GET | /api/fabrics/admin | Alle Stoffe |
| POST | /api/fabrics | Stoff erstellen |
| PUT | /api/fabrics/:id | Stoff bearbeiten |
| DELETE | /api/fabrics/:id | Stoff löschen |
| GET | /api/orders/admin | Alle Bestellungen |

---

## Datenspeicherung

Das System verwendet **JSON-Dateien** als Datenbank (kein MongoDB nötig!):

```
api/data/
├── products.json     # Produkte
├── fabrics.json      # Stoffe
└── orders.json       # Bestellungen
```

**Backup erstellen:**
```bash
cp -r api/data backup/data-$(date +%Y%m%d)
cp -r api/uploads backup/uploads-$(date +%Y%m%d)
```

---

## Troubleshooting

### API startet nicht
```bash
# Logs prüfen
cd api
npm run dev

# Port bereits belegt?
netstat -ano | findstr :3001
```

### Frontend zeigt keine Daten
```bash
# API erreichbar?
curl http://localhost:3001/health

# CORS-Fehler? Prüfe ALLOWED_ORIGINS in api/.env
```

### Bilder werden nicht angezeigt
```bash
# Uploads-Ordner existiert?
ls api/uploads/

# Berechtigungen (Linux)
chmod -R 755 api/uploads
```

### Admin Login funktioniert nicht
```bash
# Passwort in api/.env prüfen
cat api/.env | grep ADMIN_PASSWORD
```

---

## Schnellstart-Befehle

```bash
# Alles starten (2 Terminals)
# Terminal 1:
cd C:\Users\BreunigChristopher\henkes-stoffzauber.de\api && npm run dev

# Terminal 2:
cd C:\Users\BreunigChristopher\henkes-stoffzauber.de\web && npm run dev
```

**URLs:**
- Frontend: http://localhost:5173
- Admin: http://localhost:5173/admin
- API: http://localhost:3001/api
- Health: http://localhost:3001/health

---

© 2025 Henkes Stoffzauber
