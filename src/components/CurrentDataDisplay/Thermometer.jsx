// src/components/CurrentDataDisplay/Thermometer.jsx
import React from 'react';
import styles from './CurrentDataDisplay.module.css';

const Thermometer = ({ temperature, minTemp = 0, maxTemp = 40 }) => {
  const tempPercentage = Math.min(100, Math.max(0, ((temperature - minTemp) / (maxTemp - minTemp)) * 100));

  return (
    <div className={styles.gaugeContainer}>
      <svg viewBox="0 0 40 110" className={styles.gaugeSvgThermometer}>
        {/* Cuerpo del termómetro */}
        <rect x="15" y="5" width="10" height="70" rx="5" ry="5" stroke="#333" strokeWidth="1" fill="#eee" />
        {/* Bulbo */}
        <circle cx="20" cy="90" r="12" fill="#eee" stroke="#333" strokeWidth="1" />
        {/* Mercurio (nivel) */}
        {temperature !== null && (
          <>
            <rect
              x="16"
              y={5 + 70 * (1 - tempPercentage / 100)}
              width="8"
              height={70 * (tempPercentage / 100)}
              rx="4"
              ry="4"
              fill="red"
            />
            <circle cx="20" cy="90" r="10" fill="red" />
          </>
        )}
      </svg>
      <div className={styles.gaugeValue}>{temperature !== null ? temperature.toFixed(1) : 'N/A'} °C</div>
      <div className={styles.gaugeLabel}>Temperatura</div>
    </div>
  );
};

export default React.memo(Thermometer);