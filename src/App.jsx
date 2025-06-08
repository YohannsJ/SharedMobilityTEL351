// src/App.jsx
import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import styles from './App.module.css';
import { DataProvider } from './context/DataContext'; // 1. Importar el proveedor

const App = () => {
  return (
    // 2. Envolver toda la aplicación con DataProvider
    <DataProvider> 
      <div className={styles.appContainer}>
        <nav className={styles.navbar}>
          <Link to="/" className={styles.navBrand}>Micromovilidad IoT</Link>
          <div className={styles.navLinks}>
            <Link to="/" className={styles.navLink}>Inicio</Link>
            <Link to="/devices" className={styles.navLink}>Dispositivos</Link>
          </div>
        </nav>
        <main className={styles.content}>
          <Outlet /> {/* Las páginas se renderizarán aquí y tendrán acceso al contexto */}
        </main>
      </div>
    </DataProvider>
  );
};

export default App;