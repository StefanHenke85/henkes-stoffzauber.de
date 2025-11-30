// client/src/index.js (Kompletter Code)

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Importiert die Styles und Farbcodes
import App from './App';
// Importiere den Router
import { BrowserRouter } from 'react-router-dom';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* Wir umschließen die App mit dem Router */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);