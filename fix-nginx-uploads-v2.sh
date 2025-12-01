#!/bin/bash

##############################################
# Nginx Upload-Pfad Fix Script v2
# Fügt die /api/uploads location zur nginx config hinzu
##############################################

echo "=========================================="
echo "  Nginx Upload-Pfad Fix v2"
echo "=========================================="
echo ""

# Farben
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

NGINX_CONF="/etc/nginx/sites-available/henkes-stoffzauber.de"

# Prüfen ob die Datei existiert
if [ ! -f "$NGINX_CONF" ]; then
    echo -e "${RED}✗ Nginx-Konfiguration nicht gefunden: $NGINX_CONF${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Nginx-Konfiguration gefunden${NC}"
echo ""

# Backup erstellen
echo "Erstelle Backup..."
sudo cp "$NGINX_CONF" "${NGINX_CONF}.backup.$(date +%Y%m%d_%H%M%S)"
echo -e "${GREEN}✓ Backup erstellt${NC}"
echo ""

# Prüfen ob der Upload-Block bereits existiert
if grep -q "location /api/uploads" "$NGINX_CONF"; then
    echo -e "${YELLOW}⚠ Upload-Location bereits vorhanden - überspringe${NC}"
else
    echo "Füge Upload-Location hinzu..."

    # Temporäre Datei erstellen
    TEMP_FILE=$(mktemp)

    # Neue Location einfügen VOR "location /api {"
    awk '
    /^[[:space:]]*# API Requests/ {
        print "    # Static uploads served directly (must come before /api)"
        print "    location /api/uploads {"
        print "        alias /var/www/henkes-stoffzauber.de/api/uploads;"
        print "        expires 7d;"
        print "        add_header Cache-Control \"public, immutable\";"
        print ""
        print "        # Security: only allow image files"
        print "        location ~* \\.(jpg|jpeg|png|gif|webp|svg)$ {"
        print "            try_files $uri =404;"
        print "        }"
        print "    }"
        print ""
    }
    { print }
    ' "$NGINX_CONF" > "$TEMP_FILE"

    # Ersetze die Original-Datei
    sudo mv "$TEMP_FILE" "$NGINX_CONF"
    echo -e "${GREEN}✓ Upload-Location hinzugefügt${NC}"
fi

echo ""

# Nginx-Konfiguration testen
echo "Teste Nginx-Konfiguration..."
if sudo nginx -t; then
    echo -e "${GREEN}✓ Nginx-Konfiguration ist gültig${NC}"
else
    echo -e "${RED}✗ Nginx-Konfiguration hat Fehler!${NC}"
    echo "Stelle Backup wieder her..."
    LATEST_BACKUP=$(ls -t ${NGINX_CONF}.backup.* | head -1)
    sudo cp "$LATEST_BACKUP" "$NGINX_CONF"
    exit 1
fi

echo ""

# Nginx neu laden
echo "Lade Nginx neu..."
if sudo systemctl reload nginx; then
    echo -e "${GREEN}✓ Nginx erfolgreich neu geladen${NC}"
else
    echo -e "${RED}✗ Fehler beim Neu-Laden von Nginx${NC}"
    exit 1
fi

echo ""

# Prüfe ob Banner-Datei existiert
echo "Prüfe Banner-Datei..."
BANNER_PATH="/var/www/henkes-stoffzauber.de/api/uploads/1764276141636-banner.jpg"
if [ -f "$BANNER_PATH" ]; then
    echo -e "${GREEN}✓ Banner-Datei gefunden: $BANNER_PATH${NC}"
    ls -lh "$BANNER_PATH"
else
    echo -e "${RED}✗ Banner-Datei nicht gefunden: $BANNER_PATH${NC}"
    echo "Bitte Datei hochladen oder Deployment erneut ausführen"
fi

echo ""

# Teste den direkten Zugriff
echo "Teste Banner-Zugriff..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://henkes-stoffzauber.de/api/uploads/1764276141636-banner.jpg)
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Banner ist erreichbar (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${RED}✗ Banner gibt HTTP $HTTP_CODE zurück${NC}"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}✓ FIX ABGESCHLOSSEN!${NC}"
echo "=========================================="
echo ""
echo "Banner sollte jetzt erreichbar sein unter:"
echo "  → https://henkes-stoffzauber.de/api/uploads/1764276141636-banner.jpg"
echo ""
echo "Falls nicht, Cache im Browser leeren (Strg+Shift+R)"
echo ""
