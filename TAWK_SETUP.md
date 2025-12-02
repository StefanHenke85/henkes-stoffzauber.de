# Tawk.to Live-Chat Einrichtung

## Schritt 1: Tawk.to Account erstellen

1. Gehe zu: **https://www.tawk.to/**
2. Klicke auf **"Sign Up Free"**
3. Registriere dich mit deiner Email (info@henkes-stoffzauber.de)
4. Bestätige deine Email

## Schritt 2: Property erstellen

1. Nach dem Login klickst du auf **"Add Property"**
2. Gib ein:
   - **Property Name**: Henkes Stoffzauber
   - **Website URL**: https://henkes-stoffzauber.de
3. Klicke **"Create Property"**

## Schritt 3: Widget-ID kopieren

1. Gehe zu **Administration** → **Channels** → **Chat Widget**
2. Klicke auf **"Direct Chat Link"** oder **"Widget Code"**
3. Du siehst Code ähnlich wie:
   ```javascript
   https://embed.tawk.to/5f1234567890abcdef123456/default
                          ^^^^^^^^^^^^^^^^^^^^^^^  ^^^^^^^
                          PROPERTY_ID              WIDGET_ID
   ```
4. Kopiere die **PROPERTY_ID** (z.B. `5f1234567890abcdef123456`)

## Schritt 4: IDs in den Code eintragen

1. Öffne: `web/src/components/TawkToChat.tsx`
2. Ersetze Zeile 11:
   ```typescript
   const TAWK_PROPERTY_ID = '5f1234567890abcdef123456'; // DEINE ID HIER!
   ```
3. Speichern und neu deployen

## Schritt 5: Mobile App installieren (optional)

1. **iOS**: https://apps.apple.com/app/tawk-to/id1036148132
2. **Android**: https://play.google.com/store/apps/details?id=com.tawk.app
3. Melde dich mit deinem Tawk.to Account an
4. Jetzt kannst du von überall auf Kunden-Chats antworten!

## Schritt 6: Anpassen (optional)

In der Tawk.to Admin-Oberfläche kannst du:
- ✅ Widget-Farbe anpassen (passend zu #F2B2B4)
- ✅ Willkommensnachricht setzen
- ✅ Offline-Nachrichten aktivieren
- ✅ Arbeitszeiten einstellen
- ✅ Automatische Antworten einrichten

## DSGVO-Konformität

Tawk.to ist DSGVO-konform. Wichtig:
1. Datenschutzerklärung aktualisieren (Tawk.to erwähnen)
2. In Tawk.to Admin → Settings:
   - **Data Hosting Location**: EU wählen
   - **GDPR Compliance**: Aktivieren

## Features:

✅ **Kostenlos** für unbegrenzte Agenten
✅ **Keine Kundennummer sichtbar** (wie gewünscht)
✅ **Kunde braucht keine Anmeldung**
✅ **Mobile App** zum Antworten
✅ **Offline-Modus** (Email-Fallback)
✅ **DSGVO-konform**
✅ **Chat-History**
✅ **File-Sharing**

## Support:

Falls Probleme auftreten:
- Tawk.to Support: https://help.tawk.to/
- Video-Tutorial: https://www.youtube.com/watch?v=YourTutorial
