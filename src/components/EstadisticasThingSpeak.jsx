// Ejemplo básico en un componente de React
import React, { useEffect, useState } from 'react';

function EstadisticasThingSpeak() {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const channelID = "2977416"; // Reemplaza con tu Channel ID
  const readApiKey = "UPSDTPGNKDD0EQYH"; // Reemplaza con tu Read API Key
  const resultsCount = 20; // Cuántos resultados quieres traer

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`https://api.thingspeak.com/channels/${channelID}/feeds.json?api_key=${readApiKey}&results=${resultsCount}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setDatos(data);
        setError(null);
      } catch (e) {
        console.error("Error al obtener datos de ThingSpeak:", e);
        setError(e.message);
        setDatos(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Opcional: refrescar datos cada cierto tiempo
    // const intervalId = setInterval(fetchData, 60000); // cada 60 segundos
    // return () => clearInterval(intervalId); // Limpiar intervalo al desmontar
  }, [channelID, readApiKey, resultsCount]); // Dependencias del useEffect

  if (loading) return <p>Cargando datos desde ThingSpeak...</p>;
  if (error) return <p>Error al cargar datos: {error}</p>;
  if (!datos || !datos.feeds || datos.feeds.length === 0) return <p>No hay datos disponibles.</p>;

  // Aquí puedes procesar `datos.feeds` para calcular estadísticas
  // Por ejemplo, calcular la temperatura promedio:
  const temperaturas = datos.feeds.map(feed => parseFloat(feed.field1)).filter(t => !isNaN(t));
  const tempPromedio = temperaturas.length > 0 ? (temperaturas.reduce((a, b) => a + b, 0) / temperaturas.length).toFixed(2) : "N/A";

  const ultimaLectura = datos.feeds[datos.feeds.length - 1];

  return (
    <div>
      <h2>Estadísticas de ThingSpeak</h2>
      <p>Canal: {datos.channel?.name} ({datos.channel?.id})</p>
      <hr />
      <h3>Última Lectura:</h3>
      {ultimaLectura && (
        <ul>
          <li>Fecha: {new Date(ultimaLectura.created_at).toLocaleString()}</li>
          {ultimaLectura.field1 && <li>🌡️ Temperatura: {ultimaLectura.field1}°C</li>}
          {ultimaLectura.field2 && <li>🔋 Batería: {ultimaLectura.field2}%</li>}
          {ultimaLectura.field3 && ultimaLectura.field4 && <li>🌍 Ubicación: Lat {ultimaLectura.field3}, Lon {ultimaLectura.field4}</li>}
        </ul>
      )}
      <hr />
      <h3>Estadísticas (últimos {resultsCount} resultados):</h3>
      <p>🌡️ Temperatura Promedio: {tempPromedio}°C</p>
      {/* Aquí puedes añadir más estadísticas que calcules */}
    </div>
  );
}

export default EstadisticasThingSpeak;