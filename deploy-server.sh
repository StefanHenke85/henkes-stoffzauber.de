#!/bin/bash

##############################################
# Henkes Stoffzauber - Server Deployment Script
# Dieses Script deployed alle Änderungen auf dem Server
##############################################

echo "=========================================="
echo "  Henkes Stoffzauber - Deployment"
echo "=========================================="
echo ""

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Projektverzeichnis
PROJECT_DIR="/var/www/henkes-stoffzauber.de"

# Zum Projektverzeichnis wechseln
cd "$PROJECT_DIR" || {
    echo -e "${RED}✗ Fehler: Projektverzeichnis nicht gefunden!${NC}"
    exit 1
}

echo -e "${GREEN}✓ Projektverzeichnis gefunden: $PROJECT_DIR${NC}"
echo ""

# Schritt 1: Lokale Änderungen sichern
echo "================================================"
echo "Schritt 1: Lokale Änderungen sichern..."
echo "================================================"
git stash
echo -e "${GREEN}✓ Lokale Änderungen gesichert${NC}"
echo ""

# Schritt 2: Neueste Änderungen von GitHub holen
echo "================================================"
echo "Schritt 2: Änderungen von GitHub holen..."
echo "================================================"
git pull origin main
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Git Pull erfolgreich${NC}"
else
    echo -e "${RED}✗ Git Pull fehlgeschlagen!${NC}"
    exit 1
fi
echo ""

# Schritt 3: Backend Dependencies installieren
echo "================================================"
echo "Schritt 3: Backend Dependencies installieren..."
echo "================================================"
cd api
npm install --production
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backend Dependencies installiert${NC}"
else
    echo -e "${YELLOW}⚠ Warnung: Backend npm install hatte Fehler (kann ignoriert werden)${NC}"
fi
cd ..
echo ""

# Schritt 4: Frontend Dependencies installieren
echo "================================================"
echo "Schritt 4: Frontend Dependencies installieren..."
echo "================================================"
cd web
npm install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Frontend Dependencies installiert${NC}"
else
    echo -e "${YELLOW}⚠ Warnung: Frontend npm install hatte Fehler (kann ignoriert werden)${NC}"
fi
echo ""

# Schritt 5: Frontend Build
echo "================================================"
echo "Schritt 5: Frontend bauen..."
echo "================================================"
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Frontend erfolgreich gebaut${NC}"
else
    echo -e "${RED}✗ Frontend Build fehlgeschlagen!${NC}"
    cd ..
    exit 1
fi
cd ..
echo ""

# Schritt 6: PM2 Services neu starten
echo "================================================"
echo "Schritt 6: Services neu starten..."
echo "================================================"

# Backend neu starten
pm2 restart henkes-api
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backend Service neu gestartet${NC}"
else
    echo -e "${YELLOW}⚠ Backend Service konnte nicht neu gestartet werden${NC}"
fi

# Frontend neu starten (falls vorhanden)
pm2 restart henkes-web 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Frontend Service neu gestartet${NC}"
else
    echo -e "${YELLOW}⚠ Frontend Service nicht gefunden (normal wenn nur API läuft)${NC}"
fi

echo ""

# Schritt 7: Status anzeigen
echo "================================================"
echo "Schritt 7: Service Status..."
echo "================================================"
pm2 status
echo ""

# Schritt 8: Logs anzeigen
echo "================================================"
echo "Letzte Log-Einträge:"
echo "================================================"
pm2 logs henkes-api --lines 10 --nostream
echo ""

# Fertig!
echo "=========================================="
echo -e "${GREEN}✓ DEPLOYMENT ERFOLGREICH!${NC}"
echo "=========================================="
echo ""
echo "Deine Website ist jetzt aktualisiert:"
echo "  → https://henkes-stoffzauber.de"
echo ""
echo "Nützliche Befehle:"
echo "  pm2 status              - Service Status anzeigen"
echo "  pm2 logs henkes-api     - Backend Logs anzeigen"
echo "  pm2 restart henkes-api  - Backend neu starten"
echo "  ./deploy-server.sh      - Dieses Script erneut ausführen"
echo ""
echo "=========================================="
