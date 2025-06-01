# Gestión Eficiente de Micromovilidad Compartida con IoT

## Introducción

Este proyecto demuestra el desarrollo de una plataforma IoT enfocada en el monitoreo inteligente y la gestión eficiente de vehículos de micromovilidad compartida, como scooters y bicicletas eléctricas. El sistema permite la supervisión en tiempo real de variables clave (batería, ubicación, velocidad, temperatura) para asegurar su correcta operación y disponibilidad urbana. [cite: 2]

La plataforma incluye un backend simulador en Python que envía datos a ThingSpeak y un frontend en React para visualizar estos datos, incluyendo la ubicación actual en un mapa, el rastro del recorrido y gráficos históricos del comportamiento de los sensores.

Este proyecto se enmarca como una exploración práctica de tecnologías IoT, inspirado en la creciente adopción de la micromovilidad en entornos urbanos en Chile y la necesidad de sistemas robustos para su gestión. [cite: 11, 13]

## Características Principales

* **Simulación de Datos de Sensores:** Un script de Python genera datos realistas para:
    * Temperatura: Con un ciclo diario gaussiano ajustado a la hora de Chile.
    * Nivel de Batería: Comportamiento de carga/descarga, con descarga influenciada por una distribución Weibull y la velocidad.
    * Ubicación GPS (Latitud/Longitud): Movimiento en líneas rectas, cambiando un eje a la vez, con periodos estacionarios.
    * Velocidad: Calculada en m/s y correlacionada con el movimiento y el consumo de batería.
* **Integración con ThingSpeak:** Los datos simulados se envían a un canal de ThingSpeak para su almacenamiento y posterior recuperación.
* **Dashboard Frontend en React:**
    * Visualización de datos actuales (velocidad, temperatura, batería) mediante indicadores dinámicos (velocímetro, termómetro, nivel de batería).
    * Mapa interactivo (Leaflet) con imágenes satelitales que muestra la ubicación actual del vehículo y el rastro de su recorrido de las últimas 24 horas.
    * Gráficos históricos (Recharts) para temperatura, batería y velocidad, mostrando datos de las últimas 24 horas.
    * Actualizaciones de datos en el dashboard diseñadas para ser fluidas y evitar recargas completas de la página.
* **Gestión Segura de API Keys:** Uso de variables de entorno para almacenar las API keys de ThingSpeak.

## Estructura del Proyecto

SHAREDMOBILITY/
├── Backend/
│   └── thingspeak/
│       └── enviar_datos_thingspeak.py  # Script Python para simular y enviar datos
├── public/                             # Assets estáticos para Vite
├── src/                                # Código fuente del frontend React
│   ├── assets/                         # Imágenes estáticas (SVGs, etc.)
│   ├── components/                     # Componentes reutilizables de React
│   │   ├── Charts/
│   │   ├── CurrentDataDisplay/
│   │   └── MapDisplay/
│   ├── pages/                          # Componentes de página (ej. DashboardPage)
│   ├── services/                       # Lógica de API (ej. thingSpeakService.js)
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css                       # Estilos globales
├── .env                                # Archivo para variables de entorno (NO versionar)
├── .env.example                        # Ejemplo de archivo .env
├── .gitignore
├── index.html
├── package.json
├── README.md                           # Este archivo
└── vite.config.js

## Stack Tecnológico

* **Backend (Simulador):**
    * Python 3.x
    * `requests` (para peticiones HTTP a ThingSpeak)
    * `python-dotenv` (para cargar variables de entorno)
    * `pytz` (para manejo de zonas horarias)
    * `numpy` (para algunas operaciones matemáticas, aunque `random` y `math` son los principales para la simulación actual)
* **Plataforma IoT:**
    * ThingSpeak
* **Frontend:**
    * React (con Vite como herramienta de build)
    * JavaScript (ES6+)
    * HTML5, CSS3 (con CSS Modules)
    * `axios` (para peticiones HTTP)
    * `recharts` (para gráficos)
    * `react-leaflet` y `leaflet` (para mapas)

