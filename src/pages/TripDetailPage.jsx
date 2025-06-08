import React, { useMemo, useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import MapDisplay from '../components/MapDisplay/MapDisplay';
import ChartsContainer from '../components/Charts/ChartsContainer';
import CurrentDataDisplay from '../components/CurrentDataDisplay/CurrentDataDisplay';
import styles from './TripDetailPage.module.css';

const TripDetailPage = () => {
    const { deviceId, tripId } = useParams();
    const { groupedData, isLoading, error } = useData();
    const [visibleTrips, setVisibleTrips] = useState({}); // Inicializamos con todos los viajes visibles

    const handleLegendToggle = (tripIdentifier) => {
        setVisibleTrips(prev => ({
            ...prev,
            [tripIdentifier]: !prev[tripIdentifier]
        }));
    };
    
    
    //   useEffect(() => {
        //       const initialVisibility = tripsInRange.reduce((acc, trip) => {
            //         const tripIdentifier = `${trip.feeds[0]?.field7}-${trip.feeds[0]?.field8}`;
    //         acc[tripIdentifier] = true; // Todos los viajes filtrados son visibles por defecto
    //         return acc;
    //       }, {});
    //       setVisibleTrips(initialVisibility);
    //     }, [tripsInRange]);
    
    const tripData = useMemo(() => {
        if (isLoading || error || !groupedData[deviceId]) return null;
        return groupedData[deviceId]?.trips[tripId];
    }, [groupedData, isLoading, error, deviceId, tripId]);
    
    useEffect(() => {
        // Si tenemos datos del viaje, configuramos su visibilidad inicial a `true`.
        if (tripData && tripData.feeds.length > 0) {
            const tripIdentifier = `${tripData.feeds[0]?.field7}-${tripData.feeds[0]?.field8}`;
            setVisibleTrips({ [tripIdentifier]: true });
        }
    }, [tripData]); // El array de dependencias asegura que esto se ejecute solo cuando tripData se actualice.
    // Determinamos si este es el viaje actual
    const isCurrentTrip = useMemo(() => {
        if (isLoading || !groupedData[deviceId]) return false;
        return tripId === groupedData[deviceId].currentTripId;
    }, [isLoading, groupedData, deviceId, tripId]);

    // Preparamos los datos para el mapa en el formato que MapDisplay espera
    const pathsForMap = useMemo(() => {
        if (!tripData || !tripData.fullTrajectory) return [];

        return [{
            path: tripData.fullTrajectory,
            color: '#e60000', // Un color rojo intenso para la vista de detalle
            legendLabel: `Ruta del Viaje #${tripId}`
        }];
    }, [tripData, tripId]);

    // Obtenemos el último feed para CurrentDataDisplay
    const lastFeedOfTrip = tripData ? tripData.feeds[tripData.feeds.length - 1] : null;

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

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>
                Detalle del Viaje #{tripId}
                <span className={styles.subtitle}> (Dispositivo #{deviceId})</span>
            </h1>

            {isCurrentTrip && lastFeedOfTrip && (
                <section className={styles.section}>
                    <h2>Datos en Tiempo Real</h2>
                    <CurrentDataDisplay currentData={lastFeedOfTrip} />
                </section>
            )}

            <section className={styles.section}>
                <h2>Mapa del Recorrido</h2>
                {/* --- SE PASA EL VIAJE ÚNICO DENTRO DE UN ARRAY A LA PROP 'trips' --- */}
                <MapDisplay trips={[tripData]}
                    visibleTrips={visibleTrips}
                    onLegendToggle={handleLegendToggle} />
            </section>

            <section className={styles.section}>
                <h2>Gráficos Históricos del Viaje</h2>
                {/* Pasamos los datos del viaje envueltos en un array, como espera el componente */}
                <ChartsContainer trips={[tripData]} />
            </section>
        </div>
    );
};

// --- ESTA ES LA LÍNEA CORREGIDA ---
export default TripDetailPage;