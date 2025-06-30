// src/utils/dataProcessor.js
import polyline from '@mapbox/polyline';

// Mi Formato de ThingSpeak:
  // "channel": {
  //   "id": 2977416,
  //   "name": "Prueba SharedMovility",
  //   "description": "Un test del proyecto de movilidad compartida",
  //   "latitude": "0.0",
  //   "longitude": "0.0",
  //   "field1": "Temperatura (°C)",
  //   "field2": "Bateria (%)",
  //   "field3": "Latitud (°)",
  //   "field4": "Longitud (°)",
  //   "field5": "Velocidad (m/s)",
  //   "field6": "Trajectory",
  //   "field7": "Device ID",
  //   "field8": "Viaje ID",
  //   "created_at": "2025-06-01T15:45:33Z",
  //   "updated_at": "2025-06-08T18:20:30Z",
  //   "last_entry_id": 3081

// Formato Rodrigo:
  // "channel": {
  //   "id": 2999987,
  //   "name": "IoT_WiFi_Scooters",
  //   "description": "Plataforma IoT para el  monitoreo de micromovilidad compartida, con conectividad WiFi.",
  //   "latitude": "0.0",
  //   "longitude": "0.0",
  //   "field1": "Viaje ID",
  //   "field2": "Scooter ID",
  //   "field3": "GPS",   // Codificdo en Polyline (antes field6)
  //   "field4": "Aceleración", // Se puede usar como el de velocidad (antes field5)
//     "field5": "Nivel de batería",
export const groupFeedsByDeviceAndTrip = (feeds) => {
  if (!feeds) return {};

  const fiveMinutesInMs = 5 * 60 * 1000;

  // Paso 1: Agrupar todos los feeds por deviceId y tripId (como antes)
  // const grouped = feeds.reduce((acc, feed) => {
  //   const deviceId = feed.field7;
  //   const tripId = feed.field8;
  const grouped = feeds.reduce((acc, feed) => {
    const deviceId = feed.field2;
    const tripId = feed.field1;

    if (!deviceId || !tripId) return acc;

    if (!acc[deviceId]) {
      acc[deviceId] = { trips: {} };
    }
    if (!acc[deviceId].trips[tripId]) {
      acc[deviceId].trips[tripId] = { feeds: [], trajectories: [] };
    }

    acc[deviceId].trips[tripId].feeds.push(feed);
    // if (feed.field6) {
    if (feed.field3) {
    // acc[deviceId].trips[tripId].trajectories.push(feed.field6);
    acc[deviceId].trips[tripId].trajectories.push(feed.field3);
    }

    return acc;
  }, {});

  // Paso 2: Iterar sobre los datos agrupados para añadir la lógica del "viaje actual"
  for (const deviceId in grouped) {
    const deviceData = grouped[deviceId];
    
    // Decodificar trayectorias (como antes)
    for (const tripId in deviceData.trips) {
      const trip = deviceData.trips[tripId];
      const decodedPath = trip.trajectories.flatMap(encoded => polyline.decode(encoded));
      trip.fullTrajectory = decodedPath;
    }

    // --- NUEVA LÓGICA ---
    // Encontrar el ID del último viaje del dispositivo
    const tripIds = Object.keys(deviceData.trips).map(Number);
    if (tripIds.length === 0) {
      deviceData.currentTripId = null;
      continue; // No hay viajes para este dispositivo
    }
    const latestTripId = Math.max(...tripIds).toString();
    const latestTrip = deviceData.trips[latestTripId];
    
    // Comprobar si la última actualización de ese viaje fue reciente
    if (latestTrip.feeds.length > 0) {
      const lastFeed = latestTrip.feeds[latestTrip.feeds.length - 1];
      const lastSeen = new Date(lastFeed.created_at);
      const isActive = (new Date() - lastSeen) < fiveMinutesInMs;
      
      // Añadir la nueva propiedad al objeto del dispositivo
      deviceData.currentTripId = isActive ? latestTripId : null;
    } else {
      deviceData.currentTripId = null;
    }
  }
   console.log('Datos procesados y agrupados:', grouped); 
  
  return grouped;
};