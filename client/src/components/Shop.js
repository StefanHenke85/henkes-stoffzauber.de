// src/components/Shop.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from './CartContext';
import './Shop.css';

const API_URL = 'http://localhost:3001/api/products';
const BACKEND_URL = 'http://localhost:3001';
const FALLBACK_IMAGE_URL = "https://placehold.co/400x400/CCCCCC/333333?text=Stoffmuster";

const getImageUrl = (imagePath) => {
  if (!imagePath) return FALLBACK_IMAGE_URL;
  if (imagePath.startsWith('/uploads/')) return `${BACKEND_URL}${imagePath}`;
  return imagePath;
};

const ProductCard = ({ product, onAdd }) => {
  const [hearts, setHearts] = useState([]);

  const handleAdd = (e) => {
    // create a few temporary hearts
    const rect = e.currentTarget.getBoundingClientRect();
    const newHearts = Array.from({length: 3}).map(() => ({
      id: Date.now() + Math.random(),
      left: Math.random() * 60 + '%',
      top: Math.random() * 20 + '%'
    }));
    setHearts(h => [...h, ...newHearts]);
    onAdd(product);
    setTimeout(() => {
      setHearts(h => h.filter(x => !newHearts.some(n => n.id === x.id)));
    }, 700);
  };

  return (
    <div className="product-card">
      <Link to={`/shop/${product.id}`}>
        <img src={getImageUrl(product.imageUrl)} alt={product.name} onError={(e)=> e.target.src = FALLBACK_IMAGE_URL} />
      </Link>
      <h3>{product.name}</h3>
      <p className="price-tag">€ {(Number(product.price) || 0).toFixed(2)}</p>
      <p className={product.stock > 0 ? 'instock' : 'outstock'}>
        {product.stock > 0 ? 'Sofort verfügbar' : 'Ausverkauft'}
      </p>
      <button className="heart-button" onClick={handleAdd} disabled={product.stock <= 0}>
        {product.stock > 0 ? 'In den Warenkorb' : 'Nicht lieferbar'}
      </button>

      {hearts.map(h => (
        <span key={h.id} className="flying-heart" style={{ left: h.left, top: h.top, position:'absolute' }}>
          💖
        </span>
      ))}
    </div>
  );
};

const Shop = () => {
  const { cartItems, addToCart, removeOne, removeFromCart, clearCart } = useCart();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [cartVisible, setCartVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(API_URL)
      .then(r => r.json())
      .then(data => {
        // ensure prices are numbers
        const cleaned = data.map(p => ({ ...p, price: Number(p.price || 0) }));
        setProducts(cleaned);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const total = cartItems.reduce((s, i) => s + Number(i.price || 0) * i.quantity, 0);

  if (loading) return <p className="loading">Shop wird geladen...</p>;

  return (
    <div className="shop-container" style={{ paddingTop: '100px' }}>
      <h1 className="shop-title">Schau dich um ✨</h1>
      <h2> "alle artikel sind noch beispiele !!!" </h2>
      <h2> "noch ist es kein Shop" </h2>

      <input className="search-input" placeholder="Suche ..." value={search} onChange={e => setSearch(e.target.value)} />

      {filtered.length === 0 ? (
        <p className="no-results">Kein Produkt gefunden.</p>
      ) : (
        <div className="product-grid">
          {filtered.map(p => <ProductCard key={p.id} product={p} onAdd={addToCart} />)}
        </div>
      )}

      {/* Floating cart toggle */}
      <button className="open-cart-button" onClick={() => setCartVisible(v => !v)}>
        🛒 {cartItems.reduce((sum, i) => sum + i.quantity, 0)}
      </button>

      {/* Cart panel */}
      <div className={`sticky-cart ${cartVisible ? 'visible' : ''}`}>
        <h3>🛒 Dein Warenkorb</h3>
        {cartItems.length === 0 ? (
          <p>Dein Warenkorb ist leer</p>
        ) : (
          <>
            <ul className="cart-list">
              {cartItems.map(item => (
                <li key={item.id} className="cart-item">
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div>
                      <strong>{item.name}</strong>
                      <div style={{ fontSize:'0.9rem' }}>€ {(Number(item.price)||0).toFixed(2)} x {item.quantity}</div>
                    </div>
                    <div style={{ display:'flex', gap:8 }}>
                      <button onClick={() => removeOne(item.id)} title="Menge -1">➖</button>
                      <button onClick={() => addToCart(item, 1)} title="Menge +1">➕</button>
                      <button onClick={() => removeFromCart(item.id)} title="Entfernen">❌</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div style={{ marginTop: 10 }}>
              <strong>Gesamt: € {total.toFixed(2)}</strong>
            </div>

            <div style={{ display:'flex', gap:8, marginTop:10 }}>
              <Link to="/checkout"><button>Zur Kasse</button></Link>
              <button onClick={clearCart}>Alles löschen</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Shop;
