import requests
import random
import time
import math
from datetime import datetime
import pytz
import os
from dotenv import load_dotenv

# ### NUEVO: Importaciones para el movimiento en calles reales ###
import osmnx as ox
import networkx as nx
import polyline # Para codificar la trayectoria
from shapely.geometry import Point # Importamos Point para ser explícitos

# --- Cargar variables de entorno ---
dotenv_path = os.path.join(os.path.dirname(__file__), '../.env')
load_dotenv(dotenv_path)

# --- Configuración ThingSpeak ---
THINGSPEAK_WRITE_API_KEY = os.getenv("THINGSPEAK_WRITE_API_KEY")
THINGSPEAK_API_URL = "https://api.thingspeak.com/update.json"
UPDATE_INTERVAL = 30 # segundos

# --- Verificación de la API Key ---
if THINGSPEAK_WRITE_API_KEY is None:
    print("🛑 ¡ERROR CRÍTICO! La variable de entorno para THINGSPEAK_WRITE_API_KEY no se encontró.")
    exit()

# ### NUEVO: Configuración de OSMnx para el mapa de calles ###
print("🌍 Descargando red de calles de Santiago desde OpenStreetMap...")
G = ox.graph_from_place("Santiago, Región Metropolitana, Chile", network_type='drive')
G_proj = ox.project_graph(G)
nodes_proj = list(G_proj.nodes())
print("✅ Red de calles lista.")


# --- Configuración de Simulación ---
MAX_SPEED_KMH = 50.0
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

# --- Estado Global de la Simulación ---
current_lat = 0.0
current_lon = 0.0
current_speed_mps = 0.0
current_battery = INITIAL_BATTERY
battery_state = "DISCHARGING"
current_route = []
current_edge_point_index = 0

# --- Funciones Auxiliares ---
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

def update_gps_and_speed_on_streets():
    global current_lat, current_lon, current_speed_mps
    global current_route, current_edge_point_index

    if not current_route or current_edge_point_index >= len(current_route) - 1:
        print("🗺️ Generando nueva ruta...")
        origin_node = random.choice(nodes_proj)
        destination_node = random.choice(nodes_proj)
        while origin_node == destination_node:
            destination_node = random.choice(nodes_proj)
        
        try:
            route_nodes = nx.shortest_path(G_proj, origin_node, destination_node, weight='length')
            current_route = []
            for u, v in zip(route_nodes[:-1], route_nodes[1:]):
                edge_data = G_proj.get_edge_data(u, v)
                edge = min(edge_data.values(), key=lambda d: d['length'])
                if 'geometry' in edge:
                    points = list(edge['geometry'].coords)
                    current_route.extend(points)
                else:
                    current_route.append((G_proj.nodes[v]['x'], G_proj.nodes[v]['y']))
            
            current_edge_point_index = 0
            
            start_point_proj = current_route[0]
            
            # ### CORRECCIÓN FINAL ### Usamos geom= en lugar de geometry=
            unprojected_point = ox.projection.project_geometry(geom=Point(start_point_proj), crs=G_proj.graph['crs'], to_latlong=True)[0]
            
            start_lon, start_lat = unprojected_point.x, unprojected_point.y
            current_lat, current_lon = start_lat, start_lon
            print(f"🚦 Ruta generada. Inicio en: ({current_lat:.5f}, {current_lon:.5f})")

        except nx.NetworkXNoPath:
            print("⚠️ No se encontró ruta. Se intentará de nuevo en el próximo ciclo.")
            return current_lat, current_lon, 0, []

    max_speed_mps = MAX_SPEED_KMH * 1000 / 3600
    current_speed_mps = random.uniform(0.5 * max_speed_mps, max_speed_mps)
    distance_to_travel_m = current_speed_mps * UPDATE_INTERVAL
    
    trajectory_points_proj = []
    
    if current_route:
        start_point = current_route[current_edge_point_index]
        trajectory_points_proj.append(start_point)

    while distance_to_travel_m > 0 and current_edge_point_index < len(current_route) - 1:
        p1 = current_route[current_edge_point_index]
        p2 = current_route[current_edge_point_index + 1]
        
        segment_dist = math.sqrt((p2[0] - p1[0])**2 + (p2[1] - p1[1])**2)
        
        if distance_to_travel_m >= segment_dist:
            distance_to_travel_m -= segment_dist
            current_edge_point_index += 1
            trajectory_points_proj.append(p2)
        else:
            ratio = distance_to_travel_m / segment_dist
            final_x = p1[0] + ratio * (p2[0] - p1[0])
            final_y = p1[1] + ratio * (p2[1] - p1[1])
            trajectory_points_proj.append((final_x, final_y))
            distance_to_travel_m = 0

    if current_edge_point_index >= len(current_route) - 1:
        print("🏁 Ruta completada.")

    trajectory_latlon = []
    if len(trajectory_points_proj) > 1:
        from shapely.geometry import LineString
        line_proj = LineString(trajectory_points_proj)
        # ### CORRECCIÓN FINAL ### Usamos geom= en lugar de geometry=
        line_unproj = ox.projection.project_geometry(geom=line_proj, crs=G_proj.graph['crs'], to_latlong=True)[0]
        trajectory_latlon = [(round(lat, 6), round(lon, 6)) for lon, lat in line_unproj.coords]
    elif len(trajectory_points_proj) == 1:
        # ### CORRECCIÓN FINAL ### Usamos geom= en lugar de geometry=
        point_unproj = ox.projection.project_geometry(geom=Point(trajectory_points_proj[0]), crs=G_proj.graph['crs'], to_latlong=True)[0]
        trajectory_latlon = [(round(point_unproj.y, 6), round(point_unproj.x, 6))]


    if trajectory_latlon:
        current_lat, current_lon = trajectory_latlon[-1]
    
    return round(current_lat, 6), round(current_lon, 6), round(current_speed_mps, 2), trajectory_latlon

