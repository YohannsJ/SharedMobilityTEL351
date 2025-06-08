// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App';
import LandingPage from './pages/LandingPage';
import DevicesListPage from './pages/DevicesListPage';
import TripDetailPage from './pages/TripDetailPage'; // Página para ver un viaje específico
import './index.css';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />, // App actuará como layout principal con la Navbar
    children: [
      { index: true, element: <LandingPage /> }, // Página de inicio
      { path: 'devices', element: <DevicesListPage /> },
      { path: 'devices/:deviceId/trips/:tripId', element: <TripDetailPage /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);