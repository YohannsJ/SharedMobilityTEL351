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

const DeviceRow = ({ deviceId, deviceData }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // La lógica para `isActive` se simplifica porque ahora la calculamos en el procesador,
  // pero la mantenemos para el estado general del dispositivo.
  const isActive = !!deviceData.currentTripId;

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
            {Object.keys(deviceData.trips).reverse().map(tripId => {
              // --- NUEVA LÓGICA ---
              const isCurrent = tripId === deviceData.currentTripId;
              return (
                <li key={tripId}>
                  <Link to={`/devices/${deviceId}/trips/${tripId}`}>
                    Ver Viaje #{tripId}
                    {isCurrent && <span className={styles.currentTripIndicator}> (Viaje Actual)</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};


export default DevicesListPage;