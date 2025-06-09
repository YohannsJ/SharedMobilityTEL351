import { Outlet, Link } from 'react-router-dom';
import React from 'react';
const NotFoundPage = () => (
  <div style={{ textAlign: 'center', marginTop: '4rem' }}>
    <h1>Error 404</h1>
    <p>Página no encontrada.</p>
    <Link to="/">Volver al inicio</Link>
  </div>
);

export default NotFoundPage;