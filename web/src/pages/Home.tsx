import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, Sparkles, Heart, Truck, Users } from 'lucide-react';
import { productsApi } from '@/utils/api';
import { ProductCard } from '@/components/ProductCard';
import type { Product } from '@/types';

export function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFeatured = async () => {
      try {
        const products = await productsApi.getFeatured();
        setFeaturedProducts(products);
      } catch (error) {
        console.error('Failed to load featured products:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFeatured();
  }, []);

  return (
    <>
      <Helmet>
        <title>Henkes Stoffzauber - Marktplatz für handgenähte Unikate</title>
        <meta
          name="description"
          content="Marktplatz für handgefertigte Nähkreationen. Entdecke einzigartige Mützen, Schals, Loops und mehr von talentierten Näherinnen und Nähern. Jedes Stück ein Unikat!"
        />
        <link rel="canonical" href="https://henkes-stoffzauber.de/" />
      </Helmet>

      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="/uploads/1764276141636-banner.jpg"
            alt="Henkes Stoffzauber Banner"
            className="w-full h-full object-cover"
            loading="eager"
            fetchPriority="high"
            decoding="async"
            width="1920"
            height="600"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary-100/90 via-primary-50/85 to-secondary-100/90"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-neutral-800 mb-6 drop-shadow-sm">
                Willkommen bei{' '}
                <span className="text-primary-500">Henkes Stoffzauber</span>
              </h1>
              <p className="text-lg md:text-xl text-neutral-800 mb-8 max-w-2xl drop-shadow-sm">
                Dein Marktplatz für handgenähte Unikate. Entdecke einzigartige
                Kreationen von talentierten Näherinnen und Nähern aus der Region.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Link
                  to="/shop"
                  className="inline-flex items-center justify-center gap-2 bg-primary-400 text-white px-8 py-3 rounded-full font-semibold text-lg hover:bg-primary-500 hover:-translate-y-1 transition-all shadow-lg"
                >
                  Unikate entdecken
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  to="/verkaeufer/registrieren"
                  className="inline-flex items-center justify-center gap-2 bg-white text-neutral-800 px-8 py-3 rounded-full font-semibold text-lg hover:bg-gray-50 hover:-translate-y-1 transition-all shadow-md"
                >
                  Verkäufer werden
                </Link>
              </div>
            </div>

            <div className="flex-1 flex justify-center">
              <div className="relative w-64 h-64 md:w-80 md:h-80 animate-float">
                <div className="absolute inset-0 rounded-full bg-white shadow-2xl"></div>
                <img
                  src="/logo.jpg"
                  alt="Henkes Stoffzauber Logo"
                  className="absolute inset-2 w-[calc(100%-16px)] h-[calc(100%-16px)] rounded-full object-contain bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-10 left-10 text-4xl opacity-30 animate-pulse z-10 drop-shadow-lg">
          🧵
        </div>
        <div className="absolute bottom-10 right-10 text-4xl opacity-30 animate-pulse delay-500 z-10 drop-shadow-lg">
          ✂️
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                <Heart className="h-8 w-8 text-primary-500" />
              </div>
              <h3 className="font-bold text-xl text-neutral-800 mb-2">
                Echte Handarbeit
              </h3>
              <p className="text-neutral-600">
                Jedes Produkt ist ein liebevoll gefertigtes Unikat.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-secondary-100 rounded-full mb-4">
                <Users className="h-8 w-8 text-secondary-600" />
              </div>
              <h3 className="font-bold text-xl text-neutral-800 mb-2">
                Lokale Künstler
              </h3>
              <p className="text-neutral-600">
                Unterstütze talentierte Näherinnen und Näher aus der Region.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                <Sparkles className="h-8 w-8 text-primary-500" />
              </div>
              <h3 className="font-bold text-xl text-neutral-800 mb-2">
                Höchste Qualität
              </h3>
              <p className="text-neutral-600">
                Nur die besten Stoffe für einzigartige Kreationen.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-secondary-100 rounded-full mb-4">
                <Truck className="h-8 w-8 text-secondary-600" />
              </div>
              <h3 className="font-bold text-xl text-neutral-800 mb-2">
                Schneller Versand
              </h3>
              <p className="text-neutral-600">
                Kostenloser Versand ab 50€ Bestellwert.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-800 mb-4">
              Aktuelle Highlights
            </h2>
            <p className="text-neutral-600 max-w-2xl mx-auto">
              Entdecke die neuesten handgefertigten Unikate unserer Verkäufer.
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl h-80 animate-pulse"
                />
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id || product._id} product={product} />
              ))}
            </div>
          ) : (
            <p className="text-center text-neutral-500">
              Noch keine Produkte vorhanden.
            </p>
          )}

          <div className="text-center mt-10">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 bg-primary-400 text-white px-8 py-3 rounded-full font-semibold hover:bg-primary-500 transition-colors"
            >
              Alle Unikate ansehen
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section for Sellers */}
      <section className="py-16 bg-gradient-to-r from-primary-400 to-primary-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Du nähst selbst? Werde Verkäufer!
          </h2>
          <p className="text-lg text-white/90 max-w-2xl mx-auto mb-8">
            Zeige deine handgefertigten Kreationen der Welt. Registriere dich kostenlos
            und verkaufe deine Unikate auf unserem Marktplatz.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/verkaeufer/registrieren"
              className="inline-flex items-center gap-2 bg-white text-primary-500 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors"
            >
              Jetzt registrieren
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              to="/verkaeufer/login"
              className="inline-flex items-center gap-2 bg-transparent border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white/10 transition-colors"
            >
              Verkäufer-Login
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
