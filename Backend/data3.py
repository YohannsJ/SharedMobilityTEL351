import requests
import random
import time
import math
from datetime import datetime
import pytz
import os
from dotenv import load_dotenv
import threading
import traceback

# ### Importaciones para el movimiento en calles reales ###
import osmnx as ox
import networkx as nx
import polyline
from shapely.geometry import Point, LineString

# --- Cargar variables de entorno ---
dotenv_path = os.path.join(os.path.dirname(__file__), '../.env')
load_dotenv(dotenv_path)

# --- Configuración ThingSpeak ---
THINGSPEAK_WRITE_API_KEY = os.getenv("THINGSPEAK_WRITE_API_KEY")
THINGSPEAK_API_URL = "https://api.thingspeak.com/update.json"
UPDATE_INTERVAL = 60 # segundos

# --- NUEVO: Configuración de Lectura de ThingSpeak ---
THINGSPEAK_READ_API_KEY = os.getenv("VITE_THINGSPEAK_READ_API_KEY")
THINGSPEAK_CHANNEL_ID = os.getenv("THINGSPEAK_CHANNEL_ID")

# --- Verificación de las API Keys ---
if not all([THINGSPEAK_WRITE_API_KEY, THINGSPEAK_READ_API_KEY, THINGSPEAK_CHANNEL_ID]):
    print("🛑 ¡ERROR CRÍTICO! Revisa tu archivo .env. Faltan una o más de estas variables:")
    print("   - THINGSPEAK_WRITE_API_KEY")
    print("   - VITE_THINGSPEAK_READ_API_KEY")
    print("   - THINGSPEAK_CHANNEL_ID")
    exit()

# --- Descarga de Red de Calles (Recurso Compartido) ---
print("🌍 Descargando red de calles de Santiago desde OpenStreetMap...")
G = ox.graph_from_place("Santiago, Región Metropolitana, Chile", network_type='drive')
G_proj = ox.project_graph(G)
nodes_proj = list(G_proj.nodes())
print("✅ Red de calles lista.")


# --- Configuración de Simulación (Constantes Globales) ---
MAX_SPEED_KMH = 25.0
INITIAL_BATTERY = 100.0
LOW_BATTERY_THRESHOLD = 10.0
BATTERY_CHARGE_RATE = 2.5
ALPHA_WEIBULL_DISCHARGE = 0.25
BETA_WEIBULL_DISCHARGE = 1.6
EXTRA_DISCHARGE_MAX_SPEED_FACTOR = 0.5
CHILE_TZ = pytz.timezone('America/Santiago')
MIN_TEMP_DAY = 12.0
MAX_TEMP_DAY = 26.0
PEAK_TEMP_HOUR = 14.0
TEMP_STD_DEV = 1.0

# --- Gestión de IDs de Viaje y Bloqueo para Prints ---
trip_id_counter = 1 # Se inicializará correctamente desde la API
trip_id_lock = threading.Lock()
print_lock = threading.Lock()

def get_new_trip_id():
    """Genera un ID de viaje único de forma segura para los hilos."""
    global trip_id_counter
    with trip_id_lock:
        trip_id = trip_id_counter
        trip_id_counter += 1
        return trip_id

# --- NUEVO: Función para leer el último ID de viaje desde ThingSpeak ---
def get_latest_trip_id_from_thingspeak(channel_id, api_key):
    """Consulta la API de ThingSpeak para encontrar el ID de viaje más alto utilizado."""
    print("🔍 Consultando ThingSpeak para obtener el último ID de viaje utilizado...")
    # Leemos específicamente el campo 8 para ser más eficientes
    url = f"https://api.thingspeak.com/channels/{channel_id}/fields/8.json"
    params = {'api_key': api_key, 'results': 8000} # Máximo de resultados por petición
    try:
        response = requests.get(url, params=params, timeout=20)
        response.raise_for_status()
        data = response.json()
        feeds = data.get('feeds', [])

        if not feeds:
            print("📊 El canal está vacío o no tiene datos en field8. Empezando los viajes desde el ID 1.")
            return 0

        max_trip_id = 0
        for feed in feeds:
            trip_id_str = feed.get('field8')
            if trip_id_str and trip_id_str.isdigit():
                trip_id = int(trip_id_str)
                if trip_id > max_trip_id:
                    max_trip_id = trip_id
        
        if max_trip_id > 0:
            print(f"✅ Último ID de viaje encontrado en el canal: {max_trip_id}")
        else:
             print("📊 No se encontraron IDs de viaje válidos. Empezando desde el ID 1.")
        
        return max_trip_id

    except requests.exceptions.RequestException as e:
        print(f"❌ Error crítico al leer desde ThingSpeak: {e}")
        print("   No se pudo determinar el último ID de viaje. Saliendo para evitar duplicados.")
        exit()
    except ValueError:
        print("❌ Error crítico: La respuesta de ThingSpeak no es un JSON válido.")
        exit()


