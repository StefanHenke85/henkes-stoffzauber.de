import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ShoppingCart, ArrowLeft, Check, X, ZoomIn } from 'lucide-react';
import { productsApi, fabricsApi } from '@/utils/api';
import { useCart } from '@/contexts/CartContext';
import { formatCurrency, getImageUrl, cn } from '@/utils/helpers';
import type { Product, Fabric } from '@/types';

export function ProductDetail() {
  const { productId } = useParams<{ productId: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [allFabrics, setAllFabrics] = useState<Fabric[]>([]);
  const [selectedFabricIds, setSelectedFabricIds] = useState<string[]>([]);

  const { addItem, isInCart, getItemQuantity } = useCart();

  useEffect(() => {
    const loadProduct = async () => {
      if (!productId) return;

      try {
        const data = await productsApi.getById(productId);
        if (data) {
          setProduct(data);
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

  useEffect(() => {
    const loadFabrics = async () => {
      try {
        const data = await fabricsApi.getAll();
        setAllFabrics(data);
      } catch (err) {
        console.error('Error loading fabrics:', err);
      }
    };

    loadFabrics();
  }, []);

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
  const imageUrl = imageError
    ? 'https://placehold.co/600x600/F2B2B4/ffffff?text=Stoffzauber'
    : getImageUrl(product.imageUrl, product.imageUrlWebp);

  // Get available fabrics for this product
  const availableFabrics = product.availableFabrics && product.availableFabrics.length > 0
    ? allFabrics.filter(f => product.availableFabrics!.includes(f.id))
    : [];

  const toggleFabric = (fabricId: string) => {
    setSelectedFabricIds(prev =>
      prev.includes(fabricId)
        ? prev.filter(id => id !== fabricId)
        : [...prev, fabricId]
    );
  };

  const handleAddToCart = () => {
    const selectedFabrics = selectedFabricIds
      .map(id => {
        const fabric = allFabrics.find(f => f.id === id);
        return fabric ? { fabricId: fabric.id, fabricName: fabric.name } : null;
      })
      .filter((f): f is { fabricId: string; fabricName: string } => f !== null);

    addItem(product, 1, selectedFabrics.length > 0 ? selectedFabrics : undefined);
  };

  return (
    <>
      <Helmet>
        <title>{product.name} - Handgemacht | Henkes Stoffzauber</title>
        <meta name="description" content={product.description?.slice(0, 160)} />
        <link rel="canonical" href={`https://henkes-stoffzauber.de/product/${productId}`} />
        <meta property="og:type" content="product" />
        <meta property="og:title" content={`${product.name} - Henkes Stoffzauber`} />
        <meta property="og:description" content={product.description?.slice(0, 160)} />
        <meta property="og:image" content={imageUrl} />
        <meta property="og:url" content={`https://henkes-stoffzauber.de/product/${productId}`} />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.name,
            description: product.description,
            image: imageUrl,
            offers: {
              '@type': 'Offer',
              price: product.price,
              priceCurrency: 'EUR',
              availability: isAvailable
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
            },
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-neutral-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="mb-8" aria-label="Breadcrumb">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 text-neutral-500 hover:text-primary-500 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Zurück zum Shop
            </Link>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Image */}
            <div className="relative">
              <div
                className="aspect-square rounded-2xl overflow-hidden bg-white shadow-lg cursor-zoom-in"
                onClick={() => setLightboxOpen(true)}
              >
                <img
                  src={imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  onError={() => setImageError(true)}
                />
                <button
                  className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-md hover:bg-white transition-colors"
                  aria-label="Bild vergrößern"
                >
                  <ZoomIn className="h-5 w-5 text-neutral-700" />
                </button>
              </div>
            </div>

            {/* Info */}
            <div className="flex flex-col">
              <h1 className="text-3xl md:text-4xl font-bold text-neutral-800 mb-4">
                {product.name}
              </h1>

              <p className="text-3xl font-bold text-primary-500 mb-4">
                {formatCurrency(product.price)}
              </p>

              <p
                className={cn(
                  'inline-flex items-center gap-2 text-lg font-semibold mb-6',
                  isAvailable ? 'text-green-600' : 'text-red-500'
                )}
              >
                {isAvailable ? (
                  <>
                    <Check className="h-5 w-5" />
                    Sofort verfügbar ({product.stock} auf Lager)
                  </>
                ) : (
                  <>
                    <X className="h-5 w-5" />
                    Ausverkauft
                  </>
                )}
              </p>

              <p className="text-neutral-600 text-lg mb-6 leading-relaxed">
                {product.description}
              </p>

              {product.fabrics && (
                <div className="mb-6">
                  <h2 className="font-semibold text-neutral-800 mb-2">
                    Verwendete Stoffe:
                  </h2>
                  <p className="text-neutral-600">{product.fabrics}</p>
                </div>
              )}

              {availableFabrics.length > 0 && (
                <div className="mb-6 bg-secondary-50 rounded-xl p-4">
                  <h2 className="font-semibold text-neutral-800 mb-3">
                    Stoffauswahl:
                  </h2>
                  <p className="text-sm text-neutral-600 mb-3">
                    Wählen Sie die Stoffe aus, aus denen dieses Produkt gefertigt werden soll:
                  </p>
                  <div className="space-y-2">
                    {availableFabrics.map(fabric => (
                      <label
                        key={fabric.id}
                        className="flex items-start gap-3 cursor-pointer hover:bg-secondary-100 p-2 rounded-lg transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedFabricIds.includes(fabric.id)}
                          onChange={() => toggleFabric(fabric.id)}
                          className="mt-1 h-5 w-5 text-primary-500 rounded border-gray-300 focus:ring-primary-400"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-neutral-800">{fabric.name}</div>
                          {fabric.description && (
                            <div className="text-sm text-neutral-600">{fabric.description}</div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-auto space-y-4">
                <button
                  onClick={handleAddToCart}
                  disabled={!isAvailable}
                  className={cn(
                    'w-full py-4 px-6 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all',
                    isAvailable
                      ? inCart
                        ? 'bg-secondary-400 text-neutral-800 hover:bg-secondary-500'
                        : 'bg-primary-400 text-white hover:bg-primary-500 hover:-translate-y-1 shadow-lg'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  )}
                >
                  {inCart ? (
                    <>
                      <Check className="h-6 w-6" />
                      Im Warenkorb ({cartQuantity})
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-6 w-6" />
                      {isAvailable ? 'In den Warenkorb' : 'Nicht verfügbar'}
                    </>
                  )}
                </button>

                {inCart && (
                  <Link
                    to="/checkout"
                    className="block w-full py-3 px-6 rounded-xl font-semibold text-center border-2 border-primary-400 text-primary-500 hover:bg-primary-50 transition-colors"
                  >
                    Zur Kasse
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Lightbox */}
        {lightboxOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setLightboxOpen(false)}
          >
            <button
              className="absolute top-4 right-4 p-2 text-white hover:bg-white/20 rounded-full transition-colors"
              aria-label="Schließen"
            >
              <X className="h-8 w-8" />
            </button>
            <img
              src={imageUrl}
              alt={product.name}
              className="max-w-full max-h-[90vh] rounded-lg"
            />
          </div>
        )}
      </div>
    </>
  );
}
