import { useState, useEffect } from 'react';
import { X, Gift } from 'lucide-react';

export function ChristmasPopup() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show popup after 2 seconds on every page load
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-fade-in"
        onClick={handleClose}
      />

      {/* Popup */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-gradient-to-br from-red-50 via-white to-green-50 rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-scale-in pointer-events-auto border-4 border-red-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 transition-colors"
            aria-label="Schließen"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Content */}
          <div className="text-center">
            {/* Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-500 rounded-full mb-6 animate-bounce">
              <Gift className="h-10 w-10 text-white" />
            </div>

            {/* Title */}
            <h2 className="text-3xl font-bold text-neutral-800 mb-3">
              🎄 Frohe Weihnachten! 🎄
            </h2>

            {/* Subtitle */}
            <p className="text-xl font-semibold text-red-600 mb-4">
              5% Weihnachts-Rabatt
            </p>

            {/* Description */}
            <p className="text-neutral-600 mb-6 leading-relaxed">
              Zur Weihnachtszeit schenken wir dir <strong>5% Rabatt</strong> auf deine Bestellung!
              Nutze den Gutscheincode im Checkout und spare bei deinem Einkauf.
            </p>

            {/* Coupon Code Box */}
            <div className="bg-white border-2 border-dashed border-red-400 rounded-lg p-4 mb-6">
              <p className="text-sm text-neutral-500 mb-1">Dein Gutscheincode:</p>
              <p className="text-2xl font-bold text-red-600 font-mono tracking-wider">
                XMAS2025
              </p>
              <p className="text-xs text-neutral-400 mt-2">
                Einfach im Checkout eingeben
              </p>
            </div>

            {/* CTA Button */}
            <button
              onClick={handleClose}
              className="w-full bg-gradient-to-r from-red-500 to-green-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-red-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Jetzt einkaufen 🎁
            </button>

            {/* Fine Print */}
            <p className="text-xs text-neutral-400 mt-4">
              Gültig bis 31. Dezember 2025
            </p>
          </div>

          {/* Decorative Snowflakes */}
          <div className="absolute top-6 left-6 text-4xl opacity-20 animate-spin-slow">
            ❄️
          </div>
          <div className="absolute bottom-6 right-6 text-3xl opacity-20 animate-spin-slow animation-delay-1000">
            ⛄
          </div>
        </div>
      </div>
    </>
  );
}
