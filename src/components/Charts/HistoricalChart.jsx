// src/components/Charts/HistoricalChart.jsx
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import styles from './Charts.module.css';

const HistoricalChart = ({ data, dataKey, strokeColor, unit, name, timeKey = "created_at" }) => {
  // Formatear el timestamp para el eje X
  const formatXAxis = (tickItem) => {
    // tickItem es la fecha en string (ISO 8601 UTC de ThingSpeak)
    const date = new Date(tickItem);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); // Hora local del navegador
  };

  const formatTooltipLabel = (label) => {
    const date = new Date(label);
    return date.toLocaleString([], {dateStyle: 'short', timeStyle: 'medium'});
  }


  return (
    <div className={styles.chartWrapper}>
      <h3 className={styles.chartTitle}>{name}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 0, // Ajusta si los números del YAxis son muy anchos
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={timeKey} tickFormatter={formatXAxis} />
          <YAxis label={{ value: unit, angle: -90, position: 'insideLeft', offset: 10, style: {textAnchor: 'middle'} }} />
          <Tooltip labelFormatter={formatTooltipLabel} formatter={(value) => [`${parseFloat(value).toFixed(1)} ${unit}`, name]}/>
          <Legend />
          <Line type="monotone" dataKey={dataKey} stroke={strokeColor} activeDot={{ r: 8 }} name={name} unit={unit} dot={false}/>
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default React.memo(HistoricalChart);