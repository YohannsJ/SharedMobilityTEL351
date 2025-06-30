// src/components/CurrentDataDisplay/Speedometer.jsx
import React from 'react';
import styles from './CurrentDataDisplay.module.css'; // Crearemos este archivo CSS

const Speedometer = ({ speed, maxSpeed = 60 / 3.6 }) => { // maxSpeed en m/s (ej. 60km/h)
  const speedPercentage = Math.min(100, Math.max(0, (speed / maxSpeed) * 100));
  // Ángulo para la aguja: -90 grados es 0, 90 grados es máximo. Rango de 180 grados.
  const angle = -90 + (speedPercentage / 100) * 180;
 // Speed en kilometros por hora (km/h) para el display
  const speedKmH = speed * 3.6; // Convertir m/s a km/h
  return (
    <div className={styles.gaugeContainer}>
      <svg viewBox="0 0 100 60" className={styles.gaugeSvg}>
        {/* Arco del velocímetro */}
        <path d="M 10 50 A 40 40 0 0 1 90 50" stroke="#ccc" strokeWidth="8" fill="none" />
        {/* Aguja */}
        <line
          x1="50"
          y1="50"
          x2="50"
          y2="15"
          stroke="red"
          strokeWidth="2"
          transform={`rotate(${angle} 50 50)`}
        />
        <circle cx="50" cy="50" r="3" fill="black" />
      </svg>
      <div className={styles.gaugeValue}>{speed !== null ? speed.toFixed(1) : 'N/A'} v/s^2</div>
      <div className={styles.gaugeLabel}>Velocidad</div>
    </div>
  );
};

export default React.memo(Speedometer);