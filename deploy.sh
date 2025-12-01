#!/bin/bash

# Henkes Stoffzauber - Deployment Script für euserv VServer
# Verwendung: ./deploy.sh

set -e  # Stoppe bei Fehlern

echo "🚀 Henkes Stoffzauber Deployment gestartet..."

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Schritt 1: Git Pull (mit Konflikt-Handling)
echo -e "\n${YELLOW}📥 Git Pull...${NC}"
cd /var/www/henkes-stoffzauber.de

# Stash lokale Änderungen falls vorhanden
if ! git diff-index --quiet HEAD --; then
    echo "⚠️  Lokale Änderungen gefunden, speichere sie..."
    git stash
    HAS_STASH=true
else
    HAS_STASH=false
fi

git pull origin main

# Stash wieder anwenden
if [ "$HAS_STASH" = true ]; then
    echo "📦 Wende gespeicherte Änderungen an..."
    git stash pop || echo "⚠️  Manuelle Konfliktlösung nötig"
fi

# Schritt 2: API builden
echo -e "\n${YELLOW}🔨 API builden...${NC}"
cd api

echo "📦 Installiere Dependencies..."
npm install

echo "🏗️  TypeScript kompilieren..."
npm run build

echo "🧹 Entferne Dev-Dependencies..."
npm prune --production

# Schritt 3: PM2 neu starten
echo -e "\n${YELLOW}🔄 API neu starten...${NC}"
if pm2 describe henkes-api > /dev/null 2>&1; then
    pm2 restart henkes-api
    echo -e "${GREEN}✅ API neu gestartet${NC}"
else
    pm2 start dist/index.js --name "henkes-api"
    pm2 save
    echo -e "${GREEN}✅ API gestartet${NC}"
fi

# Schritt 4: Web builden
echo -e "\n${YELLOW}🌐 Frontend builden...${NC}"
cd ../web

echo "📦 Installiere Dependencies..."
npm install

echo "🏗️  React App builden..."
npm run build

# Schritt 5: Nginx neuladen
echo -e "\n${YELLOW}🔧 Nginx neuladen...${NC}"
if sudo nginx -t > /dev/null 2>&1; then
    sudo systemctl reload nginx
    echo -e "${GREEN}✅ Nginx neugeladen${NC}"
else
    echo -e "${RED}❌ Nginx Konfiguration hat Fehler!${NC}"
    sudo nginx -t
    exit 1
fi

# Schritt 6: Status prüfen
echo -e "\n${YELLOW}📊 Status prüfen...${NC}"
echo ""
pm2 status

echo -e "\n${YELLOW}🔍 Health Check...${NC}"
HEALTH=$(curl -s https://henkes-stoffzauber.de/health || echo "failed")
if [[ $HEALTH == *"ok"* ]]; then
    echo -e "${GREEN}✅ API ist erreichbar!${NC}"
    echo "$HEALTH"
else
    echo -e "${RED}❌ API nicht erreichbar!${NC}"
    echo "Logs:"
    pm2 logs henkes-api --lines 20 --nostream
fi

echo -e "\n${GREEN}🎉 Deployment abgeschlossen!${NC}"
echo ""
echo "📝 Nützliche Befehle:"
echo "  pm2 logs henkes-api     - Logs anzeigen"
echo "  pm2 monit               - Monitoring"
echo "  pm2 restart henkes-api  - Neu starten"
