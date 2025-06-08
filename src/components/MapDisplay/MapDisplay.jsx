import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useTheme } from '../../context/ThemeContext';
import styles from './MapDisplay.module.css';

import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconRetinaUrl, iconUrl, shadowUrl,
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
    tooltipAnchor: [16, -28], shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;


const startIcon = new L.DivIcon({
  html: '📍',
  className: styles.emojiIcon,
  iconSize: [100, 100],
  iconAnchor: [50, 24], // El ancla en la parte inferior central del emoji
});
const endIcon = new L.DivIcon({
  html: '🏁',
  className: styles.emojiIcon,
  iconSize: [24, 24],
  iconAnchor: [12, 24],
});

const MapBoundsFitter = ({ bounds }) => {
    const map = useMap();
    useEffect(() => {
      if (bounds && bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }, [bounds, map]);
    return null;
};

const tileLayers = {
  dark: { url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", attribution: '&copy; OpenStreetMap & CartoDB' },
  light: { url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", attribution: '&copy; OpenStreetMap contributors' },
  satellite: { url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", attribution: '&copy; Esri & community' },
};

const tripColors = ['#FF5733', '#33FF57', '#3357FF', '#FF33A1', '#A133FF', '#33FFA1', '#FFC300', '#C70039', '#FF8C00', '#00CED1'];
const getColorForTrip = (index) => tripColors[index % tripColors.length];

const MapDisplay = ({ trips = [], visibleTrips = {}, onLegendToggle = () => {} }) => {
  const { theme } = useTheme();
  const [activeTileLayer, setActiveTileLayer] = useState(theme);

  useEffect(() => {
    setActiveTileLayer(theme);
  }, [theme]);
  
  const mapData = useMemo(() => {
    return trips.map((trip, index) => {
      const tripIdentifier = `${trip.feeds[0]?.field7}-${trip.feeds[0]?.field8}`;
      return {
        id: tripIdentifier,
        path: trip.fullTrajectory,
        color: getColorForTrip(index),
        legendLabel: `Dev #${trip.feeds[0]?.field7} / Viaje #${trip.feeds[0]?.field8}`,
        startTime: trip.feeds.length > 0 ? new Date(trip.feeds[0].created_at) : null,
      };
    });
  }, [trips]);

  const mapBounds = useMemo(() => {
    let bounds = L.latLngBounds();
    mapData.forEach(item => {
      if (visibleTrips[item.id] && item.path && item.path.length > 0) {
        bounds.extend(item.path);
      }
    });
    return bounds.isValid() ? bounds : null;
  }, [mapData, visibleTrips]);

  const initialCenter = { lat: -33.437, lng: -70.634 };

  return (
    <div className={styles.mapWrapper}>
      <MapContainer center={initialCenter} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url={tileLayers[activeTileLayer].url}
          attribution={tileLayers[activeTileLayer].attribution}
          key={activeTileLayer}
        />
        {mapData.map((trip, index) => (
          visibleTrips[trip.id] && trip.path && trip.path.length > 0 && 
            <Polyline 
              key={index} 
              pathOptions={{ color: trip.color, weight: 4 }} 
              positions={trip.path} 
            />
        ))}
        {mapData.map((trip) => {
          const isVisible = visibleTrips ? visibleTrips[trip.id] : true;
          // Solo renderizamos si es visible y la ruta tiene coordenadas
          if (isVisible && trip.path && trip.path.length > 0) {
            return (
              // Usamos React.Fragment para agrupar la ruta y sus marcadores
              <React.Fragment key={trip.id}>
                <Polyline pathOptions={{ color: trip.color, weight: 4 }} positions={trip.path} />
                
                {/* --- NUEVO: Marcador de Inicio --- */}
                <Marker position={trip.path[0]} icon={startIcon}>
                  <Popup>Inicio: {trip.legendLabel}</Popup>
                </Marker>

                {/* --- NUEVO: Marcador de Fin --- */}
                {trip.path.length > 1 && (
                  <Marker position={trip.path[trip.path.length - 1]} icon={endIcon}>
                     <Popup>Fin: {trip.legendLabel}</Popup>
                  </Marker>
                )}
              </React.Fragment>
            );
          }
          return null;
        })}
        {mapBounds && <MapBoundsFitter bounds={mapBounds} />}
      
      
      </MapContainer>
      <div className={styles.mapControls}>
        <div className={styles.tileSelector}>
            <button onClick={() => setActiveTileLayer('light')} className={activeTileLayer === 'light' ? styles.active : ''}>Claro</button>
            <button onClick={() => setActiveTileLayer('dark')} className={activeTileLayer === 'dark' ? styles.active : ''}>Oscuro</button>
            <button onClick={() => setActiveTileLayer('satellite')} className={activeTileLayer === 'satellite' ? styles.active : ''}>Satélite</button>
        </div>
      </div>
      {mapData.length > 0 && (
        <div className={styles.legend}>
          <h4>Leyenda de Viajes</h4>
          <ul>
            {mapData.map((trip, index) => (
              <li 
                key={index} 
                onClick={() => onLegendToggle(trip.id)} 
                className={!visibleTrips[trip.id] ? styles.legendItemHidden : ''}
              >
                <span className={styles.legendColorBox} style={{ backgroundColor: trip.color }}></span>
                {trip.legendLabel}
                {trip.startTime && <span className={styles.legendTime}>({trip.startTime.toLocaleTimeString()})</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default React.memo(MapDisplay);