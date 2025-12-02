import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Check } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { formatCurrency, getImageUrl, cn } from '@/utils/helpers';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem, isInCart } = useCart();
  const [hearts, setHearts] = useState<Array<{ id: number; left: string; top: string }>>([]);
  const [imageError, setImageError] = useState(false);

  const inCart = isInCart(product.id || product._id || '');
  const isAvailable = product.stock > 0;
  const productId = product.id || product._id || '';

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAvailable) return;

    // Add floating hearts animation
    const newHearts = Array.from({ length: 3 }).map(() => ({
      id: Date.now() + Math.random(),
      left: `${Math.random() * 60 + 20}%`,
      top: `${Math.random() * 20 + 30}%`,
    }));

    setHearts((prev) => [...prev, ...newHearts]);
    addItem(product);

    // Remove hearts after animation
    setTimeout(() => {
      setHearts((prev) => prev.filter((h) => !newHearts.some((n) => n.id === h.id)));
    }, 700);
  };

  const imageUrl = imageError
    ? 'https://placehold.co/400x400/F2B2B4/ffffff?text=Stoffzauber'
    : getImageUrl(product.imageUrl, product.imageUrlWebp);

  return (
    <article className="group relative bg-white rounded-xl border border-secondary-200 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden">
      {/* Image */}
      <Link
        to={`/shop/${productId}`}
        className="block aspect-square overflow-hidden"
        aria-label={`${product.name} ansehen`}
      >
        <img
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          decoding="async"
          width="400"
          height="400"
          onError={() => setImageError(true)}
        />
      </Link>

      {/* Featured Badge */}
      {product.isFeatured && (
        <span className="absolute top-3 left-3 bg-primary-400 text-white text-xs font-bold px-2 py-1 rounded-full">
          Featured
        </span>
      )}

      {/* Floating Hearts */}
      {hearts.map((h) => (
        <span
          key={h.id}
          className="absolute text-2xl pointer-events-none animate-heart z-10"
          style={{ left: h.left, top: h.top }}
        >
          💖
        </span>
      ))}

      {/* Content */}
      <div className="p-4">
        <Link to={`/shop/${productId}`}>
          <h3 className="font-semibold text-neutral-800 text-lg mb-1 hover:text-primary-500 transition-colors line-clamp-1">
            {product.name}
          </h3>
        </Link>

        <p className="text-primary-500 font-bold text-xl mb-2">
          {formatCurrency(product.price)}
        </p>

        <p
          className={cn(
            'text-sm font-medium mb-3',
            isAvailable ? 'text-green-600' : 'text-red-500'
          )}
        >
          {isAvailable ? 'Sofort verfügbar' : 'Ausverkauft'}
        </p>

        <button
          onClick={handleAddToCart}
          disabled={!isAvailable}
          className={cn(
            'w-full py-2.5 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2',
            isAvailable
              ? inCart
                ? 'bg-secondary-400 text-neutral-800 hover:bg-secondary-500'
                : 'bg-primary-400 text-white hover:bg-primary-500 hover:-translate-y-0.5'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          )}
          aria-label={
            isAvailable
              ? inCart
                ? `${product.name} ist im Warenkorb`
                : `${product.name} in den Warenkorb legen`
              : `${product.name} ist nicht verfügbar`
          }
        >
          {inCart ? (
            <>
              <Check className="h-5 w-5" />
              Im Warenkorb
            </>
          ) : (
            <>
              <ShoppingCart className="h-5 w-5" />
              {isAvailable ? 'In den Warenkorb' : 'Nicht verfügbar'}
            </>
          )}
        </button>
      </div>
    </article>
  );
}
