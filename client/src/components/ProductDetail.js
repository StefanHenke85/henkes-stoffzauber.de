// src/components/ProductDetail.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useCart } from './CartContext';

// === KORREKTUREN FÜR DAS DEPLOYMENT ===
// 1. API_URL: Nur noch den relativen Pfad verwenden. Nginx leitet /api an Port 3001 weiter.
const API_URL = '/api/products';
// 2. BACKEND_URL: Wird leer gelassen, da Bilder nun über Nginx ausgeliefert werden.
const BACKEND_URL = ''; 
// ========================================

const FALLBACK_IMAGE_URL = "https://placehold.co/400x400/CCCCCC/333333?text=Kein+Bild";

const getImageUrl = (imagePath) => {
    // Da Nginx so konfiguriert ist, dass es den Pfad /uploads/ direkt zum Verzeichnis auf dem Server mappt,
    // geben wir den Pfad 1:1 zurück, ohne einen Host-Namen.
    if (imagePath && imagePath.startsWith('/uploads/')) return imagePath;
    return imagePath || FALLBACK_IMAGE_URL;
};

const ProductDetail = () => {
    const { productId } = useParams();
    const { cartItems, addToCart } = useCart();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lightboxOpen, setLightboxOpen] = useState(false);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                // API-Aufruf verwendet jetzt den relativen Pfad: /api/products/123
                const res = await fetch(`${API_URL}/${productId}`); 
                if (!res.ok) throw new Error('Produkt nicht gefunden');
                const data = await res.json();
                setProduct(data);
            } catch (err) {
                setError(err.message);
            } finally { setLoading(false); }
        };
        fetchProduct();
    }, [productId]);

    if (loading) return <p style={{ textAlign:'center', padding:'50px' }}>Lade Produkt...</p>;
    if (error) return <p style={{ textAlign:'center', color:'red', padding:'50px' }}>{error}</p>;
    if (!product) return null;

    const isInStock = product.stock > 0;
    const totalCartItems = (cartItems || []).reduce((sum, item) => sum + item.quantity, 0);

    return (
        <div style={{ maxWidth:'1000px', margin:'50px auto', padding:'0 20px', display:'flex', gap:'50px', flexWrap:'wrap' }}>
            {/* Bild */}
            <div style={{ flex: '1 1 400px', textAlign:'center' }}>
                <img
                    src={getImageUrl(product.imageUrl)}
                    alt={product.name}
                    style={{ width:'100%', maxWidth:'450px', borderRadius:'12px', cursor:'pointer' }}
                    onClick={() => setLightboxOpen(true)}
                    onError={e => { e.target.onerror = null; e.target.src = FALLBACK_IMAGE_URL; }}
                />
            </div>

            {/* Lightbox */}
            {lightboxOpen && (
                <div
                    onClick={() => setLightboxOpen(false)}
                    style={{
                        position:'fixed', top:0, left:0, width:'100%', height:'100%',
                        backgroundColor:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000
                    }}
                >
                    <img src={getImageUrl(product.imageUrl)} alt={product.name} style={{ maxWidth:'90%', maxHeight:'90%' }} />
                </div>
            )}

            {/* Infos */}
            <div style={{ flex: '1 1 400px' }}>
                <h1 style={{ fontSize:'2em', marginBottom:'20px' }}>{product.name}</h1>
                <p style={{ fontWeight:'bold', fontSize:'1.5em', color:'var(--farbe-akzent)' }}>€ {product.price.toFixed(2)}</p>
                <p style={{ color: isInStock ? 'green' : 'red', fontWeight:'bold', marginBottom:'20px' }}>
                    {isInStock ? 'Sofort verfügbar' : 'Ausverkauft'}
                </p>
                <p style={{ marginBottom:'20px' }}>{product.description}</p>
                {product.fabrics && <p style={{ marginBottom:'20px' }}><strong>Stoff(e):</strong> {product.fabrics}</p>}

                <button
                    onClick={() => addToCart(product, 1)}
                    disabled={!isInStock}
                    style={{
                        backgroundColor: isInStock ? 'var(--farbe-primär)' : '#aaa',
                        color: 'var(--farbe-hell)',
                        borderRadius: '8px',
                        padding: '12px 20px',
                        fontWeight: 'bold',
                        cursor: isInStock ? 'pointer' : 'not-allowed'
                    }}
                >
                    {isInStock ? 'In den Warenkorb (1)' : 'Nicht lieferbar'}
                </button>

                <p style={{ marginTop:'20px', fontWeight:'bold' }}>🛒 Insgesamt im Warenkorb: {totalCartItems} Artikel</p>
            </div>
        </div>
    );
};

export default ProductDetail;