import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { XCircle, ArrowLeft, ShoppingCart } from 'lucide-react';

export function CheckoutCancel() {
  return (
    <>
      <Helmet>
        <title>Zahlung abgebrochen - Henkes Stoffzauber</title>
      </Helmet>

      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center">
          <XCircle className="h-20 w-20 text-red-400 mx-auto mb-6" />

          <h1 className="text-3xl font-bold text-neutral-800 mb-4">
            Zahlung abgebrochen
          </h1>

          <p className="text-neutral-600 mb-8">
            Die Zahlung wurde abgebrochen. Keine Sorge - es wurde kein Geld
            abgebucht. Ihr Warenkorb ist noch gespeichert.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/checkout"
              className="bg-primary-400 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-500 transition-colors inline-flex items-center justify-center gap-2"
            >
              <ShoppingCart className="h-5 w-5" />
              Erneut versuchen
            </Link>

            <Link
              to="/shop"
              className="border-2 border-primary-400 text-primary-500 px-6 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors inline-flex items-center justify-center gap-2"
            >
              <ArrowLeft className="h-5 w-5" />
              Zurück zum Shop
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
