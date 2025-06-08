// src/pages/TripDetailPage.jsx
import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import MapDisplay from '../components/MapDisplay/MapDisplay';
import ChartsContainer from '../components/Charts/ChartsContainer';
import CurrentDataDisplay from '../components/CurrentDataDisplay/CurrentDataDisplay'; // 1. Importar el componente
import styles from './TripDetailPage.module.css';

const TripDetailPage = () => {
    const { deviceId, tripId } = useParams();
    const { groupedData, isLoading, error } = useData();

    const tripData = useMemo(() => {
        if (isLoading || error) return null;
        return groupedData[deviceId]?.trips[tripId];
    }, [groupedData, isLoading, error, deviceId, tripId]);

    // --- NUEVA LÓGICA ---
    const isCurrentTrip = useMemo(() => {
        if (isLoading || !groupedData[deviceId]) return false;
        return tripId === groupedData[deviceId].currentTripId;
    }, [isLoading, groupedData, deviceId, tripId]);

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

    const tripFeeds = tripData.feeds;
    const fullTrajectory = tripData.fullTrajectory;
    // Obtenemos el último feed para pasarlo a CurrentDataDisplay
    const lastFeedOfTrip = tripFeeds.length > 0 ? tripFeeds[tripFeeds.length - 1] : null;

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>
                Detalle del Viaje #{tripId}
                <span className={styles.subtitle}> (Dispositivo #{deviceId})</span>
            </h1>

            {/* 2. RENDERIZADO CONDICIONAL DEL BLOQUE DE DATOS ACTUALES */}
            {isCurrentTrip && (
                <section className={styles.section}>
                    <h2>Datos en Tiempo Real</h2>
                    <CurrentDataDisplay currentData={lastFeedOfTrip} />
                </section>
            )}
            
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