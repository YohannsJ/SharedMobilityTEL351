// src/services/thingSpeakService.js
import axios from 'axios';

const CHANNEL_ID = import.meta.env.VITE_THINGSPEAK_CHANNEL_ID;
const READ_API_KEY = import.meta.env.VITE_THINGSPEAK_READ_API_KEY;

const BASE_URL = `https://api.thingspeak.com/channels/${CHANNEL_ID}`;


// Verificar que las variables se cargaron (opcional, para depuración)
if (!CHANNEL_ID || !READ_API_KEY) {
  console.error("Error: Las variables de entorno de ThingSpeak no están definidas. Asegúrate de tener un archivo .env con VITE_THINGSPEAK_CHANNEL_ID y VITE_THINGSPEAK_READ_API_KEY.");
}


// Nueva función para obtener todo el historial (hasta 8000 puntos)
export const getAllFeeds = async () => {
  try {
    const response = await fetch(`${BASE_URL}/feeds.json?api_key=${READ_API_KEY}&results=8000`);
    if (!response.ok) throw new Error('Error en la respuesta de la red');
    return await response.json();
  } catch (error) {
    console.error("Error al obtener todos los feeds:", error);
    return { feeds: [] }; // Devuelve un objeto vacío en caso de error
  }
};

// ... las funciones antiguas (getLastFeed, getFeedsLastDay) aún pueden ser útiles.


/**
 * Obtiene los datos de las últimas 24 horas.
 * ThingSpeak devuelve datos en UTC.
 */
export const getFeedsLastDay = async () => {
  try {
    // Calcular las fechas para las últimas 24 horas en formato UTC
    // ThingSpeak espera formato YYYY-MM-DD%20HH:NN:SS
    const now = new Date();
    const end = new Date(now);
    const start = new Date(now);
    start.setHours(start.getHours() - 24);

    // Formatear para la URL de ThingSpeak (UTC)
    const formatDateForThingSpeak = (date) => {
      return date.toISOString().replace('T', ' ').substring(0, 19);
    };

    const startDateStr = formatDateForThingSpeak(start);
    const endDateStr = formatDateForThingSpeak(end);
    
    // Nota: ThingSpeak gratuito puede tener limitaciones en el número de puntos devueltos por rango de fecha.
    // Si es muy grande, considera pedir menos 'results' o ajustar el intervalo.
    // Por ahora, probaremos con rango de fechas. Si no funciona bien, podemos usar 'days=1' o 'results=X'
    // const response = await axios.get(`${BASE_URL}/feeds.json?api_key=${THINGSPEAK_READ_API_KEY}&start=${startDateStr}&end=${endDateStr}`);

    // Alternativa más simple: pedir los últimos N resultados (2880 por día si es cada 30s)
    // El máximo por request suele ser 8000.
    const resultsCount = 2880; // Aproximadamente un día de datos con updates cada 30s
    const response = await axios.get(`${BASE_URL}/feeds.json?api_key=${READ_API_KEY}&results=${resultsCount}`);


    if (response.data && response.data.feeds) {
      return response.data; // Devuelve { channel: {...}, feeds: [...] }
    }
    return { channel: {}, feeds: [] }; // En caso de respuesta inesperada
  } catch (error) {
    console.error("Error fetching data from ThingSpeak:", error);
    throw error; // Propaga el error para que el componente lo maneje
  }
};

// Podrías añadir una función para obtener solo el último feed si es necesario para "datos actuales"
// de forma más eficiente, aunque también se puede sacar del array de `getFeedsLastDay`.
export const getLastFeed = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/feeds.json?api_key=${READ_API_KEY}&results=1`);
    if (response.data && response.data.feeds && response.data.feeds.length > 0) {
      return response.data.feeds[0];
    }
    return null;
  } catch (error) {
    console.error("Error fetching last feed from ThingSpeak:", error);
    throw error;
  }
}