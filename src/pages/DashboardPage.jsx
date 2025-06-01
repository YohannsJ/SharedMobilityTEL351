// src/pages/DashboardPage.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react'; // Añadir useMemo y useCallback
import CurrentDataDisplay from '../components/CurrentDataDisplay/CurrentDataDisplay';
import MapDisplay from '../components/MapDisplay/MapDisplay';
import ChartsContainer from '../components/Charts/ChartsContainer';
import { getFeedsLastDay, getLastFeed } from '../services/thingSpeakService';
import styles from './DashboardPage.module.css';

// Breve descripción del proyecto basada en el PDF
const ProjectDescription = () => (
  <div className={styles.projectDescription}>
    <p>
      Este proyecto demuestra una plataforma IoT para el monitoreo inteligente de vehículos de micromovilidad compartida (scooters/bicicletas eléctricas).
      Permite la supervisión en tiempo real de variables clave como batería, ubicación y estado físico, con el objetivo de optimizar la gestión operativa y mejorar la experiencia del usuario. Inspirado en la necesidad de soluciones eficientes de micromovilidad en Chile.
    </p>
  </div>
);

const DashboardPage = () => {
  const [allFeeds, setAllFeeds] = useState([]);
  const [currentFeed, setCurrentFeed] = useState(null);
  const [isLoadingFirstTime, setIsLoadingFirstTime] = useState(true); // Solo para la carga inicial
  const [isRefreshing, setIsRefreshing] = useState(false); // Para actualizaciones en segundo plano
  const [error, setError] = useState(null);

  // Usamos useCallback para que la función no se recree en cada render,
  // a menos que sus dependencias cambien (en este caso, ninguna).
  const fetchData = useCallback(async (isInitialLoad = false) => {
    if (isInitialLoad) {
      setIsLoadingFirstTime(true);
    } else {
      setIsRefreshing(true); // Indica refresco en segundo plano
    }
    setError(null);

    try {
      // Hacemos ambas peticiones en paralelo para más eficiencia
      const [feedsData, lastDataPoint] = await Promise.all([
        getFeedsLastDay(),
        getLastFeed()
      ]);

      setAllFeeds(feedsData.feeds || []);
      setCurrentFeed(lastDataPoint || (feedsData.feeds && feedsData.feeds.length > 0 ? feedsData.feeds[feedsData.feeds.length - 1] : null));
    } catch (err) {
      setError("Error al cargar datos de ThingSpeak. Verifica la consola y la configuración del servicio.");
      console.error(err);
    } finally {
      if (isInitialLoad) {
        setIsLoadingFirstTime(false);
      }
      setIsRefreshing(false);
    }
  }, []); // Array de dependencias vacío

  useEffect(() => {
    fetchData(true); // Carga inicial

    const intervalId = setInterval(() => fetchData(false), 60000); // Refresco cada 60 segundos
    return () => clearInterval(intervalId);
  }, [fetchData]); // fetchData está ahora en las dependencias de useEffect

  // Memoizamos los datos que se pasan a los componentes hijos
  // para evitar re-renders si los datos subyacentes no han cambiado de forma relevante.
  const memoizedCurrentFeed = useMemo(() => currentFeed, [currentFeed]);
  const memoizedAllFeeds = useMemo(() => allFeeds, [allFeeds]);

  if (isLoadingFirstTime) {
    return <div className={styles.message}>Cargando dashboard por primera vez...</div>;
  }

  if (error && allFeeds.length === 0) { // Mostrar error solo si no hay datos para mostrar
    return <div className={styles.errorMessage}>{error}</div>;
  }

  return (
    <div className={styles.dashboardLayout}>
      <header className={styles.header}>
        <h1>Gestión Eficiente de Micromovilidad Compartida</h1>
        {isRefreshing && <div className={styles.refreshIndicator}>Actualizando datos...</div>}
        {error && <div className={styles.inlineError}>Error al actualizar: {error.substring(0,50)}...</div>}
      </header>
      
      <ProjectDescription />

      <section className={styles.currentDataSection}>
        <h2>Datos Actuales</h2>
        <CurrentDataDisplay currentData={memoizedCurrentFeed} />
      </section>

      <section className={styles.mapSection}>
        <h2>Mapa de Recorrido</h2>
        <MapDisplay feeds={memoizedAllFeeds} />
      </section>

      <section className={styles.chartsSection}>
        <h2>Historial (Últimas 24 horas aprox.)</h2>
        <ChartsContainer feeds={memoizedAllFeeds} />
      </section>
    </div>
  );
};

export default DashboardPage;