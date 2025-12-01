import { Link } from 'react-router-dom';
import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { formatCurrency, getImageUrl, cn } from '@/utils/helpers';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
  const { items, total, itemCount, addItem, decreaseQuantity, removeItem, clearCart } = useCart();

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transition-transform duration-300 flex flex-col',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        aria-label="Warenkorb"
        aria-hidden={!isOpen}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-neutral-800 flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-primary-400" />
            Warenkorb ({itemCount})
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Warenkorb schließen"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        {items.length === 0 ? (
          <div className="flex-grow flex flex-col items-center justify-center p-8 text-center">
            <ShoppingBag className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg mb-4">Dein Warenkorb ist leer</p>
            <Link
              to="/shop"
              onClick={onClose}
              className="bg-primary-400 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-500 transition-colors"
            >
              Zum Shop
            </Link>
          </div>
        ) : (
          <>
            {/* Items */}
            <ul className="flex-grow overflow-y-auto p-4 space-y-4">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex gap-4 p-3 bg-gray-50 rounded-lg"
                >
                  <img
                    src={getImageUrl(item.imageUrl, item.imageUrlWebp)}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded-md"
                  />

                  <div className="flex-grow">
                    <h3 className="font-semibold text-neutral-800 line-clamp-1">
                      {item.name}
                    </h3>
                    <p className="text-primary-500 font-bold">
                      {formatCurrency(item.price)}
                    </p>

                    {item.selectedFabrics && item.selectedFabrics.length > 0 && (
                      <p className="text-xs text-neutral-600 mt-1">
                        Stoffe: {item.selectedFabrics.map(f => f.fabricName).join(', ')}
                      </p>
                    )}

                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => decreaseQuantity(item.id)}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                        aria-label="Menge verringern"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="font-semibold min-w-[2ch] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => addItem(item, 1)}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                        aria-label="Menge erhöhen"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1 ml-auto text-red-500 hover:bg-red-50 rounded transition-colors"
                        aria-label="Artikel entfernen"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 space-y-4">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Gesamt:</span>
                <span className="text-primary-500">{formatCurrency(total)}</span>
              </div>

              {total < 50 && (
                <p className="text-sm text-center text-gray-500">
                  Noch {formatCurrency(50 - total)} bis zum kostenlosen Versand!
                </p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={clearCart}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Leeren
                </button>
                <Link
                  to="/checkout"
                  onClick={onClose}
                  className="flex-1 py-2 px-4 bg-primary-400 text-white rounded-lg font-semibold text-center hover:bg-primary-500 transition-colors"
                >
                  Zur Kasse
                </Link>
              </div>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
