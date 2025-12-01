import { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';

export function WhatsAppChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const phoneNumber = '4915565612722'; // Format: country code + number without spaces

  const handleSend = () => {
    if (message.trim()) {
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
      setMessage(''); // Clear message after sending
      setIsOpen(false); // Close popup
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {isOpen && (
          <div className="mb-4 bg-white rounded-2xl shadow-2xl p-6 w-80 sm:w-96 animate-in slide-in-from-bottom-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-green-500 flex items-center justify-center">
                  <MessageCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-800">WhatsApp Chat</h3>
                  <p className="text-sm text-neutral-600">Henkes Stoffzauber</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 transition-colors"
                aria-label="Schließen"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-sm text-neutral-600 mb-4">
              Schreiben Sie uns direkt über WhatsApp! Wir helfen Ihnen gerne weiter.
            </p>

            {/* Message Input */}
            <div className="mb-4">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ihre Nachricht..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                rows={4}
              />
            </div>

            <button
              type="button"
              onClick={handleSend}
              disabled={!message.trim()}
              className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Send className="h-5 w-5" />
              Nachricht senden
            </button>

            <p className="text-xs text-neutral-500 mt-3 text-center">
              Normalerweise antworten wir innerhalb weniger Stunden
            </p>
          </div>
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="h-14 w-14 rounded-full bg-green-500 hover:bg-green-600 shadow-lg hover:shadow-xl flex items-center justify-center transition-all transform hover:scale-110"
          aria-label="WhatsApp Chat öffnen"
        >
          {isOpen ? (
            <X className="h-6 w-6 text-white" />
          ) : (
            <MessageCircle className="h-6 w-6 text-white" />
          )}
        </button>
      </div>
    </>
  );
}
