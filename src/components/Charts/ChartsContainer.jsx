import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import styles from './Charts.module.css';

const tripColors = ['#FF5733', '#33FF57', '#3357FF', '#FF33A1', '#A133FF', '#33FFA1', '#FFC300', '#C70039', '#FF8C00', '#00CED1'];
const getColorForTrip = (index) => tripColors[index % tripColors.length];

const ChartsContainer = ({ trips = [] }) => {
  const unifiedChartData = useMemo(() => {
    if (!trips || trips.length === 0) return [];
    
    const allFeeds = trips.flatMap(trip => 
      trip.feeds.map(feed => ({
        time: new Date(feed.created_at).getTime(),
        tripId: `viaje_${trip.feeds[0].field1}`, //
        battery: parseFloat(feed.field5),
        speed: parseFloat(feed.field4),
        // tripId: `viaje_${trip.feeds[0].field8}`, //
        // battery: parseFloat(feed.field2),
        // speed: parseFloat(feed.field5),
      }))
    );
    
    const dataByTime = allFeeds.reduce((acc, feed) => {
      if (!feed.time || isNaN(feed.time)) return acc;
      if (!acc[feed.time]) {
        acc[feed.time] = { time: feed.time };
      }
      acc[feed.time][feed.tripId + '_battery'] = feed.battery;
      acc[feed.time][feed.tripId + '_speed'] = feed.speed;
      return acc;
    }, {});
    
    return Object.values(dataByTime).sort((a, b) => a.time - b.time);
  }, [trips]);

  if (!trips || trips.length === 0) {
    return <p>No hay viajes seleccionados para mostrar en los gráficos.</p>;
  }

  return (
    <div className={styles.chartsGrid}>
      <div className={styles.chartWrapper}>
        <h3 className={styles.chartTitle}>Batería del Viaje</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={unifiedChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" tickFormatter={(time) => new Date(time).toLocaleTimeString()} type="number" domain={['dataMin', 'dataMax']} />
            <YAxis domain={[0, 100]} unit="%" />
            <Tooltip labelFormatter={(label) => new Date(label).toLocaleString()} formatter={(value) => [`${value.toFixed(1)}%`, 'Batería']} />
            <Legend />
            {trips.map((trip, index) => (
              <Line 
                key={`bat_${trip.feeds[0].field8}`}
                type="monotone" 
                dataKey={`viaje_${trip.feeds[0].field1}_battery`}
                name={`Bat. Viaje #${trip.feeds[0].field1}`} 
                stroke={getColorForTrip(index)} 
                dot={false}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className={styles.chartWrapper}>
        <h3 className={styles.chartTitle}>Aceleración del Viaje</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={unifiedChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" tickFormatter={(time) => new Date(time).toLocaleTimeString()} type="number" domain={['dataMin', 'dataMax']} />
            <YAxis unit=" Km/h" />
            <Tooltip labelFormatter={(label) => new Date(label).toLocaleString()} formatter={(value) => [`${value.toFixed(1)} m/s^2`, 'Aceleración']} />
            <Legend />
            {trips.map((trip, index) => (
              <Line 
                key={`spd_${trip.feeds[0].field4}`}
                type="monotone" 
                dataKey={`viaje_${trip.feeds[0].field1}_speed`}
                name={`Vel. Viaje #${trip.feeds[0].field1}`} 
                stroke={getColorForTrip(index)} 
                dot={false}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default React.memo(ChartsContainer);