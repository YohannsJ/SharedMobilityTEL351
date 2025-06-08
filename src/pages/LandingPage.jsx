// src/pages/LandingPage.jsx
import React from 'react';
import styles from './LandingPage.module.css'; // Crea estilos para esta página

const LandingPage = () => {
  return (
    <div className={styles.container}>
      <h1>Plataforma IoT para Gestión de Micromovilidad</h1>
      <p>
        Este proyecto demuestra una plataforma IoT para el monitoreo inteligente de vehículos de micromovilidad compartida (scooters/bicicletas eléctricas).
        Permite la supervisión en tiempo real de variables clave como batería, ubicación y estado físico, con el objetivo de optimizar la gestión operativa y mejorar la experiencia del usuario. Inspirado en la necesidad de soluciones eficientes de micromovilidad en Chile.
      </p>
      {/* Puedes agregar imágenes o más secciones aquí */}
    </div>
  );
};

export default LandingPage;