# --- Funciones Auxiliares Globales ---
def get_chile_current_time():
    return datetime.now(CHILE_TZ)

def calculate_temperature(chile_time):
    hour_float = chile_time.hour + chile_time.minute / 60.0
    mean_daily_temp = (MIN_TEMP_DAY + MAX_TEMP_DAY) / 2.0
    amplitude = (MAX_TEMP_DAY - MIN_TEMP_DAY) / 2.0
    temp_cycle = math.cos(2 * math.pi * (hour_float - PEAK_TEMP_HOUR) / 24.0)
    target_temp = mean_daily_temp + amplitude * temp_cycle
    simulated_temp = random.gauss(target_temp, TEMP_STD_DEV)
    return round(simulated_temp, 2)

def send_to_thingspeak(api_key, temp, bat, lat, lon, speed, trajectory_str, device_id, trip_id):
    payload = {'api_key': api_key, 'field1': temp, 'field2': bat, 'field3': lat, 'field4': lon, 'field5': speed, 'field6': trajectory_str, 'field7': device_id, 'field8': trip_id}
    try:
        response = requests.post(THINGSPEAK_API_URL, data=payload, timeout=10)
        response.raise_for_status()
        with print_lock:
            if response.text == "0":
                print(f"❌ [Dev:{device_id}] Error: ThingSpeak rechazó la actualización (demasiado rápido).")
            else:
                print(f"✅ [Dev:{device_id}/Viaje:{trip_id}] Datos enviados. ID Entrada: {response.text}. Pos:({lat:.5f},{lon:.5f})")
    except requests.exceptions.RequestException as e:
        with print_lock:
            print(f"❌ [Dev:{device_id}] Error de conexión con ThingSpeak: {e}")

