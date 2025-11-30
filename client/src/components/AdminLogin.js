// src/components/AdminLogin.js
import React, { useState } from 'react';

// === KORREKTUR FÜR DAS DEPLOYMENT ===
// API_URL: Nur noch den relativen Pfad verwenden. Nginx leitet /api an Port 3001 weiter.
const API_URL = '/api';
// ========================================

const AdminLogin = ({ onLogin }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Der Aufruf wird zu /api/admin/login
            const res = await fetch(`${API_URL}/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            if (!res.ok) {
                // Versuche, eine spezifischere Fehlermeldung vom Backend zu erhalten
                const errorData = await res.json().catch(() => ({ message: 'Falsches Passwort' }));
                throw new Error(errorData.message || 'Falsches Passwort');
            }

            const data = await res.json();
            // ✅ Token speichern
            localStorage.setItem('adminToken', data.token);
            // ✅ App informieren
            onLogin();
        } catch (err) {
            setError('❌ ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            maxWidth: '400px',
            margin: '80px auto',
            padding: '20px',
            background: '#fff',
            borderRadius: '10px',
            boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
        }}>
            <h2 style={{ textAlign: 'center' }}>Admin Login</h2>

            <form onSubmit={handleSubmit}>
                <input
                    type="password"
                    placeholder="Admin Passwort"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '5px', border: '1px solid #ccc' }}
                    required
                />

                {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}

                <button
                    type="submit"
                    style={{ width: '100%', padding: '10px', background: '#5A4747', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                    disabled={loading}
                >
                    {loading ? 'Einloggen...' : 'Einloggen'}
                </button>
            </form>
        </div>
    );
};

export default AdminLogin;