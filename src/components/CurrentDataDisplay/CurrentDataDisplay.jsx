// src/components/CurrentDataDisplay/CurrentDataDisplay.jsx
import React from 'react';
import Speedometer from './Speedometer';
import Thermometer from './Thermometer';
import BatteryLevel from './BatteryLevel';
import styles from './CurrentDataDisplay.module.css';

const CurrentDataDisplay = ({ currentData }) => {
  if (!currentData) {
    return <div className={styles.currentDataContainer}>Cargando datos actuales...</div>;
  }

  // Asumiendo que los datos de ThingSpeak vienen en field1, field2, etc.
  // y que tu script de Python los mapea correctamente.
  const speed = currentData.field5 ? parseFloat(currentData.field5) : null; // Velocidad (m/s)
  const temperature = currentData.field1 ? parseFloat(currentData.field1) : null; // Temperatura
  const battery = currentData.field2 ? parseFloat(currentData.field2) : null; // Batería

  return (
    <div className={styles.currentDataContainer}>
      <Speedometer speed={speed} />
      <Thermometer temperature={temperature} />
      <BatteryLevel battery={battery} />
    </div>
  );
};

export default React.memo(CurrentDataDisplay);