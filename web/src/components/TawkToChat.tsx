import { useEffect, useState } from 'react';

declare global {
  interface Window {
    Tawk_API?: any;
    Tawk_LoadStart?: Date;
  }
}

export function TawkToChat() {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    // Lazy Load: Lade Chat erst nach 3 Sekunden oder bei User-Interaktion
    const timer = setTimeout(() => {
      setShouldLoad(true);
    }, 3000);

    // Lade sofort bei User-Interaktion (Scroll, Click, Touch)
    const loadOnInteraction = () => {
      setShouldLoad(true);
      clearTimeout(timer);
    };

    window.addEventListener('scroll', loadOnInteraction, { once: true });
    window.addEventListener('click', loadOnInteraction, { once: true });
    window.addEventListener('touchstart', loadOnInteraction, { once: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', loadOnInteraction);
      window.removeEventListener('click', loadOnInteraction);
      window.removeEventListener('touchstart', loadOnInteraction);
    };
  }, []);

  useEffect(() => {
    if (!shouldLoad) return;

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
  }, [shouldLoad]);

  return null; // Keine UI, nur Script-Loader
}
