import React, { useMemo, useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import MapDisplay from '../components/MapDisplay/MapDisplay';
import ChartsContainer from '../components/Charts/ChartsContainer';
import styles from './DailySummaryPage.module.css';

// Función para generar colores distintos para los viajes
const tripColors = ['#FF5733', '#33FF57', '#3357FF', '#FF33A1', '#A133FF', '#33FFA1', '#FFC300', '#C70039', '#FF8C00', '#00CED1'];
const getColorForTrip = (index) => tripColors[index % tripColors.length];

const DailySummaryPage = () => {
  const { groupedData, isLoading, error } = useData();

  // Estados para todos los filtros
  const todayStr = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [startTime, setStartTime] = useState('00:00');
  const [endTime, setEndTime] = useState('23:59');
  const [selectedDeviceId, setSelectedDeviceId] = useState('all');
  const [visibleTrips, setVisibleTrips] = useState({});

  // Hook para filtrar los datos según todos los criterios seleccionados
  const { tripsInRange, deviceIds } = useMemo(() => {
    if (isLoading || error || !groupedData) return { tripsInRange: [], deviceIds: [] };

    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${endDate}T${endTime}`);
    
    let allTrips = [];
    const availableDeviceIds = Object.keys(groupedData);

    Object.entries(groupedData).forEach(([deviceId, device]) => {
      if (selectedDeviceId !== 'all' && selectedDeviceId !== deviceId) return;
      
      Object.values(device.trips).forEach(trip => {
        if (trip.feeds.length > 0) {
          const tripStartDate = new Date(trip.feeds[0].created_at);
          if (tripStartDate >= startDateTime && tripStartDate <= endDateTime) {
            allTrips.push(trip);
          }
        }
      });
    });
    
    return { tripsInRange: allTrips, deviceIds: availableDeviceIds };
  }, [groupedData, isLoading, error, startDate, endDate, startTime, endTime, selectedDeviceId]);

  // Efecto para (re)inicializar la visibilidad de los viajes cuando el filtro cambia
  useEffect(() => {
    const initialVisibility = tripsInRange.reduce((acc, trip) => {
      const tripIdentifier = `${trip.feeds[0]?.field7}-${trip.feeds[0]?.field8}`;
      acc[tripIdentifier] = true; // Todos los viajes filtrados son visibles por defecto
      return acc;
    }, {});
    setVisibleTrips(initialVisibility);
  }, [tripsInRange]);

  // Función para manejar el clic en la leyenda del mapa
  const handleLegendToggle = (tripIdentifier) => {
    setVisibleTrips(prev => ({
      ...prev,
      [tripIdentifier]: !prev[tripIdentifier]
    }));
  };

  // Manejo de estados de carga y error
  if (isLoading) return <div className={styles.message}>Cargando resumen...</div>;
  if (error) return <div className={styles.errorMessage}>Error al cargar datos: {error}</div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Resumen de Viajes por Fecha y Hora</h1>
      
      <div className={styles.filtersContainer}>
        {/* Filtro de Fecha Desde */}
        <div className={styles.filterGroup}>
          <label htmlFor="start-date">Desde:</label>
          <input type="date" id="start-date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          <input type="time" id="start-time" value={startTime} onChange={e => setStartTime(e.target.value)} />
        </div>

        {/* Filtro de Fecha Hasta */}
        <div className={styles.filterGroup}>
          <label htmlFor="end-date">Hasta:</label>
          <input type="date" id="end-date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          <input type="time" id="end-time" value={endTime} onChange={e => setEndTime(e.target.value)} />
        </div>

        {/* Filtro de Dispositivo */}
        <div className={styles.filterGroup}>
            <label htmlFor="device-select">Dispositivo:</label>
            <select id="device-select" value={selectedDeviceId} onChange={e => setSelectedDeviceId(e.target.value)}>
                <option value="all">Todos los Dispositivos</option>
                {deviceIds.map(id => (
                    <option key={id} value={id}>Dispositivo #{id}</option>
                ))}
            </select>
        </div>
      </div>

      <section className={styles.section}>
        <h2>Mapa de Actividad ({tripsInRange.length} viajes)</h2>
        <MapDisplay 
          trips={tripsInRange} 
          visibleTrips={visibleTrips} 
          onLegendToggle={handleLegendToggle} 
        />
      </section>

      <section className={styles.section}>
        <h2>Gráficos Comparativos</h2>
        <ChartsContainer trips={tripsInRange.filter(trip => {
            const tripIdentifier = `${trip.feeds[0]?.field7}-${trip.feeds[0]?.field8}`;
            return visibleTrips[tripIdentifier];
        })} />
      </section>
    </div>
  );
};

export default DailySummaryPage;