def update_battery():
    global current_battery, battery_state, current_speed_mps
    if battery_state == "CHARGING":
        current_battery += BATTERY_CHARGE_RATE
        if current_battery >= INITIAL_BATTERY:
            current_battery = INITIAL_BATTERY
            battery_state = "DISCHARGING"
    elif battery_state == "DISCHARGING":
        weibull_component = random.weibullvariate(ALPHA_WEIBULL_DISCHARGE, BETA_WEIBULL_DISCHARGE)
        max_speed_mps_calc = MAX_SPEED_KMH * 1000 / 3600
        speed_factor = (current_speed_mps / max_speed_mps_calc) if max_speed_mps_calc > 0 else 0
        speed_discharge = speed_factor * EXTRA_DISCHARGE_MAX_SPEED_FACTOR
        total_discharge = weibull_component + speed_discharge
        current_battery -= total_discharge
        if current_battery <= LOW_BATTERY_THRESHOLD:
            current_battery = max(0, current_battery)
            battery_state = "CHARGING"
    current_battery = round(max(0.0, min(INITIAL_BATTERY, current_battery)), 1)
    return current_battery, battery_state

def send_to_thingspeak(api_key, temp, bat, lat, lon, speed, trajectory_str):
    payload = {
        'api_key': api_key,
        'field1': temp,
        'field2': bat,
        'field3': lat,
        'field4': lon,
        'field5': speed,
        'field6': trajectory_str
    }
    try:
        response = requests.post(THINGSPEAK_API_URL, data=payload)
        response.raise_for_status()
        if response.text == "0":
            print("❌ Error: ThingSpeak rechazó la actualización (demasiado rápido o clave inválida).")
        else:
            print(f"✅ Datos enviados! ID: {response.text}. Pos:({lat:.5f},{lon:.5f}), Trajectory: '{trajectory_str[:30]}...'")
    except requests.exceptions.RequestException as e:
        print(f"❌ Error de conexión con ThingSpeak: {e}")

# --- Bucle Principal ---
if __name__ == "__main__":
    print("🚀 Iniciando simulación AVANZADA (calles reales) y envío a ThingSpeak...")
    print(f"   Intervalo de actualización: {UPDATE_INTERVAL} segundos.")
    print(f"   Presiona CTRL+C para detener.")

    try:
        while True:
            chile_time = get_chile_current_time()
            temperatura_actual = calculate_temperature(chile_time)
            
            lat_actual, lon_actual, velocidad_actual_mps, trayectoria = update_gps_and_speed_on_streets()
            
            bateria_actual, estado_bateria = update_battery()
            
            if len(trayectoria) > 1: # Solo codificar si hay al menos 2 puntos para formar una línea
                encoded_trajectory = polyline.encode(trayectoria, precision=5)
            else:
                encoded_trajectory = ""

            send_to_thingspeak(THINGSPEAK_WRITE_API_KEY,
                               temperatura_actual,
                               bateria_actual,
                               lat_actual,
                               lon_actual,
                               velocidad_actual_mps,
                               encoded_trajectory)
            
            time.sleep(UPDATE_INTERVAL)
            
    except KeyboardInterrupt:
        print("\n🛑 Simulación detenida por el usuario.")
    except Exception as e:
        import traceback
        print(f"\n💥 Ocurrió un error inesperado: {e}")
        traceback.print_exc() # Imprime el traceback completo para más detalles
    finally:
        print("👋 Script finalizado.")
        