// src/components/ThemeToggleButton.jsx
import React from 'react';
import { useTheme } from '../context/ThemeContext';
import styles from './ThemeToggleButton.module.css'; // Crear este archivo

const ThemeToggleButton = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button onClick={toggleTheme} className={styles.toggleButton} title="Cambiar tema">
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
};

export default ThemeToggleButton;