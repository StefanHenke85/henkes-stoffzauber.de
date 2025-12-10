import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';

import { CartProvider } from '@/contexts/CartContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';
import { TawkToChat } from '@/components/TawkToChat';
import { CookieConsent } from '@/components/CookieConsent';

// Critical Pages (Not lazy loaded)
import { Home } from '@/pages/Home';

// Lazy Loaded Pages for Performance
const Shop = lazy(() => import('@/pages/Shop').then(m => ({ default: m.Shop })));
const ProductDetail = lazy(() => import('@/pages/ProductDetail').then(m => ({ default: m.ProductDetail })));
const Stoffe = lazy(() => import('@/pages/Stoffe').then(m => ({ default: m.Stoffe })));
const VoucherShop = lazy(() => import('@/pages/VoucherShop').then(m => ({ default: m.VoucherShop })));
const Checkout = lazy(() => import('@/pages/Checkout').then(m => ({ default: m.Checkout })));
const CheckoutSuccess = lazy(() => import('@/pages/CheckoutSuccess').then(m => ({ default: m.CheckoutSuccess })));
const CheckoutCancel = lazy(() => import('@/pages/CheckoutCancel').then(m => ({ default: m.CheckoutCancel })));
const Admin = lazy(() => import('@/pages/Admin').then(m => ({ default: m.Admin })));
const Impressum = lazy(() => import('@/pages/Impressum').then(m => ({ default: m.Impressum })));
const Datenschutz = lazy(() => import('@/pages/Datenschutz').then(m => ({ default: m.Datenschutz })));

// Loading Fallback Component
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-neutral-500">Laden...</p>
    </div>
  </div>
);

function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <Layout>
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/shop" element={<Shop />} />
                  <Route path="/shop/:productId" element={<ProductDetail />} />
                  <Route path="/stoffe" element={<Stoffe />} />
                  <Route path="/gutscheine" element={<VoucherShop />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/checkout/success" element={<CheckoutSuccess />} />
                  <Route path="/checkout/cancel" element={<CheckoutCancel />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/impressum" element={<Impressum />} />
                  <Route path="/datenschutz" element={<Datenschutz />} />
                  <Route
                    path="*"
                    element={
                      <div className="min-h-screen flex items-center justify-center">
                        <div className="text-center">
                          <h1 className="text-4xl font-bold text-neutral-800 mb-4">404</h1>
                          <p className="text-neutral-500">Seite nicht gefunden</p>
                        </div>
                      </div>
                    }
                  />
                </Routes>
              </Suspense>
            </Layout>

            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#5A4747',
                  color: '#fff',
                  borderRadius: '12px',
                },
                success: {
                  iconTheme: {
                    primary: '#C7E9D6',
                    secondary: '#5A4747',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#F2B2B4',
                    secondary: '#5A4747',
                  },
                },
              }}
            />

            {/* Tawk.to Live Chat Widget */}
            <TawkToChat />

            {/* Cookie Consent Banner */}
            <CookieConsent />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;
