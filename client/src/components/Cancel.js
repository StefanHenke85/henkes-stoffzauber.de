import React from 'react';
import { Link } from 'react-router-dom';
// 🛑 KORREKTUR: Der Pfad muss './CartContext' sein, da sich beide Dateien
// im selben Ordner (/client/src/components/) befinden.
import { useCart } from './CartContext'; 

const Cancel = () => {
    // Stellen Sie sicher, dass CartContext verfügbar ist, um die Artikelanzahl zu zeigen
    const { cartItems } = useCart(); 
    const cartCount = cartItems.length;

    return (
        <div className="checkout-container text-center">
            <h2 className="text-2xl font-bold p-4 rounded-lg shadow-md bg-yellow-100 text-yellow-800">
                Zahlung abgebrochen 😔
            </h2>
            <div className="p-6 bg-white rounded-lg shadow-xl mt-4">
                <p className="text-xl font-medium mb-4">
                    Sie haben den Zahlungsvorgang abgebrochen.
                </p>
                <p className="text-gray-600">
                    Keine Sorge, Ihr Warenkorb ist mit {cartCount} Artikeln noch gefüllt.
                </p>
                <p className="text-gray-600">
                    Sie können es erneut versuchen, eine andere Zahlungsmethode wählen oder zur Kasse zurückkehren.
                </p>
                
                <div className="mt-8 space-x-4">
                    <Link to="/checkout" className="inline-block px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition duration-150">
                        Zurück zur Kasse
                    </Link>
                    <Link to="/shop" className="inline-block px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition duration-150">
                        Weiter einkaufen
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Cancel;