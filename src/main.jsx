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

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'devices', element: <DevicesListPage /> },
      { path: 'devices/:deviceId/trips/:tripId', element: <TripDetailPage /> },
      { path: 'summary', element: <DailySummaryPage /> }, // <-- AÑADIR ESTA LÍNEA
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);