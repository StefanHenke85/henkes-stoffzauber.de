// src/components/FabricCarousel.js
import React, { useState, useEffect } from 'react';

// === KORREKTUREN FÜR DAS DEPLOYMENT ===
// 1. API_URL: Nur noch den relativen Pfad verwenden. Nginx leitet /api/fabrics/featured an Port 3001 weiter.
const API_URL = '/api/fabrics/featured';
// 2. BACKEND_URL: Wird leer gelassen, da Bilder nun über Nginx ausgeliefert werden.
const BACKEND_URL = '';
// ========================================

const FALLBACK_IMAGE_URL = "https://placehold.co/500x500/F2B2B4/4F3C3C?text=Stoff";

// Hilfsfunktion: Backend-Pfad korrigieren
const getImageUrl = (imagePath) => {
    // Da Nginx den Pfad /uploads/ direkt auf das Verzeichnis mappt,
    // geben wir den Pfad 1:1 zurück, ohne den Host (BACKEND_URL).
    if (imagePath && imagePath.startsWith('/uploads/')) {
        return imagePath;
    }
    return imagePath;
};

const FabricCarousel = () => {
    const [fabrics, setFabrics] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Daten abrufen
    useEffect(() => {
        const fetchFabrics = async () => {
            try {
                // Fetch verwendet den relativen Pfad /api/fabrics/featured
                const response = await fetch(API_URL);
                if (!response.ok) throw new Error(`Netzwerkfehler: ${response.status}`);
                const data = await response.json();
                setFabrics(data);
            } catch (e) {
                console.error("Fehler beim Abrufen der Featured Fabrics:", e);
                setError(e.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchFabrics();
    }, []);

    // Auto-Rotation
    useEffect(() => {
        if (fabrics.length < 2) return;
        const interval = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % fabrics.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [fabrics]);

    if (isLoading) return <p style={{ textAlign: 'center', padding: '50px' }}>Stoff-Highlights werden geladen...</p>;
    if (error) return <p style={{ textAlign: 'center', color: '#f44336', padding: '20px' }}>Fehler beim Laden der Stoff-Highlights.</p>;
    if (fabrics.length === 0) return <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>Zurzeit keine Stoff-Highlights verfügbar.</p>;

    const currentFabric = fabrics[currentIndex];

    const carouselStyle = {
        position: 'relative',
        width: '100%',
        maxWidth: '500px',
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

    const handleFabricClick = () => {
        if (currentFabric && currentFabric.id) {
            window.location.href = `/fabrics/${currentFabric.id}`;
        }
    };

    return (
        <div style={carouselStyle} onClick={handleFabricClick}>
            <img
                src={getImageUrl(currentFabric.imageUrl || FALLBACK_IMAGE_URL)}
                alt={currentFabric.name}
                style={imageStyle}
                onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMAGE_URL; }}
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
                <h3 style={{ margin: 0, fontSize: '1.4em', color: 'var(--farbe-primär)' }}>{currentFabric.name}</h3>
                <p style={{ margin: '5px 0 0', fontWeight: 'bold', fontSize: '1.1em', color: 'var(--farbe-akzent)' }}>
                    {currentFabric.fabricType} – {currentFabric.width}x{currentFabric.length} cm
                </p>
            </div>

            <div style={{
                position: 'absolute',
                bottom: 70,
                width: '100%',
                textAlign: 'center',
            }}>
                {fabrics.map((_, index) => (
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
                        aria-label={`Zum Stoff ${index + 1} wechseln`}
                    />
                ))}
            </div>
        </div>
    );
};

export default FabricCarousel;