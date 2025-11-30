import React from 'react';

const Cancel = () => {
  return (
    <div style={{padding:20, textAlign:'center'}}>
      <h2>Bezahlung abgebrochen</h2>
      <p>Die Zahlung wurde nicht abgeschlossen. Du kannst den Bestellvorgang erneut versuchen.</p>
      <div style={{marginTop:16}}>
        <a href="/checkout">Zur Kasse zurück</a>
      </div>
    </div>
  );
};

export default Cancel;
