import { useState, useEffect } from 'react';
import { Cookie, Shield, BarChart } from 'lucide-react';

const CONSENT_KEY = 'henkes-cookie-consent';

interface ConsentPreferences {
  necessary: boolean; // Immer true
  analytics: boolean;
  marketing: boolean;
}

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      setIsVisible(true);
    } else {
      const saved = JSON.parse(consent);
      setPreferences(saved);
      applyConsent(saved);
    }
  }, []);

  const applyConsent = (prefs: ConsentPreferences) => {
    // Google Analytics nur wenn erlaubt
    if (prefs.analytics) {
      // window.gtag('consent', 'update', { analytics_storage: 'granted' });
      console.log('Analytics aktiviert');
    } else {
      console.log('Analytics deaktiviert');
    }

    // Marketing Cookies nur wenn erlaubt
    if (prefs.marketing) {
      console.log('Marketing aktiviert');
    } else {
      console.log('Marketing deaktiviert');
    }
  };

  const handleAcceptAll = () => {
    const allAccepted: ConsentPreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
    };
    saveConsent(allAccepted);
  };

  const handleAcceptNecessary = () => {
    const onlyNecessary: ConsentPreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
    };
    saveConsent(onlyNecessary);
  };

  const handleSavePreferences = () => {
    saveConsent(preferences);
  };

  const saveConsent = (prefs: ConsentPreferences) => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(prefs));
    applyConsent(prefs);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-start justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <Cookie className="h-8 w-8 text-primary-500" />
            <div>
              <h2 className="text-2xl font-bold text-neutral-800">Cookie-Einstellungen</h2>
              <p className="text-sm text-neutral-600">Wir respektieren deine Privatsphäre</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {!showDetails ? (
            // Einfache Ansicht
            <>
              <p className="text-neutral-700 leading-relaxed">
                Wir verwenden Cookies, um dir die bestmögliche Erfahrung auf unserer Website zu bieten.
                Notwendige Cookies sind für die Funktionalität der Website erforderlich.
                Andere Cookies helfen uns, die Nutzung zu analysieren und das Angebot zu verbessern.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleAcceptAll}
                  className="flex-1 bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  Alle akzeptieren
                </button>
                <button
                  onClick={handleAcceptNecessary}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-neutral-800 font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  Nur notwendige
                </button>
              </div>

              <button
                onClick={() => setShowDetails(true)}
                className="w-full text-primary-500 hover:text-primary-600 font-medium text-sm underline"
              >
                Einstellungen anpassen
              </button>
            </>
          ) : (
            // Detaillierte Ansicht
            <>
              <div className="space-y-4">
                {/* Notwendige Cookies */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-green-500" />
                      <h3 className="font-semibold text-neutral-800">Notwendige Cookies</h3>
                    </div>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Immer aktiv</span>
                  </div>
                  <p className="text-sm text-neutral-600">
                    Diese Cookies sind für die Grundfunktionen der Website erforderlich (z.B. Warenkorb, Login).
                  </p>
                </div>

                {/* Analytics Cookies */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <BarChart className="h-5 w-5 text-blue-500" />
                      <h3 className="font-semibold text-neutral-800">Analyse-Cookies</h3>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.analytics}
                        onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                        className="sr-only peer"
                        aria-label="Analyse-Cookies aktivieren"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                    </label>
                  </div>
                  <p className="text-sm text-neutral-600">
                    Helfen uns zu verstehen, wie Besucher mit der Website interagieren (z.B. Google Analytics).
                  </p>
                </div>

                {/* Marketing Cookies */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Cookie className="h-5 w-5 text-purple-500" />
                      <h3 className="font-semibold text-neutral-800">Marketing-Cookies</h3>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.marketing}
                        onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                        className="sr-only peer"
                        aria-label="Marketing-Cookies aktivieren"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                    </label>
                  </div>
                  <p className="text-sm text-neutral-600">
                    Werden verwendet, um personalisierte Werbung anzuzeigen.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={handleSavePreferences}
                  className="flex-1 bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  Auswahl speichern
                </button>
                <button
                  onClick={() => setShowDetails(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-neutral-800 font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  Zurück
                </button>
              </div>
            </>
          )}

          {/* Footer Links */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-neutral-500 text-center">
              Weitere Informationen findest du in unserer{' '}
              <a href="/datenschutz" className="text-primary-500 hover:underline">
                Datenschutzerklärung
              </a>
              {' '}und im{' '}
              <a href="/impressum" className="text-primary-500 hover:underline">
                Impressum
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
