import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ShoppingCart, ArrowLeft, Check, Ruler, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { productsApi } from '@/utils/api';
import { useCart } from '@/contexts/CartContext';
import { formatCurrency, getImageUrl, cn } from '@/utils/helpers';
import type { Product } from '@/types';

export function ProductDetail() {
  const { productId } = useParams<{ productId: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string>('');

  const { addItem, isInCart, getItemQuantity } = useCart();

  // Load product data
  useEffect(() => {
    const loadProduct = async () => {
      if (!productId) return;

      try {
        const data = await productsApi.getById(productId);
        if (data) {
          setProduct(data);
          // Set default size if available
          if (data.sizeType === 'oneSize') {
            setSelectedSize('Einheitsgröße');
          }
        } else {
          setError('Produkt nicht gefunden');
        }
      } catch (err) {
        setError('Fehler beim Laden des Produkts');
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [productId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-400 border-t-transparent" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <p className="text-red-500 text-xl mb-4">{error || 'Produkt nicht gefunden'}</p>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 text-primary-500 hover:underline"
        >
          <ArrowLeft className="h-5 w-5" />
          Zurück zum Shop
        </Link>
      </div>
    );
  }

  const inCart = isInCart(product.id || product._id || '');
  const cartQuantity = getItemQuantity(product.id || product._id || '');
  const isAvailable = product.stock > 0;
  const productImageUrl = imageError
    ? 'https://placehold.co/600x600/F2B2B4/ffffff?text=Stoffzauber'
    : getImageUrl(product.imageUrl, product.imageUrlWebp);

  const handleAddToCart = () => {
    if (!isAvailable) {
      toast.error('Produkt ist nicht verfügbar');
      return;
    }

    // Validate size selection if product requires size
    if (product.sizeType && product.sizeType !== 'oneSize' && !selectedSize) {
      toast.error('Bitte wähle eine Größe aus');
      return;
    }

    // Validate head circumference input
    if (product.sizeType === 'headCircumference' && selectedSize) {
      const circumference = parseFloat(selectedSize);
      if (isNaN(circumference) || circumference < 40 || circumference > 70) {
        toast.error('Bitte gib einen gültigen Kopfumfang zwischen 40 und 70 cm ein');
        return;
      }
    }

    // Create cart item with selected size
    const cartItem: Product & { selectedSize?: string } = {
      ...product,
    };

    if (selectedSize) {
      cartItem.selectedSize = selectedSize;
    }

    addItem(cartItem as Product, 1);
    toast.success('Produkt zum Warenkorb hinzugefügt!');
  };

  const getSizeLabel = () => {
    if (!product.sizeType) return null;
    if (product.sizeType === 'headCircumference') return 'Kopfumfang (cm)';
    if (product.sizeType === 'clothing') return 'Größe';
    if (product.sizeType === 'dimensions') return 'Maße (Länge x Breite)';
    return null;
  };

  return (
    <>
      <Helmet>
        <title>{product.name} - Henkes Stoffzauber</title>
        <meta name="description" content={product.description} />
      </Helmet>

      <div className="min-h-screen bg-neutral-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 text-primary-500 hover:text-primary-600 mb-8 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Zurück zum Shop
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Product Image */}
            <div className="space-y-4">
              <div className="relative bg-white rounded-2xl shadow-lg overflow-hidden aspect-square max-h-[800px]">
                <img
                  src={productImageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              </div>
            </div>

            {/* Product Details */}
            <div className="space-y-6">
              <div>
                <h1 className="text-4xl font-bold text-neutral-800 mb-3">
                  {product.name}
                </h1>
                <p className="text-3xl font-bold text-primary-500">
                  {formatCurrency(product.price)}
                </p>
              </div>

              {/* Description */}
              <div className="prose prose-neutral max-w-none">
                <p className="text-neutral-600 leading-relaxed">{product.description}</p>
              </div>

              {/* Seller Info */}
              {product.tailorName && (
                <div className="flex items-center gap-2 bg-primary-50 rounded-lg p-4 border border-primary-200">
                  <span className="text-neutral-700">
                    Handgefertigt von <span className="font-semibold text-primary-500">{product.tailorName}</span>
                  </span>
                </div>
              )}

              {/* Availability Status */}
              <div className="flex items-center gap-2">
                {isAvailable ? (
                  <>
                    <Check className="h-5 w-5 text-green-500" />
                    <span className="text-green-600 font-semibold">Verfügbar</span>
                  </>
                ) : (
                  <>
                    <X className="h-5 w-5 text-red-500" />
                    <span className="text-red-600 font-semibold">Nicht verfügbar</span>
                  </>
                )}
              </div>

              {/* Size Selection */}
              {product.sizeType && product.sizeType !== 'oneSize' && (
                <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
                  <h3 className="text-lg font-bold text-neutral-800 flex items-center gap-2">
                    <Ruler className="h-5 w-5" />
                    {getSizeLabel()}
                  </h3>

                  {/* Input field for head circumference */}
                  {product.sizeType === 'headCircumference' ? (
                    <div className="space-y-2">
                      <label htmlFor="head-circumference" className="block text-sm font-medium text-neutral-700">
                        Kopfumfang in cm eingeben
                      </label>
                      <input
                        id="head-circumference"
                        type="number"
                        min="40"
                        max="70"
                        step="0.5"
                        value={selectedSize || ''}
                        onChange={(e) => setSelectedSize(e.target.value)}
                        placeholder="z.B. 52"
                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 transition-all text-lg font-semibold"
                      />
                      <p className="text-xs text-neutral-500">
                        Empfohlener Bereich: 40-70 cm
                      </p>
                    </div>
                  ) : (
                    /* Button grid for clothing sizes and dimensions */
                    product.availableSizes && product.availableSizes.length > 0 && (
                      <div className="grid grid-cols-4 gap-2">
                        {product.availableSizes.map((size) => (
                          <button
                            type="button"
                            key={size}
                            onClick={() => setSelectedSize(size)}
                            className={cn(
                              'px-4 py-3 rounded-lg font-semibold transition-all border-2',
                              selectedSize === size
                                ? 'bg-primary-400 text-white border-primary-400'
                                : 'bg-white text-neutral-700 border-gray-300 hover:border-primary-300'
                            )}
                          >
                            {product.sizeType === 'dimensions' ? `${size} cm` : size}
                          </button>
                        ))}
                      </div>
                    )
                  )}
                </div>
              )}

              {/* Add to Cart */}
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!isAvailable}
                className={cn(
                  'w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3',
                  isAvailable
                    ? 'bg-primary-400 text-white hover:bg-primary-500 hover:shadow-lg hover:-translate-y-0.5'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                )}
              >
                <ShoppingCart className="h-6 w-6" />
                {inCart ? `Im Warenkorb (${cartQuantity})` : 'In den Warenkorb'}
              </button>

              {/* Product Info */}
              {product.fabrics && (
                <div className="bg-primary-50 rounded-xl p-4 border border-primary-200">
                  <p className="text-sm text-neutral-700">
                    <strong>Verwendeter Stoff:</strong> {product.fabrics}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
