// src/components/CurrentDataDisplay/BatteryLevel.jsx
import React from 'react';
import styles from './CurrentDataDisplay.module.css';

const BatteryLevel = ({ battery }) => {
  const batteryPercentage = Math.min(100, Math.max(0, battery));

  return (
    <div className={styles.gaugeContainer}>
      <svg viewBox="0 0 50 100" className={styles.gaugeSvgBattery}>
        {/* Carcasa de la batería */}
        <rect x="5" y="5" width="40" height="90" rx="5" ry="5" stroke="#333" strokeWidth="2" fill="none" />
        <rect x="15" y="1" width="20" height="4" fill="#333" /> {/* Borne */}
        {/* Nivel de la batería */}
        {battery !== null && (
          <rect
            x="7"
            y={7 + (86 * (100 - batteryPercentage) / 100)}
            width="36"
            height={(86 * batteryPercentage) / 100}
            fill={batteryPercentage > 20 ? (batteryPercentage > 50 ? "green" : "orange") : "red"}
          />
        )}
      </svg>
      <div className={styles.gaugeValue}>{battery !== null ? battery.toFixed(0) : 'N/A'} %</div>
      <div className={styles.gaugeLabel}>Batería</div>
    </div>
  );
};

export default React.memo(BatteryLevel);