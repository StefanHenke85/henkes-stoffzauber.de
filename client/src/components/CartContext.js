// src/components/CartContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const raw = localStorage.getItem('cart');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });

  useEffect(() => {
    try { localStorage.setItem('cart', JSON.stringify(cartItems)); }
    catch {}
  }, [cartItems]);

  const addToCart = (product, quantity = 1) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + quantity } : i);
      }
      // ensure numeric price
      const p = { ...product, price: Number(product.price || 0), quantity };
      return [...prev, p];
    });
  };

  // remove single quantity (decrease) or remove item entirely if qty<=1
  const removeOne = (productId) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.id === productId);
      if (!existing) return prev;
      if (existing.quantity > 1) {
        return prev.map(i => i.id === productId ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return prev.filter(i => i.id !== productId);
    });
  };

  // remove item entirely
  const removeFromCart = (productId) => {
    setCartItems(prev => prev.filter(i => i.id !== productId));
  };

  const clearCart = () => setCartItems([]);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeOne, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
