// src/utils/dataProcessor.js
import polyline from '@mapbox/polyline';

export const groupFeedsByDeviceAndTrip = (feeds) => {
  if (!feeds) return {};

  const fiveMinutesInMs = 5 * 60 * 1000;

  // Paso 1: Agrupar todos los feeds por deviceId y tripId (como antes)
  const grouped = feeds.reduce((acc, feed) => {
    const deviceId = feed.field7;
    const tripId = feed.field8;

    if (!deviceId || !tripId) return acc;

    if (!acc[deviceId]) {
      acc[deviceId] = { trips: {} };
    }
    if (!acc[deviceId].trips[tripId]) {
      acc[deviceId].trips[tripId] = { feeds: [], trajectories: [] };
    }

    acc[deviceId].trips[tripId].feeds.push(feed);
    if (feed.field6) {
      acc[deviceId].trips[tripId].trajectories.push(feed.field6);
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
   console.log('Datos procesados y agrupados:', grouped); // <-- AÑADE ESTA LÍNEA
  
  return grouped;
};