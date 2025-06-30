import React, { useMemo, useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { useData } from '../context/DataContext';
import MapDisplay from '../components/MapDisplay/MapDisplay';
import ChartsContainer from '../components/Charts/ChartsContainer';
import CustomDateTimePicker from '../components/TimePickerUI';
import styles from './DailySummaryPage.module.css';

// Función para generar colores distintos para los viajes
const tripColors = ['#FF5733', '#33FF57', '#3357FF', '#FF33A1', '#A133FF', '#33FFA1', '#FFC300', '#C70039', '#FF8C00', '#00CED1'];
const getColorForTrip = (index) => tripColors[index % tripColors.length];

const DailySummaryPage = () => {
  const { groupedData, isLoading, error } = useData();

  // Estados de fecha unificados con dayjs
  const [startDateTime, setStartDateTime] = useState(dayjs().startOf('day'));
  const [endDateTime, setEndDateTime] = useState(dayjs().endOf('day'));

  const [selectedDeviceId, setSelectedDeviceId] = useState('all');
  const [visibleTrips, setVisibleTrips] = useState({});

  // Filtrado de viajes según fechas y dispositivo
  const { tripsInRange, deviceIds } = useMemo(() => {
    if (isLoading || error || !groupedData) return { tripsInRange: [], deviceIds: [] };

    let allTrips = [];
    const availableDeviceIds = Object.keys(groupedData);
  console.log("Grouped Data:", groupedData);
    Object.entries(groupedData).forEach(([deviceId, device]) => {
      if (selectedDeviceId !== 'all' && selectedDeviceId !== deviceId) return;

      Object.values(device.trips).forEach(trip => {
        if (trip.feeds.length > 0) {
          const tripStartDate = dayjs(trip.feeds[0].created_at);
          if (tripStartDate.isAfter(startDateTime) && tripStartDate.isBefore(endDateTime)) {
            allTrips.push(trip);
          }
        }
      });
    });

    return { tripsInRange: allTrips, deviceIds: availableDeviceIds };
  }, [groupedData, isLoading, error, startDateTime, endDateTime, selectedDeviceId]);

  // Inicializa visibilidad de los viajes
  useEffect(() => {
    const initialVisibility = tripsInRange.reduce((acc, trip) => {
      const tripIdentifier = `${trip.feeds[0]?.field2}-${trip.feeds[0]?.field1}`;
      acc[tripIdentifier] = true;
      return acc;
    }, {});
    setVisibleTrips(initialVisibility);
  }, [tripsInRange]);

  // Alternar visibilidad desde leyenda
  const handleLegendToggle = (tripIdentifier) => {
    setVisibleTrips(prev => ({
      ...prev,
      [tripIdentifier]: !prev[tripIdentifier]
    }));
  };

  // Estados especiales
  if (isLoading) return <div className={styles.message}>Cargando resumen...</div>;
  if (error) return <div className={styles.errorMessage}>Error al cargar datos: {error}</div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Resumen de Viajes por Fecha y Hora</h1>

      <div className={styles.filtersContainer}>
        <div className={styles.filterGroup}>
          <label>Desde:</label>
          <CustomDateTimePicker
            // label="Desde"
            value={startDateTime}
            onChange={setStartDateTime}
          />
        </div>

        <div className={styles.filterGroup}>
          <label>Hasta:</label>
          <CustomDateTimePicker
            // label="Hasta"
            value={endDateTime}
            onChange={setEndDateTime}
          />
          {startDateTime.isAfter(endDateTime) && (
            <div className={styles.errorMessage}>
              La fecha de inicio no puede ser posterior a la fecha de fin.
            </div>
          )}
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="device-select">Dispositivo:</label>
          <select
            id="device-select"
            value={selectedDeviceId}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
          >
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
        <ChartsContainer
          trips={tripsInRange.filter(trip => {
            const tripIdentifier = `${trip.feeds[0]?.field2}-${trip.feeds[0]?.field1}`;
            return visibleTrips[tripIdentifier];
          })}
        />
      </section>
    </div>
  );
};

export default DailySummaryPage;
