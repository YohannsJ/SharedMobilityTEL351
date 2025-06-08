// src/components/MapDisplay/MapDisplay.jsx
import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Arreglo para el icono por defecto de Leaflet
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconRetinaUrl, iconUrl, shadowUrl,
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
    tooltipAnchor: [16, -28], shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Componente para centrar el mapa en la ubicación actual
const MapFlyTo = ({ center, zoom = 15 }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center.lat && center.lng) {
      map.flyTo([center.lat, center.lng], zoom);
    }
  }, [center, zoom, map]);
  return null;
}

// --- INICIO DE LA CORRECCIÓN ---

// 1. ACEPTAMOS 'historicalPath' CON UN VALOR POR DEFECTO DE ARRAY VACÍO
const MapDisplay = ({ feeds, historicalPath = [] }) => {
  if ((!feeds || feeds.length === 0) && historicalPath.length === 0) {
    return <div style={{ height: '400px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Cargando mapa y ubicaciones...</div>;
  }

  // Obtenemos la posición actual desde los feeds (útil para el marcador)
  const currentPosition = useMemo(() => {
    if (!feeds || feeds.length === 0) return null;
    const lastFeed = feeds[feeds.length - 1];
    const lat = parseFloat(lastFeed.field3);
    const lon = parseFloat(lastFeed.field4);
    if (!isNaN(lat) && !isNaN(lon) && lat !== 0 && lon !== 0) {
      return [lat, lon];
    }
    return null;
  }, [feeds]);

  // Si no hay una ruta histórica, calculamos una a partir de los feeds (comportamiento antiguo)
  const fallbackLocations = useMemo(() => {
    if (historicalPath.length > 0) return []; // No calcular si ya tenemos la ruta buena
    return feeds
      .map(feed => {
        const lat = parseFloat(feed.field3);
        const lon = parseFloat(feed.field4);
        if (!isNaN(lat) && !isNaN(lon) && lat !== 0 && lon !== 0) {
          return [lat, lon];
        }
        return null;
      })
      .filter(loc => loc !== null);
  }, [feeds, historicalPath]);


  // El centro del mapa será la posición actual o el inicio de la ruta histórica
  const getInitialCenter = () => {
      if (currentPosition) return { lat: currentPosition[0], lng: currentPosition[1] };
      if (historicalPath.length > 0) return { lat: historicalPath[0][0], lng: historicalPath[0][1] };
      return { lat: -33.437, lng: -70.634 }; // Posición por defecto
  }
  const initialCenter = getInitialCenter();

  return (
    <div style={{ height: '500px', width: '100%', marginBottom: '20px' }}>
      <MapContainer center={initialCenter} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &amp; Esri, etc.'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />
        {currentPosition && (
          <Marker position={currentPosition}>
            <Popup>Última Ubicación Reportada</Popup>
          </Marker>
        )}

        {/* 2. LÓGICA DE RENDERIZADO CONDICIONAL */}
        {/* Si tenemos la ruta histórica detallada, la dibujamos en rojo */}
        {historicalPath.length > 1 && (
          <Polyline pathOptions={{ color: 'red', weight: 4 }} positions={historicalPath} />
        )}
        
        {/* Si NO tenemos ruta histórica, usamos la de respaldo (línea verde que une puntos) */}
        {historicalPath.length === 0 && fallbackLocations.length > 1 && (
          <Polyline pathOptions={{ color: 'lime', weight: 3, dashArray: '5, 10' }} positions={fallbackLocations} />
        )}
        
        {/* El componente para centrar el mapa sigue funcionando igual */}
        {initialCenter.lat !== -33.437 && <MapFlyTo center={initialCenter} zoom={16} />}
      </MapContainer>
    </div>
  );
};

export default React.memo(MapDisplay);