// src/components/Charts/ChartsContainer.jsx
import React,{ useMemo} from 'react';
import HistoricalChart from './HistoricalChart';
import styles from './Charts.module.css';

const ChartsContainer = ({ feeds }) => {
  if (!feeds || feeds.length === 0) {
    return <div className={styles.chartsContainer}>Cargando gráficos históricos...</div>;
  }

  // Preparamos los datos para los gráficos. ThingSpeak devuelve los campos como strings.
  // const chartData = feeds.map(feed => ({
  //   ...feed,
  //   created_at: feed.created_at, // Recharts puede manejar strings de fecha ISO
  //   field1_val: parseFloat(feed.field1), // Temperatura
  //   field2_val: parseFloat(feed.field2), // Batería
  //   field5_val: parseFloat(feed.field5), // Velocidad
  // })).filter(d => !isNaN(d.field1_val) && !isNaN(d.field2_val) && !isNaN(d.field5_val) ); // Filtrar NaN

  const chartData = useMemo(() => {
    if (!feeds || feeds.length === 0) return [];
    return feeds.map(feed => ({ /* ... tu lógica de mapeo ... */
      ...feed,
    created_at: feed.created_at, // Recharts puede manejar strings de fecha ISO
    field1_val: parseFloat(feed.field1), // Temperatura
    field2_val: parseFloat(feed.field2), // Batería
    field5_val: parseFloat(feed.field5), // Velocidad
    })).filter(d => !isNaN(d.field1_val) && !isNaN(d.field2_val) && !isNaN(d.field5_val) ); // Filtrar NaN

  }, [feeds]);

  return (
    <div className={styles.chartsGrid}>
      <HistoricalChart
        data={chartData}
        dataKey="field1_val"
        strokeColor="#ff7300"
        unit="°C"
        name="Temperatura"
      />
      <HistoricalChart
        data={chartData}
        dataKey="field2_val"
        strokeColor="#387908"
        unit="%"
        name="Batería"
      />
      <HistoricalChart
        data={chartData}
        dataKey="field5_val"
        strokeColor="#8884d8"
        unit="m/s"
        name="Velocidad"
      />
    </div>
  );
};

export default React.memo(ChartsContainer);