## Prerrequisitos

* Node.js (v16 o superior recomendado) y npm/yarn.
* Python (v3.7 o superior recomendado) y pip.
* Una cuenta de ThingSpeak.

## Configuración del Proyecto

### 1. Clonar el Repositorio (Si aplica)

```bash
git clone <url-del-repositorio>
cd SHAREDMOBILITY
```

### 2. Configurar ThingSpeak
1. Ve a ThingSpeak y crea una cuenta o inicia sesión.
2. Crea un nuevo "Channel".
3. En la pestaña "Channel Settings", habilita 5 campos ("Fields"):
- Field 1: Temperatura (°C)
- Field 2: Batería (%)
- Field 3: Latitud (grados)
- Field 4: Longitud (grados)
- Field 5: Velocidad (m/s)
- Puedes añadir metadatos y tags como se discutió. Guarda los cambios.
4. Ve a la pestaña "API Keys" y copia tu:
- Write API Key (Clave API de Escritura)
- Read API Key (Clave API de Lectura)
- Channel ID (ID del Canal)

### Configurar Variables de Entorno
1. En la raíz del proyecto (SHAREDMOBILITY/), crea un archivo llamado .env.

2. Copia el contenido de .env.example (si existe) o añade las siguientes líneas, reemplazando los valores con tus propias claves de ThingSpeak:

```python
# Para el Frontend (Vite)
VITE_THINGSPEAK_CHANNEL_ID="TU_CHANNEL_ID_DE_THINGSPEAK"
VITE_THINGSPEAK_READ_API_KEY="TU_READ_API_KEY_DE_THINGSPEAK"

# Para el Backend (Python) - puede ser la misma que necesite el frontend si aplica
# o una específica. El script Python actual usa esta para la escritura.
VITE_THINGSPEAK_WRITE_API_KEY="TU_WRITE_API_KEY_DE_THINGSPEAK"
```	
- Nota: El script de Python (``enviar_datos_thingspeak.py``) está configurado para leer ``VITE_THINGSPEAK_WRITE_API_KEY`` desde este archivo ``.env`` en la raíz. El frontend React usará las otras dos variables.

### Configurar Backend (Simulador Python)
1. Navega a la carpeta del backend (aunque la instalación de dependencias puede hacerse desde la raíz si manejas un entorno virtual para todo el proyecto):

```bash
# No es estrictamente necesario cambiar de directorio si tu pip instala globalmente
# o en un venv que abarque todo el proyecto.
```	
1. Instala las dependencias de Python:
```bash
pip install requests python-dotenv pytz numpy
```

### Configurar Frontend (React App)
1. Asegúrate de estar en la raíz del proyecto (SHAREDMOBILITY/).
2. Instala las dependencias de Node.js:
```bash
npm install
# o si usas yarn:
# yarn install
```

## Cómo Iniciar el Proyecto

Debes tener ambos, el backend (script de Python) y el frontend (aplicación React), ejecutándose para que el sistema funcione completamente.

### Ejecutar el Backend (Script de Python)
Este script simulará los datos del sensor y los enviará a tu canal de ThingSpeak.

1. Abre una terminal.
2. Navega a la carpeta donde está el script o ejecútalo usando su ruta completa. Asegúrate de que el archivo ``.env`` en la raíz del proyecto esté configurado con ``VITE_THINGSPEAK_WRITE_API_KEY``.
3. Ejecuta el script:
```Bash
python Backend/thingspeak/enviar_datos_thingspeak.py
```

4. Deberías ver mensajes en la consola indicando que los datos se están generando y enviando a ThingSpeak.

### Ejecutar el Frontend (Aplicación React)

Esta aplicación leerá los datos de ThingSpeak y los mostrará en el dashboard.

