// src/components/MapDisplay/MapDisplay.jsx
import React, { useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet'; // Importar L para el icono personalizado

// Arreglo para el icono por defecto de Leaflet que a veces no carga bien con Webpack/Vite
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconRetinaUrl,
    iconUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;


// Componente para centrar el mapa en la ubicación actual
const MapFlyTo = ({ center, zoom = 15}) => {
  const map = useMap();
  useEffect(() => {
    if (center && center.lat && center.lng) {
      map.flyTo([center.lat, center.lng], zoom);
    }
  }, [center, zoom, map]);
  return null;
}


const MapDisplay = ({ feeds }) => {
  if (!feeds || feeds.length === 0) {
    return <div style={{ height: '400px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Cargando mapa y ubicaciones...</div>;
  }

  // const locations = feeds
  //   .map(feed => {
  //     const lat = parseFloat(feed.field3);
  //     const lon = parseFloat(feed.field4);
  //     if (!isNaN(lat) && !isNaN(lon) && lat !== 0 && lon !== 0) { // Evitar (0,0) si es data inválida
  //       return [lat, lon];
  //     }
  //     return null;
  //   })
  //   .filter(loc => loc !== null);

  // const currentPosition = locations.length > 0 ? locations[locations.length - 1] : null;
  // Considera usar useMemo para 'locations' si el cálculo es pesado y 'feeds' no siempre cambia su contenido relevante
  const locations = useMemo(() => {
    if (!feeds || feeds.length === 0) return [];
    return feeds
      .map(feed => { /* ... tu lógica de mapeo ... */ 
        const lat = parseFloat(feed.field3);
      const lon = parseFloat(feed.field4);
      if (!isNaN(lat) && !isNaN(lon) && lat !== 0 && lon !== 0) { // Evitar (0,0) si es data inválida
        return [lat, lon];
      }
      return null;
      })
      .filter(loc => loc !== null);
  }, [feeds]);

  const currentPosition = useMemo(() => {
    return locations.length > 0 ? locations[locations.length - 1] : null;
  }, [locations]);
  const initialCenter = currentPosition ? { lat: currentPosition[0], lng: currentPosition[1] } : { lat: -33.437, lng: -70.634 }; // Posición por defecto si no hay datos

  return (
    <div style={{ height: '500px', width: '100%', marginBottom: '20px' }}>
      <MapContainer center={initialCenter} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &amp; Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" // URL para imágenes satelitales de Esri
        />
        {currentPosition && (
          <Marker position={currentPosition}>
            <Popup>Ubicación Actual</Popup>
          </Marker>
        )}
        {locations.length > 1 && (
          <Polyline pathOptions={{ color: 'lime' }} positions={locations} />
        )}
        {currentPosition && <MapFlyTo center={{lat: currentPosition[0], lng: currentPosition[1]}} zoom={16} />}
      </MapContainer>
    </div>
  );
};

export default React.memo(MapDisplay);