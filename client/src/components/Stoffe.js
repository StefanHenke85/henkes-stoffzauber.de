import React, { useEffect, useState } from 'react';
import './Stoffe.css';

// === KORREKTUREN FÜR DAS DEPLOYMENT ===
// 1. API_URL: Nur noch den relativen Pfad verwenden. Nginx leitet /api/fabrics an Port 3001 weiter.
const API_URL = '/api/fabrics';
// 2. BACKEND_URL: Wird leer gelassen, da Bilder nun über Nginx ausgeliefert werden.
const BACKEND_URL = ''; 
// ========================================

const FALLBACK_IMAGE = "https://placehold.co/600x600/F2B2B4/4F3C3C?text=Stoff";

const getImageUrl = (path) => {
    if (path && path.startsWith('/uploads/')) {
        // Da Nginx den Pfad /uploads/ direkt auf das Verzeichnis mappt,
        // geben wir den Pfad 1:1 zurück, ohne den Host (BACKEND_URL).
        return path;
    }
    return path;
};

const Stoffe = () => {
    const [fabrics, setFabrics] = useState([]);
    const [selectedImage, setSelectedImage] = useState(null);

    useEffect(() => {
        const fetchFabrics = async () => {
            try {
                // Fetch verwendet den relativen Pfad /api/fabrics
                const res = await fetch(API_URL);
                const data = await res.json();
                setFabrics(data);
            } catch (err) {
                console.error("Fehler beim Laden der Stoffe:", err);
            }
        };
        fetchFabrics();
    }, []);

    return (
        <div className="stoffe-container">
            <h1 className="stoffe-title">Unsere Stoffgalerie</h1>
            <p className="stoffe-info">
                Wählen Sie Ihren Lieblingsstoff – ideal für individuelle Wünsche und maßgeschneiderte Produkte.
            </p>

            <div className="stoffe-grid">
                {fabrics.map(fabric => (
                    <div key={fabric.id} className="stoffe-item" onClick={() => setSelectedImage(getImageUrl(fabric.imageUrl))}>
                        <img 
                            src={getImageUrl(fabric.imageUrl) || FALLBACK_IMAGE} 
                            alt={fabric.name}
                            onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
                        />
                        <p>{fabric.name}</p>
                    </div>
                ))}
            </div>

            {/* Bild in Großansicht */}
            {selectedImage && (
                <div className="stoffe-modal" onClick={() => setSelectedImage(null)}>
                    <img src={selectedImage} alt="Stoff Großansicht" />
                </div>
            )}
        </div>
    );
};

export default Stoffe;