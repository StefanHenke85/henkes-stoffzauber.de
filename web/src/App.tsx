import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';

import { CartProvider } from '@/contexts/CartContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';
import { WhatsAppChat } from '@/components/WhatsAppChat';

// Pages
import { Home } from '@/pages/Home';
import { Shop } from '@/pages/Shop';
import { ProductDetail } from '@/pages/ProductDetail';
import { Stoffe } from '@/pages/Stoffe';
import { Checkout } from '@/pages/Checkout';
import { CheckoutSuccess } from '@/pages/CheckoutSuccess';
import { CheckoutCancel } from '@/pages/CheckoutCancel';
import { Admin } from '@/pages/Admin';
import { Impressum } from '@/pages/Impressum';
import { Datenschutz } from '@/pages/Datenschutz';

function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/shop/:productId" element={<ProductDetail />} />
                <Route path="/stoffe" element={<Stoffe />} />
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

            {/* WhatsApp Chat Widget */}
            <WhatsAppChat />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;