1. Abre otra terminal.
2. Asegúrate de estar en la raíz del proyecto (SHAREDMOBILITY/).
3. Verifica que el archivo .env esté configurado con ``VITE_THINGSPEAK_CHANNEL_ID`` y ``VITE_THINGSPEAK_READ_API_KEY``.
4. Inicia el servidor de desarrollo de Vite:

```bash
npm run dev
```	
5. Abre tu navegador web y ve a la dirección que se muestra en la terminal (usualmente http://localhost:5173 o similar).


Ahora deberías ver el dashboard mostrando los datos (actuales y simulados) que el script de Python está enviando a ThingSpeak.

## Resumen de Componentes del Frontend (src/)
- ``pages/DashboardPage.jsx``:
    - Componente principal que estructura el layout del dashboard.
    - Maneja la lógica de obtención de datos (inicial y refrescos periódicos) desde ThingSpeak a través de ``thingSpeakService``.
    - Distribuye los datos a los componentes de visualización (``CurrentDataDisplay``, ``MapDisplay``, ``ChartsContainer``).
    - Incluye una breve descripción del proyecto.
- ``services/thingSpeakService.js``:
    - Centraliza la lógica para realizar llamadas a la API de ThingSpeak.
    - Exporta funciones para obtener feeds (ej. ``getFeedsLastDay``, `getLastFeed`).
    - Lee las API keys y el Channel ID desde las variables de entorno.
- ``components/CurrentDataDisplay/``:
    - ``CurrentDataDisplay.jsx``: Contenedor para los indicadores de datos actuales.
    - ``Speedometer.jsx``: Muestra la velocidad actual con un indicador tipo velocímetro (SVG).
    - ``Thermometer.jsx``: Muestra la temperatura actual con un indicador tipo termómetro (SVG).
    - ``BatteryLevel.jsx``: Muestra el nivel de batería actual con un indicador de batería (SVG).
- ``components/MapDisplay/MapDisplay.jsx``:
    - Utiliza react-leaflet para renderizar un mapa interactivo.
    - Muestra una capa de teselas con imágenes satelitales.
    - Coloca un marcador en la ubicación GPS más reciente del dispositivo.
    - Dibuja una polilínea (Polyline) que representa el rastro del recorrido del dispositivo basado en los datos históricos.
- ``components/Charts/``:
    - ``ChartsContainer.jsx``: Organiza y provee datos a múltiples gráficos históricos.
    - ``HistoricalChart.jsx``: Componente reutilizable basado en recharts para mostrar gráficos de líneas (ej. para temperatura, batería, velocidad a lo largo del tiempo). Formatea los ejes y tooltips para una mejor visualización.
## Resumen del Script Python (Backend/thingspeak/enviar_datos_thingspeak.py)
- **Propósito**: Simular un dispositivo IoT que recopila y envía datos de sensores a un canal de ThingSpeak.
- Funcionalidades Clave:
    - Generación de Datos Realistas:
        - Temperatura: Sigue un ciclo diario (más cálido durante el día, más frío por la noche) basado en la hora actual de Chile, con variabilidad gaussiana.
        - Batería: Simula un ciclo de carga y descarga. La descarga se ve afectada por una componente aleatoria de una distribución Weibull (beta=1.6) y por la velocidad actual del "vehículo".
        - GPS (Latitud, Longitud): Inicia en coordenadas predefinidas y simula un movimiento en líneas rectas (Norte, Sur, Este, Oeste), cambiando solo un eje a la vez. Incluye periodos en los que el vehículo está estacionario.
        - Velocidad: Calculada en m/s, correlacionada con el movimiento GPS. Si el vehículo está estacionario, la velocidad es cero.
    - Envío a ThingSpeak: Utiliza la librería requests para enviar los datos generados a los campos configurados en el canal de ThingSpeak a intervalos regulares (ej. cada 30 segundos).
    - Configuración: Carga la THINGSPEAK_WRITE_API_KEY desde el archivo .env ubicado en la raíz del proyecto.

**Posibles Mejoras Futuras**
Complementar...