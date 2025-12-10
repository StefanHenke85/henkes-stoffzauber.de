import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Gift, ShoppingCart, Check } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { formatCurrency } from '@/utils/helpers';
import toast from 'react-hot-toast';

const VOUCHER_AMOUNTS = [5, 10, 15, 25, 50];

export function VoucherShop() {
  const { addItem } = useCart();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);

  const handleAddToCart = (amount: number) => {
    // Create a virtual product for the voucher
    const voucherProduct = {
      id: `voucher-${amount}`,
      name: `Gutschein ${formatCurrency(amount)}`,
      description: `Geschenkgutschein im Wert von ${formatCurrency(amount)}. Einlösbar für alle Produkte im Shop.`,
      price: amount,
      stock: 999,
      imageUrl: '/voucher-placeholder.jpg',
      fabrics: '',
      isFeatured: false,
      isActive: true,
    };

    addItem(voucherProduct, 1);
    setSelectedAmount(amount);
    toast.success(`Gutschein über ${formatCurrency(amount)} zum Warenkorb hinzugefügt!`);

    setTimeout(() => setSelectedAmount(null), 2000);
  };

  return (
    <>
      <Helmet>
        <title>Gutscheine kaufen - Geschenkgutscheine | Henkes Stoffzauber</title>
        <meta
          name="description"
          content="Kaufen Sie Geschenkgutscheine für Henkes Stoffzauber. Perfektes Geschenk für alle, die handgemachte Stoffkreationen lieben."
        />
        <link rel="canonical" href="https://henkes-stoffzauber.de/gutscheine" />
      </Helmet>

      <div className="min-h-screen bg-neutral-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-full mb-6">
              <Gift className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-neutral-800 mb-4">
              Geschenkgutscheine
            </h1>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Verschenken Sie Freude mit unseren Geschenkgutscheinen.
              Perfekt für alle, die handgemachte Stoffkreationen lieben!
            </p>
          </div>

          {/* Voucher Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {VOUCHER_AMOUNTS.map((amount) => {
              const isSelected = selectedAmount === amount;

              return (
                <div
                  key={amount}
                  className={`relative bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 ${
                    isSelected ? 'ring-4 ring-green-400 scale-105' : 'hover:shadow-xl hover:-translate-y-1'
                  }`}
                >
                  {/* Decorative Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-100/30 to-secondary-100/30 -z-10" />

                  {/* Content */}
                  <div className="p-6 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full mb-4">
                      <Gift className="h-8 w-8 text-white" />
                    </div>

                    <h3 className="text-3xl font-bold text-neutral-800 mb-2">
                      {formatCurrency(amount)}
                    </h3>

                    <p className="text-sm text-neutral-600 mb-6">
                      Geschenkgutschein
                    </p>

                    <button
                      onClick={() => handleAddToCart(amount)}
                      disabled={isSelected}
                      className={`w-full px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                        isSelected
                          ? 'bg-green-500 text-white cursor-not-allowed'
                          : 'bg-primary-400 text-white hover:bg-primary-500 hover:-translate-y-0.5'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="h-5 w-5" />
                          Hinzugefügt
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="h-5 w-5" />
                          In den Warenkorb
                        </>
                      )}
                    </button>
                  </div>

                  {/* Decorative Corner */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-secondary-300 to-secondary-400 opacity-20 rounded-bl-full" />
                </div>
              );
            })}
          </div>

          {/* Info Section */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-neutral-800 mb-4">
              So funktioniert's
            </h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-400 text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-800 mb-1">
                    Gutschein auswählen
                  </h3>
                  <p className="text-neutral-600">
                    Wählen Sie den gewünschten Gutscheinbetrag aus und legen Sie ihn in den Warenkorb.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-400 text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-800 mb-1">
                    Bestellung abschließen
                  </h3>
                  <p className="text-neutral-600">
                    Schließen Sie Ihre Bestellung ab. Sie erhalten den Gutscheincode per E-Mail.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-400 text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-800 mb-1">
                    Gutschein verschenken
                  </h3>
                  <p className="text-neutral-600">
                    Geben Sie den Gutscheincode an die beschenkte Person weiter. Der Code kann beim Checkout eingelöst werden.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-primary-50 rounded-lg border border-primary-200">
              <p className="text-sm text-neutral-700">
                <strong>Hinweis:</strong> Gutscheine sind ab Kaufdatum 3 Jahre gültig und können für alle Produkte im Shop eingelöst werden.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
