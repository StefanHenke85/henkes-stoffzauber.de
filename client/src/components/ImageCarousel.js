// src/components/ImageCarousel.js
import React, { useState, useEffect } from 'react';

const API_URL = 'http://localhost:3001/api/products/featured'; // Backend-URL
const BACKEND_URL = 'http://localhost:3001';

/**
 * Hilfsfunktion: Korrigiert Bildpfade, die vom Backend kommen.
 */
const getImageUrl = (imagePath) => {
    if (imagePath && imagePath.startsWith('/uploads/')) {
        return `${BACKEND_URL}${imagePath}`;
    }
    return imagePath;
};

const ImageCarousel = () => {
    const [products, setProducts] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // 1. Datenabruf beim Laden der Komponente
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await fetch(API_URL);
                if (!response.ok) throw new Error(`Netzwerkfehler: ${response.status}`);
                const data = await response.json();
                setProducts(data.filter(p => p.stock > 0 && p.isFeatured)); // Nur echte Featured-Produkte
            } catch (e) {
                console.error("Fehler beim Abrufen der Featured Products:", e);
                setError(e.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProducts();
    }, []);

    // 2. Auto-Rotation
    useEffect(() => {
        if (products.length < 2) return;
        const interval = setInterval(() => {
            setCurrentIndex(prevIndex => (prevIndex + 1) % products.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [products]);

    if (isLoading) return <p style={{ textAlign: 'center', padding: '50px' }}>Highlights werden geladen...</p>;
    if (error) return <p style={{ textAlign: 'center', color: '#f44336', padding: '20px' }}>Fehler beim Laden der Highlights.</p>;
    if (products.length === 0) return <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>Zurzeit keine Highlights verfügbar.</p>;

    const currentProduct = products[currentIndex];

    const carouselStyle = {
        position: 'relative',
        width: '100%',
        maxWidth: '800px',
        height: '450px',
        margin: '0 auto',
        overflow: 'hidden',
        borderRadius: '15px',
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
        cursor: 'pointer',
    };

    const imageStyle = {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        transition: 'opacity 0.5s ease-in-out',
        opacity: 1,
    };

    const handleProductClick = () => {
        if (currentProduct && currentProduct.id) {
            window.location.href = `/shop/${currentProduct.id}`;
        }
    };

    return (
        <div style={carouselStyle} onClick={handleProductClick}>
            <img
                src={getImageUrl(currentProduct.imageUrl)}
                alt={currentProduct.name}
                style={imageStyle}
                onError={(e) => { e.target.onerror = null; e.target.src = ''; }}
            />
            <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                padding: '15px 20px',
                textAlign: 'center',
                color: 'var(--farbe-text)',
                borderBottomLeftRadius: '15px',
                borderBottomRightRadius: '15px',
            }}>
                <h3 style={{ margin: 0, fontSize: '1.4em', color: 'var(--farbe-primär)' }}>{currentProduct.name}</h3>
                <p style={{ margin: '5px 0 0', fontWeight: 'bold', fontSize: '1.1em', color: 'var(--farbe-akzent)' }}>
                    Nur € {currentProduct.price.toFixed(2)}
                </p>
            </div>
            <div style={{
                position: 'absolute',
                bottom: 70,
                width: '100%',
                textAlign: 'center',
            }}>
                {products.map((_, index) => (
                    <span
                        key={index}
                        style={{
                            height: '10px',
                            width: '10px',
                            margin: '0 4px',
                            backgroundColor: index === currentIndex ? 'var(--farbe-akzent)' : 'rgba(255, 255, 255, 0.8)',
                            borderRadius: '50%',
                            display: 'inline-block',
                            cursor: 'pointer',
                            transition: 'background-color 0.3s ease',
                            border: '1px solid var(--farbe-text)'
                        }}
                        onClick={(e) => { e.stopPropagation(); setCurrentIndex(index); }}
                        aria-label={`Zum Produkt ${index + 1} wechseln`}
                    />
                ))}
            </div>
        </div>
    );
};

export default ImageCarousel;
