// src/pages/TripDetailPage.jsx
import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import MapDisplay from '../components/MapDisplay/MapDisplay';
import ChartsContainer from '../components/Charts/ChartsContainer';
import styles from './TripDetailPage.module.css'; // Crea este archivo CSS

const TripDetailPage = () => {
    const { deviceId, tripId } = useParams();
    const { groupedData, isLoading, error } = useData();

    // Usamos useMemo para encontrar los datos del viaje específico.
    // Esto evita recalcular en cada render a menos que los datos cambien.
    const tripData = useMemo(() => {
        if (isLoading || error) return null;
        return groupedData[deviceId]?.trips[tripId];
    }, [groupedData, isLoading, error, deviceId, tripId]);

    if (isLoading) {
        return <div className={styles.message}>Cargando datos del viaje...</div>;
    }

    if (error) {
        return <div className={styles.errorMessage}>Error: {error}</div>;
    }

    if (!tripData) {
        return (
            <div className={styles.message}>
                <p>Viaje no encontrado.</p>
                <Link to="/devices">Volver a la lista de dispositivos</Link>
            </div>
        );
    }

    // Ahora que tenemos tripData, podemos pasar los props a los componentes hijos.
    const tripFeeds = tripData.feeds;
    const fullTrajectory = tripData.fullTrajectory;

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>
                Detalle del Viaje #{tripId}
                <span className={styles.subtitle}> (Dispositivo #{deviceId})</span>
            </h1>
            
            <section className={styles.section}>
                <h2>Mapa del Recorrido</h2>
                <MapDisplay feeds={tripFeeds} historicalPath={fullTrajectory} />
            </section>

            <section className={styles.section}>
                <h2>Gráficos Históricos del Viaje</h2>
                <ChartsContainer feeds={tripFeeds} />
            </section>
        </div>
    );
};

export default TripDetailPage;