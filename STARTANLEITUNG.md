# Henkes Stoffzauber - Startanleitung

## Voraussetzungen

### Lokale Entwicklung (Windows)
- **Node.js 18+** (empfohlen: Node.js 20)
- **npm** (kommt mit Node.js)

### Produktion (euserv VServer)
- **Ubuntu Server** (euserv VPS)
- **Node.js 18+**
- **Nginx** als Reverse Proxy
- **PM2** für Prozess-Management
- **Let's Encrypt** für SSL (certbot)

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
cd henkes-stoffzauber

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
cd api
npm run dev
```
→ Läuft auf **http://localhost:3001**

**Terminal 2 - Frontend (Web):**
```bash
cd web
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

## PRODUKTION (euserv VServer Deployment)

### 1. Projekt auf Server kopieren

**Von Windows aus:**
```bash
scp -r henkes-stoffzauber root@deine-server-ip:/var/www/
```

**Oder mit Git (empfohlen):**
```bash
# Auf dem Server
cd /var/www
git clone https://github.com/dein-repo/henkes-stoffzauber.git
cd henkes-stoffzauber
```

### 2. Node.js installieren (falls noch nicht vorhanden)

```bash
# Node.js 20 LTS installieren
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Version prüfen
node --version
npm --version
```

### 3. Dependencies installieren und builden

```bash
cd /var/www/henkes-stoffzauber.de

# API builden
cd api
npm install
npm run build

# Web builden
cd ../web
npm install
npm run build
```

### 4. Umgebungsvariablen für Produktion

```bash
cd /var/www/henkes-stoffzauber.de/api
nano .env
```

**Wichtige Änderungen für Produktion:**
```env
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://henkes-stoffzauber.de
ALLOWED_ORIGINS=https://henkes-stoffzauber.de,https://www.henkes-stoffzauber.de

# PayPal auf LIVE umstellen (wenn bereit)
PAYPAL_ENV=live
PAYPAL_CLIENT_ID=deine-live-client-id
PAYPAL_CLIENT_SECRET=dein-live-secret
```

### 5. PM2 installieren und API starten

```bash
# PM2 global installieren
sudo npm install -g pm2

# API mit PM2 starten
cd /var/www/henkes-stoffzauber.de/api
pm2 start dist/index.js --name "henkes-api"

# Status prüfen
pm2 status
pm2 logs henkes-api

# PM2 beim Systemstart aktivieren
pm2 startup
pm2 save
```

**Wichtige PM2-Befehle:**
```bash
pm2 list                    # Alle Apps anzeigen
pm2 logs henkes-api        # Logs anzeigen
pm2 restart henkes-api     # Neu starten
pm2 stop henkes-api        # Stoppen
pm2 delete henkes-api      # Löschen
pm2 monit                  # Monitoring
```

### 6. Nginx konfigurieren

```bash
sudo nano /etc/nginx/sites-available/henkes-stoffzauber.de
```

**Nginx-Konfiguration:**
```nginx
# HTTP → HTTPS Redirect
server {
    listen 80;
    server_name henkes-stoffzauber.de www.henkes-stoffzauber.de;

    # Redirect all HTTP to HTTPS
    return 301 https://$host$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl http2;
    server_name henkes-stoffzauber.de www.henkes-stoffzauber.de;

    # SSL Certificate (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/henkes-stoffzauber.de/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/henkes-stoffzauber.de/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/henkes-stoffzauber.de/chain.pem;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # API Requests
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Bilder aus API-Upload-Ordner
    location /uploads/ {
        alias /var/www/henkes-stoffzauber.de/api/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Rechnungen (nur für interne Nutzung)
    location /invoices/ {
        alias /var/www/henkes-stoffzauber.de/api/invoices/;
        internal;
    }

    # Health Check
    location /health {
        proxy_pass http://localhost:3001;
        access_log off;
    }

    # Frontend (React SPA)
    location / {
        root /var/www/henkes-stoffzauber.de/web/dist;
        index index.html;
        try_files $uri $uri/ /index.html;

        # Cache für statische Assets
        location ~* \.(jpg|jpeg|png|gif|ico|css|js|webp)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

**Nginx aktivieren:**
```bash
# Symlink erstellen
sudo ln -s /etc/nginx/sites-available/henkes-stoffzauber.de /etc/nginx/sites-enabled/

# Konfiguration testen
sudo nginx -t

# Nginx neuladen
sudo systemctl reload nginx
```

### 7. SSL mit Let's Encrypt

```bash
# Certbot installieren
sudo apt update
sudo apt install certbot python3-certbot-nginx

# SSL-Zertifikat erstellen (automatische Nginx-Konfiguration)
sudo certbot --nginx -d henkes-stoffzauber.de -d www.henkes-stoffzauber.de

# Auto-Renewal testen
sudo certbot renew --dry-run
```

### 8. Firewall konfigurieren (UFW)

```bash
# Firewall einrichten
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
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

### Lokale Entwicklung
```bash
# Terminal 1 (API):
cd api && npm run dev

# Terminal 2 (Frontend):
cd web && npm run dev
```

### Produktion (Server)
```bash
# Nach Code-Updates:
cd /var/www/henkes-stoffzauber.de

# Backend neu builden und starten
cd api
git pull                    # Falls Git verwendet wird
npm install
npm run build
pm2 restart henkes-api

# Frontend neu builden
cd ../web
npm install
npm run build

# Nginx neuladen
sudo systemctl reload nginx
```

**URLs:**
- Frontend: http://localhost:5173
- Admin: http://localhost:5173/admin
- API: http://localhost:3001/api
- Health: http://localhost:3001/health

---

© 2025 Henkes Stoffzauber
