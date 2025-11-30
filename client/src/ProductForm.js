import React, { useState, useEffect, useMemo } from 'react';

// Verwendung von useMemo, um ESLint-Warnung (exhaustive-deps) zu beheben
const getInitialState = (productToEdit) => productToEdit || {
    name: '',
    description: '',
    price: 0,
    stock: 0, // FIX: Bestand (stock) wird hier als Standardwert 0 hinzugefügt
    isFeatured: false,
    imageFile: null,
    imageUrl: '', 
};

const ProductForm = ({ productToEdit, onSubmit, onCancel }) => {
    
    // FIX: useMemo behebt die ESLint-Warnung
    const initialState = useMemo(() => getInitialState(productToEdit), [productToEdit]);
    
    const [formData, setFormData] = useState(initialState);
    const [isEditing, setIsEditing] = useState(!!productToEdit);
    const [previewImage, setPreviewImage] = useState(formData.imageUrl || null);


    useEffect(() => {
        // Setzt das Formular zurück, wenn ein neues oder kein Produkt zum Bearbeiten übergeben wird
        setFormData(initialState);
        setIsEditing(!!productToEdit);
        setPreviewImage(initialState.imageUrl || null);
    }, [initialState, productToEdit]); 
    

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setFormData(prev => ({
            ...prev,
            imageFile: file,
        }));
        if (file) {
            setPreviewImage(URL.createObjectURL(file));
        } else {
            // Wenn der Benutzer eine Auswahl löscht, zurück zur bestehenden Bild-URL, falls vorhanden
            setPreviewImage(formData.imageUrl || null);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const submissionData = new FormData();
        
        // Fügt alle Formularfelder zur FormData hinzu
        submissionData.append('name', formData.name);
        submissionData.append('description', formData.description);
        // Stellt sicher, dass Preis und Bestand als Zahlen gesendet werden
        submissionData.append('price', parseFloat(formData.price));
        submissionData.append('stock', parseInt(formData.stock, 10)); // WICHTIG: Das Stock-Feld wird übergeben
        submissionData.append('isFeatured', formData.isFeatured);

        if (formData.imageFile) {
            submissionData.append('imageFile', formData.imageFile);
        }
        
        // Für den PUT-Request muss die alte URL mitgeschickt werden, wenn kein neues Bild hochgeladen wird
        if (isEditing && formData.imageUrl && !formData.imageFile) {
            // Die URL ist notwendig, damit das Backend weiß, welches Bild beibehalten werden soll
            submissionData.append('imageUrl', formData.imageUrl);
        }

        onSubmit(submissionData, isEditing);
    };

    /**
     * Korrigiert Bildpfade vom Backend (die mit '/uploads/' beginnen)
     * zu einer vollständigen URL, die vom Browser geladen werden kann.
     */
    const getImageUrl = (imagePath) => {
        if (imagePath && imagePath.startsWith('/uploads/')) {
            return `http://localhost:3001${imagePath}`;
        }
        // Behandelt externe URLs oder bereits vollständige Pfade
        return imagePath;
    };


    return (
        // Verwendet jetzt CSS-Klassen aus index.css
        <form onSubmit={handleSubmit} className="admin-form-container">
            <h2 style={{ fontSize: '1.5em', color: '#333', borderBottom: '1px solid #eee', paddingBottom: '15px', margin: '0 0 20px 0' }}>
                {isEditing ? `Produkt bearbeiten: ${productToEdit?.name}` : 'Neues Produkt erstellen'}
            </h2>

            <div className="admin-form-group">
                <label htmlFor="name" className="admin-form-label">Produktname</label>
                <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Produktname (z.B. Jersey Stoff Blumen)"
                    className="admin-form-input"
                    required
                />
            </div>

            <div className="admin-form-group">
                <label htmlFor="description" className="admin-form-label">Beschreibung</label>
                <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Beschreibung..."
                    rows="4"
                    className="admin-form-input"
                    style={{ resize: 'vertical' }}
                    required
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="admin-form-group">
                    <label htmlFor="price" className="admin-form-label">Preis (€)</label>
                    <input
                        type="number"
                        id="price"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        className="admin-form-input"
                        required
                    />
                </div>
                
                {/* FIX: Das Stock-Feld wird hier hinzugefügt. */}
                <div className="admin-form-group">
                    <label htmlFor="stock" className="admin-form-label">Stückzahl/Bestand</label>
                    <input
                        type="number"
                        id="stock"
                        name="stock"
                        value={formData.stock}
                        onChange={handleChange}
                        min="0"
                        step="1"
                        className="admin-form-input"
                        required
                    />
                </div>
            </div>

            <div className="admin-form-group" style={{ borderTop: '1px solid #eee', paddingTop: '15px' }}>
                <label htmlFor="imageFile" className="admin-form-label">Produktbild auswählen</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '10px' }}>
                    <input
                        type="file"
                        id="imageFile"
                        name="imageFile"
                        onChange={handleFileChange}
                        accept="image/*"
                        // Bild ist nur bei neuerstellung erforderlich
                        required={!isEditing}
                    />
                    
                    {(previewImage || (isEditing && formData.imageUrl)) && (
                        <div style={{ position: 'relative' }}>
                            <img 
                                src={previewImage || getImageUrl(formData.imageUrl)} 
                                alt="Vorschau" 
                                style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ddd' }}
                                onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/60x60/eee/333?text=Defekt"; }}
                            />
                            {isEditing && <span style={{ fontSize: '0.8em', color: '#666', display: 'block', textAlign: 'center' }}>Aktuell</span>}
                        </div>
                    )}
                </div>
            </div>
            
            <div className="admin-form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                    type="checkbox"
                    id="isFeatured"
                    name="isFeatured"
                    checked={formData.isFeatured}
                    onChange={handleChange}
                    style={{ width: '20px', height: '20px' }}
                />
                <label htmlFor="isFeatured" style={{ margin: 0, fontWeight: 'normal', cursor: 'pointer' }}>
                    Als "Featured Product" auf der Startseite anzeigen
                </label>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" className="admin-form-submit-button">
                    {isEditing ? 'Änderungen speichern' : 'Produkt erstellen'}
                </button>
            </div>
            
            {isEditing && (
                <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
                    <button type="button" onClick={onCancel} className="admin-form-submit-button" style={{backgroundColor: '#666'}}>
                        Abbrechen (Zurück zur Erstellung)
                    </button>
                </div>
            )}
        </form>
    );
};

export default ProductForm;