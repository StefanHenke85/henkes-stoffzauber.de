#!/bin/bash
# =============================================================================
# HENKES STOFFZAUBER - Server Setup Script für Ubuntu 24.04 (euserv)
# Server: srv30670.blue.kundencontroller.de (81.7.11.191)
# =============================================================================

set -e

echo "=========================================="
echo "  HENKES STOFFZAUBER - Server Setup"
echo "=========================================="

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. System Update
echo -e "${YELLOW}[1/8] System Update...${NC}"
apt update && apt upgrade -y

# 2. Basis-Tools installieren
echo -e "${YELLOW}[2/8] Basis-Tools installieren...${NC}"
apt install -y curl wget git build-essential software-properties-common ufw fail2ban

# 3. Node.js 20 LTS installieren
echo -e "${YELLOW}[3/8] Node.js 20 LTS installieren...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
npm install -g pm2

echo "Node.js Version: $(node -v)"
echo "NPM Version: $(npm -v)"

# 4. MongoDB 7.0 installieren
echo -e "${YELLOW}[4/8] MongoDB 7.0 installieren...${NC}"
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
   gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/7.0 multiverse" | \
   tee /etc/apt/sources.list.d/mongodb-org-7.0.list

apt update
apt install -y mongodb-org

# MongoDB starten und aktivieren
systemctl start mongod
systemctl enable mongod

echo "MongoDB Version: $(mongod --version | head -1)"

# 5. Nginx installieren
echo -e "${YELLOW}[5/8] Nginx installieren...${NC}"
apt install -y nginx

# 6. Certbot für SSL installieren
echo -e "${YELLOW}[6/8] Certbot installieren...${NC}"
apt install -y certbot python3-certbot-nginx

# 7. Firewall konfigurieren
echo -e "${YELLOW}[7/8] Firewall konfigurieren...${NC}"
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 'Nginx Full'
ufw --force enable

# 8. App-Verzeichnis erstellen
echo -e "${YELLOW}[8/8] App-Verzeichnis erstellen...${NC}"
mkdir -p /var/www/henkes-stoffzauber
mkdir -p /var/www/henkes-stoffzauber/api/uploads
mkdir -p /var/www/henkes-stoffzauber/web

# Berechtigungen setzen
chown -R www-data:www-data /var/www/henkes-stoffzauber

echo ""
echo -e "${GREEN}=========================================="
echo "  Basis-Setup abgeschlossen!"
echo "==========================================${NC}"
echo ""
echo "Nächste Schritte:"
echo "1. Projekt auf den Server kopieren"
echo "2. ./deploy.sh ausführen"
echo ""
