import { useEffect } from 'react';

declare global {
  interface Window {
    Tawk_API?: any;
    Tawk_LoadStart?: Date;
  }
}

export function TawkToChat() {
  useEffect(() => {
    // Tawk.to Configuration
    // WICHTIG: Ersetze 'YOUR_PROPERTY_ID' und 'YOUR_WIDGET_ID'
    // mit deinen echten IDs von https://tawk.to/
    const TAWK_PROPERTY_ID = 'YOUR_PROPERTY_ID'; // z.B. '5f1234567890abcdef123456'
    const TAWK_WIDGET_ID = 'default'; // oder 'YOUR_WIDGET_ID'

    // Nur laden wenn IDs gesetzt sind
    if (TAWK_PROPERTY_ID === 'YOUR_PROPERTY_ID') {
      console.warn('⚠️ Tawk.to noch nicht konfiguriert! Bitte Property ID in TawkToChat.tsx eintragen.');
      return;
    }

    // Verhindere mehrfaches Laden
    if (window.Tawk_API) {
      return;
    }

    // Tawk.to Script laden
    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://embed.tawk.to/${TAWK_PROPERTY_ID}/${TAWK_WIDGET_ID}`;
    script.charset = 'UTF-8';
    script.setAttribute('crossorigin', '*');

    // DSGVO-Konformität: Setze Besucher-Attribute
    window.Tawk_API.onLoad = function() {
      // Optional: Setze Besucher-Name oder Email wenn bekannt
      // window.Tawk_API.setAttributes({
      //   'name': 'Besucher',
      //   'email': 'kunde@example.de'
      // });
    };

    const firstScript = document.getElementsByTagName('script')[0];
    if (firstScript && firstScript.parentNode) {
      firstScript.parentNode.insertBefore(script, firstScript);
    }

    // Cleanup beim Unmount
    return () => {
      // Script wird nicht entfernt, da Tawk.to einmal geladen bleiben sollte
    };
  }, []);

  return null; // Keine UI, nur Script-Loader
}
