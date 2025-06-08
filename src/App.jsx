// src/App.jsx
import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import styles from './App.module.css';
import { DataProvider, useData } from './context/DataContext'; // <-- Importar useData
import { ThemeProvider } from './context/ThemeContext'; // <-- Importar ThemeProvider
import ThemeToggleButton from './components/ThemeToggleButton'; // <-- Importar el botón

// Creamos un componente interno para que pueda acceder a los contextos
const AppLayout = () => {
  const { isRefreshing } = useData(); // Obtenemos el estado de refresco

  return (
    <div className={styles.appContainer}>
      <nav className={styles.navbar}>
        <Link to="/" className={styles.navBrand}>Micromovilidad IoT</Link>
        <div className={styles.navLinks}>
          <Link to="/" className={styles.navLink}>Inicio</Link>
          <Link to="/devices" className={styles.navLink}>Dispositivos</Link>
          <Link to="/summary" className={styles.navLink}>Resumen Diario</Link>
          {isRefreshing && <div className={styles.refreshIndicator}>🔄️</div>}
        </div>
        <ThemeToggleButton />
      </nav>
      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  );
};

const App = () => {
  return (
    // Envolvemos todo con ambos proveedores
    <ThemeProvider>
      <DataProvider>
        <AppLayout />
      </DataProvider>
    </ThemeProvider>
  );
};

export default App;