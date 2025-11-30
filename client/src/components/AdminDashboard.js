// client/src/components/AdminDashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import { LogOut, Edit, Trash2 } from 'lucide-react';
import './AdminDashboard.css';

// === KORREKTUREN FÜR DAS DEPLOYMENT ===
// 1. API_URL: Nur noch den relativen Pfad verwenden. Nginx leitet /api an Port 3001 weiter.
const API_URL = '/api';
// 2. BACKEND_URL: Wird leer gelassen, da Bilder nun über Nginx ausgeliefert werden.
const BACKEND_URL = '';
// ========================================

const FALLBACK_IMAGE_URL = "https://placehold.co/100x100/CCCCCC/333333?text=N/A";

const getAuthHeaders = () => {
    const token = localStorage.getItem('adminToken');
    // Die Auth-Header brauchen wir weiterhin für die Sicherheit
    return token ? { 
        Authorization: `Bearer ${token}` 
    } : {};
};

const getImageUrl = (imagePath) => {
    // Da Nginx den /uploads/-Pfad abfängt, geben wir den Pfad 1:1 zurück.
    if (imagePath && imagePath.startsWith('/uploads/')) return imagePath;
    return imagePath || FALLBACK_IMAGE_URL;
};

// ------------------- ProductForm -------------------
const ProductForm = ({ productToEdit, onSubmit, onCancel }) => {
// ... (Der Inhalt von ProductForm bleibt unverändert, da die Logik für FormData korrekt ist)
    const [formData, setFormData] = useState(productToEdit || {
        name: '',
        description: '',
        price: 0,
        stock: 0,
        fabrics: '',
        isFeatured: false,
        imageFile: null
    });

    useEffect(() => {
        setFormData(productToEdit || {
            name: '',
            description: '',
            price: 0,
            stock: 0,
            fabrics: '',
            isFeatured: false,
            imageFile: null
        });
    }, [productToEdit]);

    const handleChange = (e) => {
        const { name, value, type, checked, files } = e.target;
        if (name === 'imageFile') setFormData({ ...formData, imageFile: files[0] });
        else if (type === 'checkbox') setFormData({ ...formData, [name]: checked });
        else setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = (e) => { e.preventDefault(); onSubmit(formData); };

    return (
        <form onSubmit={handleSubmit} className="form-card">
            <h2>{productToEdit ? "Produkt bearbeiten" : "Neues Produkt erstellen"}</h2>

            <label>Produktname</label>
            <input type="text" name="name" placeholder="Produktname" value={formData.name} onChange={handleChange} required />

            <label>Beschreibung</label>
            <textarea name="description" placeholder="Beschreibung" value={formData.description} onChange={handleChange} required />

            <label>Preis (€)</label>
            <input type="number" name="price" placeholder="Preis (€)" value={formData.price} onChange={handleChange} min="0" step="0.01" required />

            <label>Verfügbar Stückzahl</label>
            <input type="number" name="stock" placeholder="Bestand" value={formData.stock} onChange={handleChange} min="0" required />

            <label>Stoff(e)</label>
            <input type="text" name="fabrics" placeholder="z.B. Jersey, Fleece" value={formData.fabrics} onChange={handleChange} />

            <label>
                <input type="checkbox" name="isFeatured" checked={formData.isFeatured} onChange={handleChange} /> Als Angebot anzeigen
            </label>

            <label>Bild auswählen</label>
            <input type="file" name="imageFile" onChange={handleChange} accept="image/*" />

            <div className="form-button-row">
                <button type="submit">{productToEdit ? "Speichern" : "Erstellen"}</button>
                {productToEdit && <button type="button" onClick={onCancel}>Abbrechen</button>}
            </div>
        </form>
    );
};

// ------------------- FabricForm -------------------
const FabricForm = ({ fabricToEdit, onSubmit, onCancel }) => {
// ... (Der Inhalt von FabricForm bleibt unverändert, da die Logik für FormData korrekt ist)
    const [formData, setFormData] = useState(fabricToEdit || {
        name: '',
        fabricType: '',
        width: 0,
        length: 0,
        suitableFor: '',
        isFeatured: false,
        imageFile: null
    });

    useEffect(() => {
        setFormData(fabricToEdit || {
            name: '',
            fabricType: '',
            width: 0,
            length: 0,
            suitableFor: '',
            isFeatured: false,
            imageFile: null
        });
    }, [fabricToEdit]);

    const handleChange = (e) => {
        const { name, value, type, checked, files } = e.target;
        if (name === 'imageFile') setFormData({ ...formData, imageFile: files[0] });
        else if (type === 'checkbox') setFormData({ ...formData, [name]: checked });
        else setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const data = new FormData();
        if (fabricToEdit) data.append('id', fabricToEdit.id);
        data.append('name', formData.name);
        data.append('fabricType', formData.fabricType);
        data.append('width', formData.width);
        data.append('length', formData.length);
        data.append('suitableFor', formData.suitableFor);
        data.append('isFeatured', formData.isFeatured);
        if (formData.imageFile) data.append('imageFile', formData.imageFile);
        onSubmit(data, !!fabricToEdit);
    };

    return (
        <form onSubmit={handleSubmit} className="form-card">
            <h2>{fabricToEdit ? "Stoff bearbeiten" : "Neuen Stoff hinzufügen"}</h2>

            <label>Stoffname</label>
            <input name="name" placeholder="Stoffname" value={formData.name} onChange={handleChange} required />

            <label>Stoffart</label>
            <input name="fabricType" placeholder="z.B. Baumwolle, Jersey" value={formData.fabricType} onChange={handleChange} required />

            <label>Verfügbare Breite (cm)</label>
            <input name="width" type="number" placeholder="Breite in cm" min="0" value={formData.width} onChange={handleChange} required />

            <label>Verfügbare Länge (cm)</label>
            <input name="length" type="number" placeholder="Länge in cm" min="0" value={formData.length} onChange={handleChange} required />

            <label>Geeignet für</label>
            <input name="suitableFor" placeholder="z.B. Kleidung, Polster" value={formData.suitableFor} onChange={handleChange} />

            <label>
                <input type="checkbox" name="isFeatured" checked={formData.isFeatured} onChange={handleChange} /> Als Highlight anzeigen
            </label>

            <label>Bild auswählen</label>
            <input type="file" name="imageFile" onChange={handleChange} accept="image/*" />

            <div className="form-button-row">
                <button type="submit">{fabricToEdit ? "Speichern" : "Erstellen"}</button>
                {fabricToEdit && <button type="button" onClick={onCancel}>Abbrechen</button>}
            </div>
        </form>
    );
};

// ------------------- AdminDashboard -------------------
const AdminDashboard = ({ onLogout }) => {
    const [products, setProducts] = useState([]);
    const [fabrics, setFabrics] = useState([]);
    const [currentProduct, setCurrentProduct] = useState(null);
    const [currentFabric, setCurrentFabric] = useState(null);
    const [message, setMessage] = useState("");
    const [productSearch, setProductSearch] = useState('');
    const [fabricSearch, setFabricSearch] = useState('');

    const fetchAll = useCallback(async () => {
        try {
            // Relative Pfade für API-Aufrufe
            const prodRes = await fetch(`${API_URL}/products`, { headers: getAuthHeaders() });
            const fabRes = await fetch(`${API_URL}/fabrics`, { headers: getAuthHeaders() });
            if (!prodRes.ok || !fabRes.ok) throw new Error("Fehler beim Laden");
            setProducts(await prodRes.json());
            setFabrics(await fabRes.json());
        } catch (err) { setMessage("❌ " + err.message); }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const handleProductSubmit = async (data) => {
        try {
            const formData = new FormData();
            if (data.id) formData.append('id', data.id);
            formData.append('name', data.name);
            formData.append('description', data.description);
            formData.append('price', data.price);
            formData.append('stock', data.stock);
            formData.append('fabrics', data.fabrics);
            formData.append('isFeatured', data.isFeatured);
            if (data.imageFile) formData.append('imageFile', data.imageFile);

            const method = data.id ? "PUT" : "POST";
            // Relative Pfade
            const url = data.id ? `${API_URL}/products/${data.id}` : `${API_URL}/products`;

            const res = await fetch(url, { method, headers: getAuthHeaders(), body: formData });
            if (!res.ok) throw new Error("Fehler beim Speichern");

            setMessage("✅ Produkt gespeichert");
            setCurrentProduct(null);
            fetchAll();
        } catch (err) { setMessage("❌ " + err.message); }
    };

    const handleDeleteProduct = async (id) => {
        if (!window.confirm("Produkt wirklich löschen?")) return;
        try {
            // Relative Pfade
            const res = await fetch(`${API_URL}/products/${id}`, { method: "DELETE", headers: getAuthHeaders() });
            if (!res.ok) throw new Error("Fehler beim Löschen");
            setMessage("✅ Produkt gelöscht");
            fetchAll();
        } catch (err) { setMessage("❌ " + err.message); }
    };

    const handleFabricSubmit = async (formData, isEdit) => {
        try {
            const method = isEdit ? 'PUT' : 'POST';
            // Relative Pfade
            const url = isEdit ? `${API_URL}/fabrics/${formData.get('id')}` : `${API_URL}/fabrics`;

            const res = await fetch(url, { method, headers: getAuthHeaders(), body: formData });
            if (!res.ok) throw new Error("Fehler beim Speichern");

            setMessage(isEdit ? "✅ Stoff aktualisiert" : "✅ Stoff erstellt");
            setCurrentFabric(null);
            fetchAll();
        } catch (err) { setMessage("❌ " + err.message); }
    };

    const handleDeleteFabric = async (id) => {
        if (!window.confirm("Stoff wirklich löschen?")) return;
        try {
            // Relative Pfade
            const res = await fetch(`${API_URL}/fabrics/${id}`, { method: "DELETE", headers: getAuthHeaders() });
            if (!res.ok) throw new Error("Fehler beim Löschen");
            setMessage("✅ Stoff gelöscht");
            fetchAll();
        } catch (err) { setMessage("❌ " + err.message); }
    };

    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
        (p.fabrics && p.fabrics.toLowerCase().includes(productSearch.toLowerCase()))
    );

    const filteredFabrics = fabrics.filter(f => 
        f.name.toLowerCase().includes(fabricSearch.toLowerCase()) || 
        (f.fabricType && f.fabricType.toLowerCase().includes(fabricSearch.toLowerCase()))
    );

    return (
        <div className="admin-dashboard-container">
            <h1>Admin Dashboard</h1>
            <button className="logout-button" onClick={() => { localStorage.removeItem('adminToken'); onLogout(); }}>
                <LogOut /> Logout
            </button>

            {message && <p className={`status-message ${message.includes("❌") ? "status-message-error" : "status-message-success"}`}>{message}</p>}

            {/* Produkte */}
            <div className="admin-dashboard-grid">
                <ProductForm productToEdit={currentProduct} onSubmit={handleProductSubmit} onCancel={() => setCurrentProduct(null)} />
                <div className="admin-list-container">
                    <h3>Produkte ({products.length})</h3>
                    <input type="text" placeholder="Suchen..." value={productSearch} onChange={e => setProductSearch(e.target.value)} className="search-input" />
                    {filteredProducts.map(p => (
                        <div key={p.id} className="admin-list-item">
                            <img src={getImageUrl(p.imageUrl)} alt={p.name} />
                            <div className="admin-list-item-info">
                                <strong>{p.name}</strong>
                                <span>Stoff(e): {p.fabrics || "N/A"}</span>
                                <span>Preis: €{p.price}</span>
                                <span>Bestand: {p.stock}</span>
                                <span>Highlight: {p.isFeatured ? "Ja" : "Nein"}</span>
                            </div>
                            <div className="admin-list-item-actions">
                                <button onClick={() => setCurrentProduct(p)}><Edit /></button>
                                <button onClick={() => handleDeleteProduct(p.id)}><Trash2 /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Stoffe */}
            <div className="admin-dashboard-grid" style={{ marginTop: '40px' }}>
                <FabricForm fabricToEdit={currentFabric} onSubmit={handleFabricSubmit} onCancel={() => setCurrentFabric(null)} />
                <div className="admin-list-container">
                    <h3>Stoffe ({fabrics.length})</h3>
                    <input type="text" placeholder="Suchen..." value={fabricSearch} onChange={e => setFabricSearch(e.target.value)} className="search-input" />
                    {filteredFabrics.map(f => (
                        <div key={f.id} className="admin-list-item">
                            <img src={getImageUrl(f.imageUrl)} alt={f.name} />
                            <div className="admin-list-item-info">
                                <strong>{f.name}</strong>
                                <span>Stoffart: {f.fabricType}</span>
                                <span>Größe: {f.width}cm x {f.length}cm</span>
                                <span>Geeignet für: {f.suitableFor || "N/A"}</span>
                                <span>Highlight: {f.isFeatured ? "Ja" : "Nein"}</span>
                            </div>
                            <div className="admin-list-item-actions">
                                <button onClick={() => setCurrentFabric(f)}><Edit /></button>
                                <button onClick={() => handleDeleteFabric(f.id)}><Trash2 /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;