# --- Clase para gestionar el estado y la lógica de cada dispositivo ---
class Device:
    def __init__(self, device_id, graph, projected_graph, projected_nodes):
        self.device_id = device_id
        self.G = graph
        self.G_proj = projected_graph
        self.nodes_proj = projected_nodes
        self.lat = 0.0
        self.lon = 0.0
        self.speed_mps = 0.0
        self.battery = INITIAL_BATTERY
        self.battery_state = "DISCHARGING"
        self.route = []
        self.edge_point_index = 0
        self.trip_id = 0

    def update_gps_and_speed_on_streets(self):
        if not self.route or self.edge_point_index >= len(self.route) - 1:
            with print_lock:
                print(f"🗺️  [Dev:{self.device_id}] Generando nueva ruta...")
            self.trip_id = get_new_trip_id()
            origin_node = random.choice(self.nodes_proj)
            destination_node = random.choice(self.nodes_proj)
            while origin_node == destination_node:
                destination_node = random.choice(self.nodes_proj)
            try:
                route_nodes = nx.shortest_path(self.G_proj, origin_node, destination_node, weight='length')
                self.route = []
                for u, v in zip(route_nodes[:-1], route_nodes[1:]):
                    edge_data = self.G_proj.get_edge_data(u, v)
                    edge = min(edge_data.values(), key=lambda d: d['length'])
                    if 'geometry' in edge:
                        self.route.extend(list(edge['geometry'].coords))
                    else:
                        self.route.append((self.G_proj.nodes[v]['x'], self.G_proj.nodes[v]['y']))
                self.edge_point_index = 0
                start_point_proj = self.route[0]
                unprojected_point = ox.projection.project_geometry(geom=Point(start_point_proj), crs=self.G_proj.graph['crs'], to_latlong=True)[0]
                start_lon, start_lat = unprojected_point.x, unprojected_point.y
                self.lat, self.lon = start_lat, start_lon
                with print_lock:
                    print(f"🚦 [Dev:{self.device_id}/Viaje:{self.trip_id}] Ruta generada. Inicio en: ({self.lat:.5f}, {self.lon:.5f})")
            except nx.NetworkXNoPath:
                with print_lock:
                    print(f"⚠️ [Dev:{self.device_id}] No se encontró ruta. Reintentando...")
                return self.lat, self.lon, 0, []
        max_speed_mps = MAX_SPEED_KMH * 1000 / 3600
        self.speed_mps = random.uniform(0.5 * max_speed_mps, max_speed_mps)
        distance_to_travel_m = self.speed_mps * UPDATE_INTERVAL
        trajectory_points_proj = []
        if self.route:
            start_point = self.route[self.edge_point_index]
            trajectory_points_proj.append(start_point)
        while distance_to_travel_m > 0 and self.edge_point_index < len(self.route) - 1:
            p1 = self.route[self.edge_point_index]
            p2 = self.route[self.edge_point_index + 1]
            segment_dist = math.sqrt((p2[0] - p1[0])**2 + (p2[1] - p1[1])**2)
            if distance_to_travel_m >= segment_dist:
                distance_to_travel_m -= segment_dist
                self.edge_point_index += 1
                trajectory_points_proj.append(p2)
            else:
                ratio = distance_to_travel_m / segment_dist
                final_x = p1[0] + ratio * (p2[0] - p1[0])
                final_y = p1[1] + ratio * (p2[1] - p1[1])
                trajectory_points_proj.append((final_x, final_y))
                distance_to_travel_m = 0
        if self.edge_point_index >= len(self.route) - 1:
            with print_lock:
                print(f"🏁 [Dev:{self.device_id}/Viaje:{self.trip_id}] Ruta completada.")
        trajectory_latlon = []
        if len(trajectory_points_proj) > 1:
            line_proj = LineString(trajectory_points_proj)
            line_unproj = ox.projection.project_geometry(geom=line_proj, crs=self.G_proj.graph['crs'], to_latlong=True)[0]
            trajectory_latlon = [(round(lat, 6), round(lon, 6)) for lon, lat in line_unproj.coords]
        elif len(trajectory_points_proj) == 1:
            point_unproj = ox.projection.project_geometry(geom=Point(trajectory_points_proj[0]), crs=self.G_proj.graph['crs'], to_latlong=True)[0]
            trajectory_latlon = [(round(point_unproj.y, 6), round(point_unproj.x, 6))]
        if trajectory_latlon:
            self.lat, self.lon = trajectory_latlon[-1]
        return round(self.lat, 6), round(self.lon, 6), round(self.speed_mps, 2), trajectory_latlon

    def update_battery(self):
        if self.battery_state == "CHARGING":
            self.battery += BATTERY_CHARGE_RATE
            if self.battery >= INITIAL_BATTERY:
                self.battery = INITIAL_BATTERY
                self.battery_state = "DISCHARGING"
        elif self.battery_state == "DISCHARGING":
            weibull_component = random.weibullvariate(ALPHA_WEIBULL_DISCHARGE, BETA_WEIBULL_DISCHARGE)
            max_speed_mps_calc = MAX_SPEED_KMH * 1000 / 3600
            speed_factor = (self.speed_mps / max_speed_mps_calc) if max_speed_mps_calc > 0 else 0
            speed_discharge = speed_factor * EXTRA_DISCHARGE_MAX_SPEED_FACTOR
            total_discharge = weibull_component + speed_discharge
            self.battery -= total_discharge
            if self.battery <= LOW_BATTERY_THRESHOLD:
                self.battery = max(0, self.battery)
                self.battery_state = "CHARGING"
        self.battery = round(max(0.0, min(INITIAL_BATTERY, self.battery)), 1)
        return self.battery, self.battery_state

    def run_simulation(self):
        try:
            while True:
                chile_time = get_chile_current_time()
                temperatura_actual = calculate_temperature(chile_time)
                lat_actual, lon_actual, velocidad_actual_mps, trayectoria = self.update_gps_and_speed_on_streets()
                bateria_actual, _ = self.update_battery()
                encoded_trajectory = polyline.encode(trayectoria, precision=5) if len(trayectoria) > 1 else ""
                send_to_thingspeak(THINGSPEAK_WRITE_API_KEY, temperatura_actual, bateria_actual, lat_actual, lon_actual, velocidad_actual_mps, encoded_trajectory, self.device_id, self.trip_id)
                time.sleep(UPDATE_INTERVAL)
        except Exception as e:
            with print_lock:
                print(f"\n💥 [Dev:{self.device_id}] Ocurrió un error inesperado en el hilo: {e}")
                traceback.print_exc()

# --- Bucle Principal ---
if __name__ == "__main__":
    # --- NUEVO: Inicializar el contador de viajes desde ThingSpeak ---
    latest_trip_id = get_latest_trip_id_from_thingspeak(THINGSPEAK_CHANNEL_ID, THINGSPEAK_READ_API_KEY)
    trip_id_counter = latest_trip_id + 1
    
    print("-" * 50)
    print(f"🚀 INICIO DE SIMULACIÓN 🚀")
    print(f"   Los nuevos viajes comenzarán desde el ID: {trip_id_counter}")
    print("-" * 50)

    NUM_DEVICES = 2
    STAGGER_DELAY = UPDATE_INTERVAL/2

    print(f"   Iniciando simulación para {NUM_DEVICES} dispositivos...")
    print(f"   Intervalo de actualización por dispositivo: {UPDATE_INTERVAL} segundos.")
    print(f"   Desfase entre dispositivos: {STAGGER_DELAY} segundos.")
    print("   Presiona CTRL+C para detener.")

    devices = [Device(device_id=i+1, graph=G, projected_graph=G_proj, projected_nodes=nodes_proj) for i in range(NUM_DEVICES)]
    threads = []

    for i, device in enumerate(devices):
        if i > 0:
            with print_lock:
                print(f"🕒 Esperando {STAGGER_DELAY}s para iniciar el dispositivo {device.device_id}...")
            time.sleep(STAGGER_DELAY)
        thread = threading.Thread(target=device.run_simulation, daemon=True)
        threads.append(thread)
        thread.start()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n🛑 Simulación detenida por el usuario.")
    finally:
        print("👋 Script finalizado.")