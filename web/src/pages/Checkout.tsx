import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ShoppingBag, Truck, CreditCard, ArrowLeft, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCart } from '@/contexts/CartContext';
import { ordersApi } from '@/utils/api';
import { formatCurrency, isValidEmail, isValidZip, cn } from '@/utils/helpers';
import type { Customer } from '@/types';

export function Checkout() {
  const navigate = useNavigate();
  const { items, total, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'paypal' | 'invoice' | 'prepayment'>('paypal');

  const [address, setAddress] = useState<Customer>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    street: '',
    houseNumber: '',
    zip: '',
    city: '',
    country: 'Deutschland',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof Customer, string>>>({});

  const shipping = total >= 50 ? 0 : 4.99;
  const grandTotal = total + shipping;

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof Customer, string>> = {};

    if (!address.firstName.trim()) newErrors.firstName = 'Vorname ist erforderlich';
    if (!address.lastName.trim()) newErrors.lastName = 'Nachname ist erforderlich';
    if (!address.email.trim()) {
      newErrors.email = 'E-Mail ist erforderlich';
    } else if (!isValidEmail(address.email)) {
      newErrors.email = 'Ungültige E-Mail-Adresse';
    }
    if (!address.street.trim()) newErrors.street = 'Straße ist erforderlich';
    if (!address.houseNumber.trim()) newErrors.houseNumber = 'Hausnummer ist erforderlich';
    if (!address.zip.trim()) {
      newErrors.zip = 'PLZ ist erforderlich';
    } else if (!isValidZip(address.zip)) {
      newErrors.zip = 'Ungültige PLZ (5 Ziffern)';
    }
    if (!address.city.trim()) newErrors.city = 'Stadt ist erforderlich';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddress((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof Customer]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      toast.error('Warenkorb ist leer');
      return;
    }

    if (!validateForm()) {
      toast.error('Bitte fülle alle Pflichtfelder aus');
      return;
    }

    setLoading(true);

    try {
      const response = await ordersApi.checkout({
        cart: items,
        address,
        paymentMethod,
      });

      if (response.approvalUrl) {
        // PayPal redirect
        sessionStorage.setItem('pendingOrderId', response.order.id);
        window.location.href = response.approvalUrl;
        return;
      }

      // Non-PayPal success
      clearCart();
      toast.success('Bestellung erfolgreich!');
      navigate(`/checkout/success?orderId=${response.order.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Fehler beim Bestellen');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-8">
        <ShoppingBag className="h-20 w-20 text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-neutral-800 mb-2">
          Dein Warenkorb ist leer
        </h1>
        <p className="text-neutral-500 mb-6">
          Füge Produkte hinzu, um zur Kasse zu gehen.
        </p>
        <Link
          to="/shop"
          className="bg-primary-400 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-500 transition-colors"
        >
          Zum Shop
        </Link>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Checkout - Henkes Stoffzauber</title>
      </Helmet>

      <div className="min-h-screen bg-neutral-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 text-neutral-500 hover:text-primary-500 mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Weiter einkaufen
          </Link>

          <h1 className="text-3xl font-bold text-neutral-800 mb-8">Checkout</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Address */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h2 className="text-xl font-semibold text-neutral-800 mb-4 flex items-center gap-2">
                    <Truck className="h-5 w-5 text-primary-400" />
                    Lieferadresse
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Vorname *
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={address.firstName}
                        onChange={handleChange}
                        className={cn(
                          'w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-400 transition-all',
                          errors.firstName ? 'border-red-500' : 'border-gray-300'
                        )}
                      />
                      {errors.firstName && (
                        <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Nachname *
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={address.lastName}
                        onChange={handleChange}
                        className={cn(
                          'w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-400 transition-all',
                          errors.lastName ? 'border-red-500' : 'border-gray-300'
                        )}
                      />
                      {errors.lastName && (
                        <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        E-Mail *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={address.email}
                        onChange={handleChange}
                        className={cn(
                          'w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-400 transition-all',
                          errors.email ? 'border-red-500' : 'border-gray-300'
                        )}
                      />
                      {errors.email && (
                        <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Telefon (optional)
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={address.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Straße *
                      </label>
                      <input
                        type="text"
                        name="street"
                        value={address.street}
                        onChange={handleChange}
                        className={cn(
                          'w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-400 transition-all',
                          errors.street ? 'border-red-500' : 'border-gray-300'
                        )}
                      />
                      {errors.street && (
                        <p className="text-red-500 text-sm mt-1">{errors.street}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Hausnummer *
                      </label>
                      <input
                        type="text"
                        name="houseNumber"
                        value={address.houseNumber}
                        onChange={handleChange}
                        className={cn(
                          'w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-400 transition-all',
                          errors.houseNumber ? 'border-red-500' : 'border-gray-300'
                        )}
                      />
                      {errors.houseNumber && (
                        <p className="text-red-500 text-sm mt-1">{errors.houseNumber}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        PLZ *
                      </label>
                      <input
                        type="text"
                        name="zip"
                        value={address.zip}
                        onChange={handleChange}
                        maxLength={5}
                        className={cn(
                          'w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-400 transition-all',
                          errors.zip ? 'border-red-500' : 'border-gray-300'
                        )}
                      />
                      {errors.zip && (
                        <p className="text-red-500 text-sm mt-1">{errors.zip}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Stadt *
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={address.city}
                        onChange={handleChange}
                        className={cn(
                          'w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-400 transition-all',
                          errors.city ? 'border-red-500' : 'border-gray-300'
                        )}
                      />
                      {errors.city && (
                        <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h2 className="text-xl font-semibold text-neutral-800 mb-4 flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary-400" />
                    Zahlungsart
                  </h2>

                  <div className="space-y-3">
                    {[
                      { value: 'paypal', label: 'PayPal', desc: 'Sichere Zahlung über PayPal' },
                      { value: 'invoice', label: 'Rechnung', desc: 'Zahlung innerhalb von 14 Tagen' },
                      { value: 'prepayment', label: 'Vorkasse', desc: 'Überweisung vor Versand' },
                    ].map((method) => (
                      <label
                        key={method.value}
                        className={cn(
                          'flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-all',
                          paymentMethod === method.value
                            ? 'border-primary-400 bg-primary-50'
                            : 'border-gray-200 hover:border-primary-200'
                        )}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method.value}
                          checked={paymentMethod === method.value}
                          onChange={(e) =>
                            setPaymentMethod(e.target.value as typeof paymentMethod)
                          }
                          className="mt-1"
                        />
                        <div>
                          <p className="font-medium text-neutral-800">{method.label}</p>
                          <p className="text-sm text-neutral-500">{method.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-primary-400 text-white rounded-xl font-bold text-lg hover:bg-primary-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Wird verarbeitet...
                    </>
                  ) : (
                    `Jetzt bestellen (${formatCurrency(grandTotal)})`
                  )}
                </button>
              </form>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl p-6 shadow-sm sticky top-24">
                <h2 className="text-xl font-semibold text-neutral-800 mb-4">
                  Bestellübersicht
                </h2>

                <ul className="space-y-4 mb-6">
                  {items.map((item) => (
                    <li key={item.id} className="flex gap-3">
                      <img
                        src={item.imageUrl || 'https://placehold.co/80x80/F2B2B4/ffffff'}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-grow">
                        <p className="font-medium text-neutral-800 line-clamp-1">
                          {item.name}
                        </p>
                        <p className="text-sm text-neutral-500">
                          {item.quantity} x {formatCurrency(item.price)}
                        </p>
                      </div>
                      <p className="font-semibold text-neutral-800">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                    </li>
                  ))}
                </ul>

                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <div className="flex justify-between text-neutral-600">
                    <span>Zwischensumme</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>Versand</span>
                    <span>{shipping === 0 ? 'Kostenlos' : formatCurrency(shipping)}</span>
                  </div>
                  {shipping > 0 && (
                    <p className="text-sm text-green-600">
                      Noch {formatCurrency(50 - total)} bis zum kostenlosen Versand!
                    </p>
                  )}
                  <div className="flex justify-between text-xl font-bold text-neutral-800 pt-2 border-t border-gray-200">
                    <span>Gesamt</span>
                    <span className="text-primary-500">{formatCurrency(grandTotal)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
