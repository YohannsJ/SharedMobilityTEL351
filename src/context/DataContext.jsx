// src/context/DataContext.jsx
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { getAllFeeds } from '../services/thingSpeakService';
import { groupFeedsByDeviceAndTrip } from '../utils/dataProcessor';

// 1. Crear el Contexto
const DataContext = createContext(null);

// 2. Crear el Componente "Proveedor" que contendrá la lógica
export const DataProvider = ({ children }) => {
  const [groupedData, setGroupedData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Esta función se ejecutará solo una vez cuando la app cargue
    const processData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const allFeedsResponse = await getAllFeeds();
        if (allFeedsResponse.feeds.length === 0) {
            throw new Error("No se recibieron datos desde ThingSpeak.");
        }
        const data = groupFeedsByDeviceAndTrip(allFeedsResponse.feeds);
        setGroupedData(data);
      } catch (err) {
        setError(err.message);
        console.error("Error en DataProvider:", err);
      } finally {
        setIsLoading(false);
      }
    };
    processData();
  }, []); // El array vacío asegura que se ejecute solo al montar el componente

  // 3. Usamos useMemo para evitar re-renders innecesarios en los componentes hijos
  const value = useMemo(() => ({
    groupedData,
    isLoading,
    error,
  }), [groupedData, isLoading, error]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

// 4. (Opcional pero recomendado) Crear un hook personalizado para consumir el contexto fácilmente
export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData debe ser usado dentro de un DataProvider');
  }
  return context;
};