// src/context/DataContext.jsx
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { getAllFeeds } from '../services/thingSpeakService';
import { groupFeedsByDeviceAndTrip } from '../utils/dataProcessor';

const DataContext = createContext(null);

export const DataProvider = ({ children }) => {
  const [groupedData, setGroupedData] = useState({});
  const [channelData, setChannelData] = useState({});
  const [isLoading, setIsLoading] = useState(true); // Para la carga inicial
  const [isRefreshing, setIsRefreshing] = useState(false); // Para actualizaciones en segundo plano
  const [error, setError] = useState(null);

  // useEffect ahora tiene un array de dependencias vacío, lo que garantiza
  // que se ejecute solo una vez para configurar todo.
  useEffect(() => {
    const fetchAndProcessData = async (isInitialLoad = false) => {
      // Diferenciar entre la carga inicial (pantalla completa) y un refresco (indicador sutil)
      if (isInitialLoad) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      
      try {
        const allFeedsResponse = await getAllFeeds();
        // Es crucial comprobar que la respuesta y el array 'feeds' existen
        if (allFeedsResponse && allFeedsResponse.feeds) {
          const data = groupFeedsByDeviceAndTrip(allFeedsResponse.feeds);
          // console.log(allFeedsResponse.channel)
          setGroupedData(data);
          setChannelData(allFeedsResponse.channel || {});
          setError(null); // Limpiar errores anteriores si la petición tiene éxito
        } else {
          // Esto puede pasar si la API devuelve un error o un formato inesperado
          throw new Error("La respuesta de ThingSpeak no contiene un array 'feeds' válido.");
        }
      } catch (err) {
        setError(err.message);
        console.error("Error en DataProvider:", err);
      } finally {
        // Asegurarse de desactivar los indicadores de carga
        if (isInitialLoad) {
          setIsLoading(false);
        }
        setIsRefreshing(false);
      }
    };

    // 1. Ejecutar inmediatamente para la carga inicial
    fetchAndProcessData(true);

    // 2. Configurar el intervalo para refrescar cada 60 segundos
    const intervalId = setInterval(() => fetchAndProcessData(false), 60000);

    // 3. Limpiar el intervalo cuando el componente se desmonte (muy importante)
    return () => clearInterval(intervalId);
  }, []); // El array vacío [] es la clave aquí

  const value = useMemo(() => ({
    channelData,
    groupedData,
    isLoading,
    isRefreshing,
    error,
  }), [channelData, groupedData, isLoading, isRefreshing, error]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData debe ser usado dentro de un DataProvider');
  }
  return context;
};