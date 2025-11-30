import React, { useState } from 'react';
import { useCart } from './CartContext';
import axios from 'axios';
import './Checkout.css';

const Checkout = () => {
  const { cartItems, clearCart } = useCart();
  const [address, setAddress] = useState({
    firstName: '',
    lastName: '',
    street: '',
    houseNumber: '',
    zip: '',
    city: '',
    email: '',
    phone: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('paypal');
  const [loading, setLoading] = useState(false);
  const [orderResult, setOrderResult] = useState(null);

  const total = (cartItems || []).reduce((sum, i) => sum + i.price * i.quantity, 0).toFixed(2);

  const handleInput = e => setAddress(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cartItems.length) return alert("Warenkorb ist leer");
    setLoading(true);

    try {
      const res = await axios.post('http://localhost:3001/api/checkout', {
        cart: cartItems,
        address,
        paymentMethod
      });

      setOrderResult(res.data);
      clearCart();
    } catch (err) {
      console.error(err);
      alert("Fehler beim Bestellen!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-container">
      <h2>Checkout</h2>

      <form className="checkout-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <div>
            <label>Vorname</label>
            <input name="firstName" value={address.firstName} onChange={handleInput} required />
          </div>
          <div>
            <label>Nachname</label>
            <input name="lastName" value={address.lastName} onChange={handleInput} required />
          </div>
        </div>

        <div className="form-row">
          <div>
            <label>Straße</label>
            <input name="street" value={address.street} onChange={handleInput} required />
          </div>
          <div>
            <label>Hausnummer</label>
            <input name="houseNumber" value={address.houseNumber} onChange={handleInput} required />
          </div>
        </div>

        <div className="form-row">
          <div>
            <label>PLZ</label>
            <input name="zip" value={address.zip} onChange={handleInput} required />
          </div>
          <div>
            <label>Stadt</label>
            <input name="city" value={address.city} onChange={handleInput} required />
          </div>
        </div>

        <div className="form-row">
          <div>
            <label>E-Mail</label>
            <input name="email" value={address.email} onChange={handleInput} required type="email" />
          </div>
          <div>
            <label>Telefon</label>
            <input name="phone" value={address.phone} onChange={handleInput} />
          </div>
        </div>

        <label>Zahlungsmethode</label>
        <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
          <option value="paypal">PayPal</option>
          <option value="invoice">Rechnung</option>
        </select>

        <div className="checkout-total">
          Gesamt: <strong>€{total}</strong>
        </div>

        <div className="checkout-buttons">
          <button type="submit" disabled={loading}>
            {loading ? "Bitte warten..." : "Bestellen"}
          </button>
        </div>
      </form>

      {orderResult?.invoicePath && (
        <a className="checkout-download" href={`http://localhost:3001${orderResult.invoicePath}`} target="_blank" rel="noreferrer">
          Rechnung herunterladen 💖
        </a>
      )}
    </div>
  );
};

export default Checkout;
