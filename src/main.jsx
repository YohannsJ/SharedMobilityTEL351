// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App';
import LandingPage from './pages/LandingPage';
import DevicesListPage from './pages/DevicesListPage';
import TripDetailPage from './pages/TripDetailPage'; // Página para ver un viaje específico
import './index.css';
import DailySummaryPage from './pages/DailySummaryPage'; // <-- Importar la nueva página
import NotFoundPage from './pages/404'; // Página para manejar 404

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'devices', element: <DevicesListPage /> },
      { path: 'devices/:deviceId/trips/:tripId', element: <TripDetailPage /> },
      { path: 'summary', element: <DailySummaryPage /> }, // <-- AÑADIR ESTA LÍNEA
      { path: '*', element: <NotFoundPage /> }, // Ruta para manejar 404
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
{/* <Link path="/*" element={<NotFoundPage />} /> */}
    
  </React.StrictMode>
);
