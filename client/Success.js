import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom'; // 🛑 'Link' hinzugefügt
import axios from 'axios';

// 🛑 Backend-Endpoint zur Abschließung der PayPal-Zahlung
const API_CAPTURE_URL = '/api/paypal/capture';

const Success = () => {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('wird verarbeitet...');
    const [error, setError] = useState(null);

    // PayPal sendet die OrderID (token) und PayerID zurück
    const orderID = searchParams.get('token');
    const payerID = searchParams.get('PayerID');

    useEffect(() => {
        // Clear the cart here if needed, once payment is confirmed
        // For now, we rely on the server side to handle order finalization.
    }, []);

    useEffect(() => {
        if (!orderID || !payerID) {
            setError("Fehlende PayPal-Bestellinformationen.");
            setStatus('Fehler');
            return;
        }
        
        // Zahlung abschließen (Capture)
        const capturePayment = async () => {
            try {
                setStatus('Zahlung wird abgeschlossen...');
                
                // Wir senden die OrderID an den Backend-Endpoint
                const res = await axios.post(API_CAPTURE_URL, { orderID });

                if (res.data.success && res.data.captureStatus === 'COMPLETED') {
                    setStatus('Zahlung erfolgreich abgeschlossen! 🎉');
                    // 💡 Hier könnten Sie auch den Warenkorb leeren, da die Zahlung bestätigt wurde
                    // setCartItems([]); 
                } else {
                    setError(`Zahlungsstatus: ${res.data.captureStatus || 'Unbekannt'}. Bitte den Administrator kontaktieren.`);
                    setStatus('Fehler beim Abschluss');
                }

            } catch (err) {
                console.error("Capture Error:", err);
                setError("Es gab ein Problem beim Abschließen der Zahlung. Bitte wenden Sie sich an den Kundenservice.");
                setStatus('Serverfehler');
            }
        };

        capturePayment();
    }, [orderID, payerID]);

    return (
        <div className="checkout-container text-center">
            <h2 className={`text-2xl font-bold p-4 rounded-lg shadow-md ${error ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                Zahlungsbestätigung
            </h2>
            <div className="p-6 bg-white rounded-lg shadow-xl mt-4">
                <p className="text-xl font-medium mb-4">Status: <span className="font-semibold">{status}</span></p>
                
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-md mt-4">
                        <p className="font-bold">Fehler:</p>
                        <p>{error}</p>
                    </div>
                )}

                {!error && status === 'Zahlung erfolgreich abgeschlossen! 🎉' && (
                    <div className="mt-6">
                        <p className="text-gray-600">Vielen Dank für Ihre Bestellung! Eine Bestätigung und die Rechnung wurden per E-Mail an Sie versandt.</p>
                    </div>
                )}
                
                <div className="mt-8 space-x-4">
                    <Link to="/shop" className="inline-block px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-150">
                        Weiter einkaufen
                    </Link>
                    <Link to="/" className="inline-block px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition duration-150">
                        Zur Startseite
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Success;