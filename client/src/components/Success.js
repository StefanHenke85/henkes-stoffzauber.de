import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Success = () => {
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCapture = async () => {
      setLoading(true);
      // PayPal returns token or orderId param (depends) — try common names
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token') || params.get('orderId') || params.get('PayerID') || null;
      const localOrderId = sessionStorage.getItem('pendingOrderId') || null;

      if (!token) {
        setInfo({ success:false, message:'Keine PayPal-Token in URL gefunden.' });
        setLoading(false);
        return;
      }

      try {
        const res = await axios.post('/api/paypal/capture', { orderID: token, localOrderId });
        if (res.data?.success) {
          // clear pending
          sessionStorage.removeItem('pendingOrderId');
          setInfo({ success:true, msg:'Zahlung erfolgreich. Danke!' });
        } else {
          setInfo({ success:false, msg: res.data?.error || 'Capture fehlgeschlagen' });
        }
      } catch (err) {
        console.error(err);
        setInfo({ success:false, msg: err?.response?.data?.error || 'Fehler beim Abschließen der Zahlung' });
      } finally { setLoading(false); }
    };
    fetchCapture();
  }, [navigate]);

  if (loading) return <div style={{padding:20}}>Verarbeite Zahlung…</div>;

  return (
    <div style={{padding:20, textAlign:'center'}}>
      {info?.success ? (
        <>
          <h2>Vielen Dank — Zahlung erhalten 🎉</h2>
          <p>Deine Bestellung wurde erfolgreich abgeschlossen.</p>
          <button onClick={()=>window.location.href = '/'}>Zur Startseite</button>
        </>
      ) : (
        <>
          <h2>Fehler bei der Zahlung</h2>
          <p>{info?.msg || 'Unbekannter Fehler'}</p>
          <button onClick={()=>window.location.href = '/checkout'}>Zurück zur Kasse</button>
        </>
      )}
    </div>
  );
};

export default Success;
