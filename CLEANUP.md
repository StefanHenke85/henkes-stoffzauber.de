# Projekt Aufräumen

## ⚠️ Empfohlene Aufräum-Aktionen

### 1. Alte Verzeichnisse löschen

Die folgenden Verzeichnisse scheinen alt/ungenutzt zu sein:

```bash
# ACHTUNG: Erst prüfen, ob wirklich nicht benötigt!
rm -rf client/
rm -rf server/
```

**Begründung:**
- `client/` und `server/` enthalten nur `node_modules`
- Die aktiven Verzeichnisse sind `api/` und `web/`
- README.md erwähnt MongoDB (nicht verwendet), du nutzt JSON-Storage

### 2. Log-Dateien löschen

```bash
# API Logs (werden beim Start neu erstellt)
rm -f api/logs/*.log
```

### 3. README.md aktualisieren

Die `README.md` ist veraltet und erwähnt:
- MongoDB (nicht verwendet, du nutzt JSON-Dateien)
- Docker (nicht verwendet für lokale Entwicklung)
- Alte Struktur

**Empfehlung:** Verwende `STARTANLEITUNG.md` als Haupt-Dokumentation oder aktualisiere README.md

### 4. .gitignore prüfen

Die `.gitignore` ist gut, aber stelle sicher:
- `.env` Dateien werden NICHT committed
- `uploads/` und `invoices/` sind im .gitignore (✅ bereits vorhanden)
- `logs/` ist im .gitignore (✅ bereits vorhanden)

### 5. Alte node_modules Cache (optional)

Falls Platzmangel:
```bash
# Im Projektroot
npm cache clean --force
```

## ✅ Was bereits gut ist

- ✅ Bilder sind vorhanden in `api/uploads/`
- ✅ STARTANLEITUNG.md ist aktualisiert für euserv VServer
- ✅ `.gitignore` schützt sensible Daten
- ✅ JSON-Datenbank funktioniert (`api/data/`)
- ✅ API und Web sind sauber getrennt

## 📋 Vor dem Deployment auf Server

1. **Logs leeren:**
   ```bash
   rm -f api/logs/*.log
   ```

2. **Dependencies aufräumen:**
   ```bash
   cd api && npm prune --production
   cd ../web && npm prune --production
   ```

3. **Alte Ordner entfernen** (falls bestätigt nicht benötigt):
   ```bash
   rm -rf client/ server/
   ```

4. **Build testen:**
   ```bash
   cd api && npm run build
   cd ../web && npm run build
   ```

5. **Backups erstellen:**
   ```bash
   # Datenbank-Backup
   tar -czf backup-data-$(date +%Y%m%d).tar.gz api/data/

   # Bilder-Backup
   tar -czf backup-uploads-$(date +%Y%m%d).tar.gz api/uploads/
   ```

## 🚀 Danach: Deployment auf euserv

Folge der `STARTANLEITUNG.md` ab Schritt "PRODUKTION (euserv VServer Deployment)"
