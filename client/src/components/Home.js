// src/components/Home.js
import React from 'react'; 
import { useNavigate } from 'react-router-dom';
import './Home.css'; 
import logoAsset from '../assets/logo.jpg';
import ImageCarousel from './ImageCarousel';
import FabricCarousel from './FabricCarousel';

const Home = () => {
    const navigate = useNavigate(); 

    const handleShopClick = () => {
        navigate('/shop'); 
    };

    const handleFabricClick = () => {
        navigate('/stoffe'); 
    };

    return (
        <div className="home-container">

            {/* HERO / INTRO */}
            <section className="hero-section">
                <div className="hero-content">
                    <h1 className="hero-title">Willkommen bei Henkes Stoffzauber</h1>
                    <p className="hero-text">
                        Entdecken Sie hochwertige Stoffe, kreative Ideen und
                        liebevoll gefertigte Produkte. Perfekt für jedes Nähprojekt!
                    </p>

                    <div className="hero-buttons">
                        <button onClick={handleShopClick}>Zum Shop</button>
                        <button onClick={handleFabricClick}>Zu den Stoffen</button>
                    </div>
                </div>

                <div className="hero-logo">
                    <img 
                        src={logoAsset} 
                        alt="Henkes Stoffzauber Logo"
                        onError={(e) => { 
                            e.target.onerror = null; 
                            e.target.src = 'https://placehold.co/350x150/6f42c1/ffffff?text=LOGO+FEHLT';
                        }}
                    />
                </div>
            </section>

            {/* CAROUSEL-BEREICH */}
            <section className="carousel-section">
                <div className="carousel-block">
                    <h2>⭐ Produkt-Highlights ⭐</h2>
                    <ImageCarousel />
                </div>

                <div className="carousel-block">
                    <h2>🧵 Stoff-Highlights 🧵</h2>
                    <FabricCarousel />
                </div>
            </section>

            {/* INFO */}
            <section className="home-info">
                <h2>Qualität, die man fühlt</h2>
                <p>
                    Jeder Stoff wird sorgfältig ausgewählt, um höchste Ansprüche 
                    an Haptik, Haltbarkeit und Farbe zu erfüllen.
                </p>
            </section>

        </div>
    );
};

export default Home;
