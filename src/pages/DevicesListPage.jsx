// src/pages/DevicesListPage.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext'; // 1. Importar nuestro hook personalizado
import styles from './DevicesListPage.module.css';

const DevicesListPage = () => {
  // 2. Consumir los datos desde el contexto
  const { groupedData, isLoading, error } = useData();

  if (isLoading) return <div>Cargando historial de todos los dispositivos...</div>;
  if (error) return <div className={styles.errorMessage}>Error al cargar datos: {error}</div>;

  return (
    <div className={styles.container}>
      <h1>Listado de Dispositivos</h1>
      {Object.keys(groupedData).length > 0 ? (
        Object.entries(groupedData).map(([deviceId, deviceData]) => (
          <DeviceRow key={deviceId} deviceId={deviceId} deviceData={deviceData} />
        ))
      ) : (
        <p>No se encontraron dispositivos con viajes registrados.</p>
      )}
    </div>
  );
};

// El componente DeviceRow no necesita cambios
const DeviceRow = ({ deviceId, deviceData }) => {
    // ... (código sin cambios)
    const [isExpanded, setIsExpanded] = useState(false);
  
    const lastTripId = Object.keys(deviceData.trips).pop();
    const lastFeed = deviceData.trips[lastTripId]?.feeds.slice(-1)[0];
    const lastSeen = new Date(lastFeed.created_at);
    const isActive = (new Date() - lastSeen) < 5 * 60 * 1000;

    return (
        <div className={styles.deviceCard}>
          <div className={styles.deviceHeader} onClick={() => setIsExpanded(!isExpanded)}>
            <span>Dispositivo ID: <strong>{deviceId}</strong></span>
            <span>Estado: <strong className={isActive ? styles.active : styles.inactive}>{isActive ? 'Activo' : 'Inactivo'}</strong></span>
            <span>{isExpanded ? '▼ Ocultar viajes' : '► Mostrar viajes'}</span>
          </div>
          {isExpanded && (
            <div className={styles.tripList}>
              <h4>Viajes Realizados ({Object.keys(deviceData.trips).length})</h4>
              <ul>
                {Object.keys(deviceData.trips).reverse().map(tripId => (
                  <li key={tripId}>
                    <Link to={`/devices/${deviceId}/trips/${tripId}`}>
                      Ver Viaje #{tripId}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
};


export default DevicesListPage;