import { useEffect, useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Search, ShoppingCart, Filter, X } from 'lucide-react';
import { productsApi } from '@/utils/api';
import { ProductCard } from '@/components/ProductCard';
import { CartSidebar } from '@/components/CartSidebar';
import { useCart } from '@/contexts/CartContext';
import { debounce, cn } from '@/utils/helpers';
import type { Product } from '@/types';

export function Shop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'available' | 'featured'>('all');
  const { itemCount } = useCart();

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await productsApi.getAll();
        setProducts(data);
      } catch (error) {
        console.error('Failed to load products:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const debouncedSetSearch = useMemo(
    () => debounce((value: string) => setSearch(value), 300),
    []
  );

  const filteredProducts = useMemo(() => {
    let result = products;

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.description?.toLowerCase().includes(searchLower) ||
          p.fabrics?.toLowerCase().includes(searchLower)
      );
    }

    // Apply category filter
    if (filter === 'available') {
      result = result.filter((p) => p.stock > 0);
    } else if (filter === 'featured') {
      result = result.filter((p) => p.isFeatured);
    }

    return result;
  }, [products, search, filter]);

  return (
    <>
      <Helmet>
        <title>Shop - Henkes Stoffzauber</title>
        <meta
          name="description"
          content="Entdecken Sie unsere handgefertigten Produkte. Mützen, Schals, Loops und mehr - alles mit Liebe genäht."
        />
      </Helmet>

      <div className="min-h-screen bg-neutral-50">
        {/* Header with Banner Background */}
        <div className="relative py-12 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img
              src="/api/uploads/1764276141636-banner.jpg"
              alt="Banner"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary-100/90 to-secondary-100/90"></div>
          </div>
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-bold text-neutral-800 text-center mb-4 drop-shadow-sm">
              Schau dich um ✨
            </h1>
            <p className="text-neutral-800 text-center max-w-2xl mx-auto drop-shadow-sm">
              Entdecke unsere handgefertigten Kreationen - jedes Stück ein Unikat!
            </p>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="sticky top-16 z-30 bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              {/* Search */}
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="search"
                  placeholder="Suche..."
                  onChange={(e) => debouncedSetSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-all"
                  aria-label="Produkte suchen"
                />
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-gray-500" />
                <div className="flex gap-1">
                  {[
                    { value: 'all', label: 'Alle' },
                    { value: 'available', label: 'Verfügbar' },
                    { value: 'featured', label: 'Featured' },
                  ].map((f) => (
                    <button
                      key={f.value}
                      onClick={() => setFilter(f.value as typeof filter)}
                      className={cn(
                        'px-4 py-2 rounded-lg font-medium text-sm transition-all',
                        filter === f.value
                          ? 'bg-primary-400 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Cart Button */}
                <button
                  onClick={() => setCartOpen(true)}
                  className="relative ml-4 p-2.5 bg-primary-400 text-white rounded-lg hover:bg-primary-500 transition-colors"
                  aria-label={`Warenkorb öffnen, ${itemCount} Artikel`}
                >
                  <ShoppingCart className="h-5 w-5" />
                  {itemCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-secondary-400 text-neutral-800 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {itemCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl h-96 animate-pulse"
                />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
                <Search className="h-10 w-10 text-gray-400" />
              </div>
              <h2 className="text-xl font-semibold text-neutral-800 mb-2">
                Keine Produkte gefunden
              </h2>
              <p className="text-neutral-500 mb-4">
                {search
                  ? `Keine Ergebnisse für "${search}"`
                  : 'Keine Produkte in dieser Kategorie'}
              </p>
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="inline-flex items-center gap-2 text-primary-500 font-medium hover:underline"
                >
                  <X className="h-4 w-4" />
                  Suche zurücksetzen
                </button>
              )}
            </div>
          ) : (
            <>
              <p className="text-neutral-500 mb-6">
                {filteredProducts.length}{' '}
                {filteredProducts.length === 1 ? 'Produkt' : 'Produkte'} gefunden
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id || product._id}
                    product={product}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Cart Sidebar */}
        <CartSidebar isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      </div>
    </>
  );
}
