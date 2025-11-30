import React, { useState, useEffect } from 'react'; 
import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate } from 'react-router-dom'; 

import Home from './components/Home';
import Shop from './components/Shop';
import AdminDashboard from './components/AdminDashboard';
import AdminLogin from './components/AdminLogin';
import ProductDetail from './components/ProductDetail';
import Stoffe from './components/Stoffe';
import Checkout from './components/Checkout';
// 🛑 KORREKTUR: Importpfade auf den components/-Ordner zurückgesetzt,
// da die Dateien Success.js und Cancel.js dort liegen.
import Success from './components/Success'; 
import Cancel from './components/Cancel'; 

import logoAsset from './assets/logo.jpg';
import { CartProvider } from './components/CartContext';
// Import für CSS hinzugefügt, falls nicht vorhanden
import './App.css';

const ProductDetailWrapper = () => {
    const { productId } = useParams();
    const navigate = useNavigate();
    return <ProductDetail productId={productId} navigate={navigate} />;
};

function App() {
    const navigate = useNavigate();
    const [isAdmin, setIsAdmin] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (token) setIsAdmin(true);
        setIsCheckingAuth(false);
    }, []);

    const handleLogin = () => {
        setIsAdmin(true);
        navigate('/admin');
    };

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        setIsAdmin(false);
        navigate('/');
    };

    const AdminProtectedRoute = () =>
        isCheckingAuth
            ? <p className="admin-loading">Lade Admin...</p>
            : isAdmin
                ? <AdminDashboard onLogout={handleLogout} />
                : <AdminLogin onLogin={handleLogin} />;

    return (
        <div className="app-container">
            <CartProvider>
                <header className="header">
                    <nav className="nav">
                        {/* Logo + Name */}
                        <Link to="/" className="nav-logo">
                            <img src={logoAsset} alt="Logo" />
                            <span>Henkes Stoffzauber</span>
                        </Link>

                        {/* Menü */}
                        <div className="nav-links">
                            <Link to="/">Startseite</Link>
                            <Link to="/shop">Shop</Link>
                            <Link to="/stoffe">Stoffe</Link>
                            <Link to="/checkout">Checkout</Link>
                            <Link to="/admin" className="admin-link">
                                {isAdmin ? 'Dashboard' : 'Login'}
                            </Link>
                        </div>
                    </nav>
                </header>

                <main className="main">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/shop" element={<Shop />} />
                        <Route path="/shop/:productId" element={<ProductDetailWrapper />} />
                        <Route path="/stoffe" element={<Stoffe />} />
                        <Route path="/checkout" element={<Checkout />} />
                        
                        {/* NEUE PAYPAL RÜCKKEHR-ROUTEN */}
                        <Route path="/checkout/success" element={<Success />} />
                        <Route path="/checkout/cancel" element={<Cancel />} />
                        
                        <Route path="/admin" element={<AdminProtectedRoute />} />
                        <Route path="*" element={<h2 className="not-found">404 - Seite nicht gefunden</h2>} />
                    </Routes>
                </main>

                <footer className="footer">
                    © 2025 Henkes-Stoffzauber.de
                </footer>
            </CartProvider>
        </div>
    );
}

export default App;