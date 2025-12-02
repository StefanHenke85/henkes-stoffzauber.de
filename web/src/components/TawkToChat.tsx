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
    const TAWK_PROPERTY_ID = '692e3005c860c2197de658a6';
    const TAWK_WIDGET_ID = '1jbe6n5eq';

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
