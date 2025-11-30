import React, { useEffect, useState } from 'react';

const BACKEND_URL = ''; // Leer, da relative Pfade verwendet werden

const AdminDashboard = () => {
  const [products, setProducts] = useState([]);
  const token = localStorage.getItem('adminToken');

  const fetchProducts = async () => {
    const res = await fetch('/api/products');
    const data = await res.json();
    setProducts(data);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (productId) => {
    if (!window.confirm("Produkt wirklich löschen?")) return;

    try {
      const res = await fetch(`/api/products/${String(productId)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error('Löschen fehlgeschlagen');
      alert("Produkt gelöscht!");
      setProducts(prev => prev.filter(p => String(p.id) !== String(productId)));
    } catch (err) {
      console.error(err);
      alert("Fehler beim Löschen des Produkts");
    }
  };

  return (
    <div>
      <h2>Admin Dashboard</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Preis</th>
            <th>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {products.map(p => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>€{p.price}</td>
              <td>
                <button onClick={() => handleDelete(p.id)}>Löschen</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminDashboard;
