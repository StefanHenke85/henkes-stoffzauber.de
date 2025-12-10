import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { ScrollToTop } from '@/components/ScrollToTop';
import { cn } from '@/utils/helpers';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { itemCount } = useCart();
  const location = useLocation();

  const navLinks = [
    { href: '/', label: 'Startseite' },
    { href: '/shop', label: 'Shop' },
    { href: '/stoffe', label: 'Stoffe' },
    { href: '/gutscheine', label: 'Gutscheine' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-primary-400/90 backdrop-blur-md shadow-lg border-b-4 border-primary-300">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-3 group"
              aria-label="Zur Startseite"
            >
              <img
                src="/logo.jpg"
                alt="Henkes Stoffzauber Logo"
                className="h-12 w-12 rounded-full border-3 border-white shadow-md transition-transform group-hover:rotate-[-6deg] group-hover:scale-105"
                loading="eager"
              />
              <span className="text-white font-bold text-xl tracking-wide hidden sm:block">
                Henkes Stoffzauber
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    'px-4 py-2 rounded-full font-semibold text-white transition-all',
                    'hover:bg-white/30 hover:-translate-y-0.5',
                    isActive(link.href) && 'bg-white/40'
                  )}
                >
                  {link.label}
                </Link>
              ))}

              {/* Cart Button */}
              <Link
                to="/checkout"
                className="relative px-4 py-2 rounded-full font-semibold text-white bg-white/20 hover:bg-white/30 transition-all"
                aria-label={`Warenkorb mit ${itemCount} Artikeln`}
              >
                <ShoppingCart className="h-5 w-5 inline-block" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-secondary-400 text-neutral-800 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </Link>

            
              
            </div>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 text-white"
              aria-label={menuOpen ? 'Menü schließen' : 'Menü öffnen'}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
            >
              {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {menuOpen && (
            <div id="mobile-menu" className="md:hidden py-4 border-t border-white/20">
              <div className="flex flex-col gap-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      'px-4 py-3 rounded-lg font-semibold text-white transition-all',
                      'hover:bg-white/20',
                      isActive(link.href) && 'bg-white/30'
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  to="/checkout"
                  onClick={() => setMenuOpen(false)}
                  className="px-4 py-3 rounded-lg font-semibold text-white bg-white/20 flex items-center gap-2"
                >
                  <ShoppingCart className="h-5 w-5" />
                  Warenkorb ({itemCount})
                </Link>
              
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-grow">{children}</main>

      {/* Footer */}
      <footer className="bg-primary-400/90 text-white py-8 border-t-4 border-primary-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* About */}
            <div>
              <h3 className="font-bold text-lg mb-3">Henkes Stoffzauber</h3>
              <p className="text-white/80 text-sm">
                Handgemachte Nähkreationen mit Liebe gefertigt.
              </p>
            </div>

            {/* Links */}
            <div>
              <h3 className="font-bold text-lg mb-3">Links</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/shop" className="text-white/80 hover:text-white transition-colors">
                    Shop
                  </Link>
                </li>
                <li>
                  <Link to="/stoffe" className="text-white/80 hover:text-white transition-colors">
                    Stoffe
                  </Link>
                </li>
                <li>
                  <Link to="/impressum" className="text-white/80 hover:text-white transition-colors">
                    Impressum
                  </Link>
                </li>
                <li>
                  <Link to="/datenschutz" className="text-white/80 hover:text-white transition-colors">
                    Datenschutz
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-bold text-lg mb-3">Kontakt</h3>
              <p className="text-white/80 text-sm">
                E-Mail: info@henkes-stoffzauber.de
              </p>
            </div>
          </div>

          <div className="border-t border-white/20 mt-8 pt-8 text-center text-sm text-white/60">
            &copy; {new Date().getFullYear()} Henkes Stoffzauber. Alle Rechte vorbehalten.
          </div>
        </div>
      </footer>

      {/* Scroll to Top Button */}
      <ScrollToTop />
    </div>
  );
}
