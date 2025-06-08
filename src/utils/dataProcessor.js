// src/utils/dataProcessor.js
import polyline from '@mapbox/polyline';

export const groupFeedsByDeviceAndTrip = (feeds) => {
  if (!feeds) return {};

  // Agrupa todos los feeds por deviceId y tripId
  const grouped = feeds.reduce((acc, feed) => {
    const deviceId = feed.field7;
    const tripId = feed.field8;

    if (!deviceId || !tripId) return acc;

    // Inicializa la estructura si no existe
    if (!acc[deviceId]) {
      acc[deviceId] = { trips: {} };
    }
    if (!acc[deviceId].trips[tripId]) {
      acc[deviceId].trips[tripId] = { feeds: [], trajectories: [] };
    }

    acc[deviceId].trips[tripId].feeds.push(feed);
    // Guarda las polilíneas codificadas si existen
    if(feed.field6) {
        acc[deviceId].trips[tripId].trajectories.push(feed.field6);
    }

    return acc;
  }, {});

  // Ahora, decodifica y une las trayectorias para cada viaje
  for (const deviceId in grouped) {
    for (const tripId in grouped[deviceId].trips) {
        const trip = grouped[deviceId].trips[tripId];
        const decodedPath = trip.trajectories.flatMap(encoded => polyline.decode(encoded));
        trip.fullTrajectory = decodedPath;
    }
  }

  return grouped;
};