import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { CheckCircle, Package, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { ordersApi } from '@/utils/api';
import { useCart } from '@/contexts/CartContext';
import { formatCurrency, formatDate } from '@/utils/helpers';
import type { Order } from '@/types';

export function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [capturing, setCapturing] = useState(false);
  const { clearCart } = useCart();

  useEffect(() => {
    const processOrder = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }

      try {
        // Check if this is a PayPal return (capture payment)
        const pendingOrderId = sessionStorage.getItem('pendingOrderId');
        if (pendingOrderId === orderId) {
          setCapturing(true);
          const capturedOrder = await ordersApi.capturePayment(orderId);
          setOrder(capturedOrder);
          sessionStorage.removeItem('pendingOrderId');
          clearCart();
        } else {
          // Just load order details
          const orderData = await ordersApi.getOrder(orderId);
          setOrder(orderData);
        }
      } catch (error) {
        console.error('Error processing order:', error);
      } finally {
        setLoading(false);
        setCapturing(false);
      }
    };

    processOrder();
  }, [orderId, clearCart]);

  if (loading || capturing) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary-400 mx-auto mb-4" />
          <p className="text-neutral-600">
            {capturing ? 'Zahlung wird verarbeitet...' : 'Bestellung wird geladen...'}
          </p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-8">
        <CheckCircle className="h-20 w-20 text-green-500 mb-4" />
        <h1 className="text-3xl font-bold text-neutral-800 mb-2">
          Vielen Dank für Ihre Bestellung!
        </h1>
        <p className="text-neutral-500 mb-6">
          Sie erhalten in Kürze eine Bestätigung per E-Mail.
        </p>
        <Link
          to="/shop"
          className="bg-primary-400 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-500 transition-colors inline-flex items-center gap-2"
        >
          Weiter einkaufen
          <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Bestellung erfolgreich - Henkes Stoffzauber</title>
      </Helmet>

      <div className="min-h-screen bg-neutral-50 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Success Header */}
          <div className="text-center mb-12">
            <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-neutral-800 mb-2">
              Vielen Dank für Ihre Bestellung!
            </h1>
            <p className="text-neutral-600">
              Bestellnummer: <span className="font-semibold">{order.orderNumber}</span>
            </p>
          </div>

          {/* Order Details */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
            {/* Header */}
            <div className="bg-primary-50 px-6 py-4 border-b border-primary-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary-500" />
                  <span className="font-semibold text-neutral-800">Bestelldetails</span>
                </div>
                <span className="text-sm text-neutral-500">
                  {order.createdAt && formatDate(order.createdAt)}
                </span>
              </div>
            </div>

            {/* Items */}
            <div className="p-6">
              <ul className="space-y-4 mb-6">
                {order.items.map((item, index) => (
                  <li key={index} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-neutral-800">{item.name}</p>
                      <p className="text-sm text-neutral-500">
                        {item.quantity} x {formatCurrency(item.price)}
                      </p>
                    </div>
                    <p className="font-semibold">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </li>
                ))}
              </ul>

              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-neutral-600">
                  <span>Zwischensumme</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Versand</span>
                  <span>
                    {order.shipping === 0 ? 'Kostenlos' : formatCurrency(order.shipping)}
                  </span>
                </div>
                <div className="flex justify-between text-xl font-bold text-neutral-800 pt-2 border-t">
                  <span>Gesamt</span>
                  <span className="text-primary-500">{formatCurrency(order.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <h2 className="font-semibold text-neutral-800 mb-3">Lieferadresse</h2>
            <p className="text-neutral-600">
              {order.customer.firstName} {order.customer.lastName}
              <br />
              {order.customer.street} {order.customer.houseNumber}
              <br />
              {order.customer.zip} {order.customer.city}
              <br />
              {order.customer.country || 'Deutschland'}
            </p>
          </div>

          {/* Email Notification */}
          <div className="bg-secondary-50 rounded-xl p-6 flex items-start gap-4">
            <Mail className="h-6 w-6 text-secondary-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-neutral-800 mb-1">
                Bestätigung per E-Mail
              </h3>
              <p className="text-neutral-600 text-sm">
                Wir haben eine Bestellbestätigung an{' '}
                <span className="font-medium">{order.customer.email}</span> gesendet.
                Bitte überprüfen Sie auch Ihren Spam-Ordner.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/shop"
              className="bg-primary-400 text-white px-8 py-3 rounded-lg font-semibold text-center hover:bg-primary-500 transition-colors inline-flex items-center justify-center gap-2"
            >
              Weiter einkaufen
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
