import requests
import random
import time
import math
from datetime import datetime
import pytz # Para zonas horarias
import os # Importar la librería os para acceder a variables de entorno
from dotenv import load_dotenv # Importar la función load_dotenv

# --- Cargar variables de entorno desde .env ---
# Construir la ruta al archivo .env que está dos niveles arriba
dotenv_path = os.path.join(os.path.dirname(__file__), '../.env')
load_dotenv(dotenv_path)

# --- Configuración ThingSpeak ---
# Acceder a la variable de entorno. Asegúrate que el nombre coincida con el de tu .env
# Si en tu .env usaste VITE_THINGSPEAK_WRITE_API_KEY, úsalo aquí.
THINGSPEAK_WRITE_API_KEY = os.getenv("VITE_THINGSPEAK_WRITE_API_KEY")
# Si prefieres una variable específica para Python en tu .env, como PYTHON_THINGSPEAK_WRITE_API_KEY,
# entonces usa: os.getenv("PYTHON_THINGSPEAK_WRITE_API_KEY")

THINGSPEAK_API_URL = "https://api.thingspeak.com/update.json"
UPDATE_INTERVAL = 30  # segundos

# --- Verificación de la API Key (Importante) ---
if THINGSPEAK_WRITE_API_KEY is None:
    print("🛑 ¡ERROR CRÍTICO! La variable de entorno para THINGSPEAK_WRITE_API_KEY no se encontró.")
    print(f"   Asegúrate de que esté definida en tu archivo: {dotenv_path}")
    print(f"   Nombre esperado en .env: VITE_THINGSPEAK_WRITE_API_KEY (o el que hayas configurado)")
    exit() # Detener el script si la clave no se encuentra


# --- Configuración de Simulación ---
# GPS y Movimiento
START_LAT = -33.43704205868932
START_LON = -70.63473385143928
MAX_SPEED_KMH = 60.0  # Velocidad máxima en km/h
PROB_DECISION_MOVE_STOP = 0.1 # Probabilidad en cada ciclo de decidir si cambiar estado movimiento/parado
PROB_BECOME_STATIONARY = 0.3  # Si se decide, probabilidad de pasar a estar quieto
PROB_BECOME_MOVING = 0.7     # Si se decide y está quieto, probabilidad de empezar a moverse
MIN_STEPS_SAME_DIRECTION = 10 # Mínimo updates antes de considerar cambiar dirección (10 * 30s = 5 min)
MAX_STEPS_SAME_DIRECTION = 40 # Máximo updates antes de forzar cambio dirección (40 * 30s = 20 min)

# Batería
INITIAL_BATTERY = 100.0
LOW_BATTERY_THRESHOLD = 10.0
HIGH_BATTERY_THRESHOLD = 99.0 # Para evitar sobrepasar 100 exacto y volver a descargar antes
BATTERY_CHARGE_RATE = 2.5  # % de batería cargada por ciclo de update cuando está cargando
# Weibull para descarga (afecta la cantidad de descarga base)
# Beta (shape) = 1.6 (dado por el usuario)
# Alpha (scale) = 0.2 (ajusta este valor para cambiar la 'agresividad' media de la descarga base)
# Mean de Weibull(alpha, beta) = alpha * gamma(1 + 1/beta)
# Para beta=1.6, gamma(1 + 1/1.6) = gamma(1.625) approx 0.8935
# Entonces, la descarga base media por Weibull será approx ALPHA_WEIBULL_DISCHARGE * 0.8935 %
ALPHA_WEIBULL_DISCHARGE = 0.25 # Este es el 'eta' o 'scale' para Weibull
BETA_WEIBULL_DISCHARGE = 1.6
# Factor de descarga adicional por velocidad (0.5% extra a máxima velocidad)
EXTRA_DISCHARGE_MAX_SPEED_FACTOR = 0.5 # % extra de descarga a MAX_SPEED_KMH

# Temperatura
CHILE_TZ = pytz.timezone('America/Santiago')
MIN_TEMP_DAY = 12.0  # °C (Temperatura mínima, ej. madrugada)
MAX_TEMP_DAY = 26.0  # °C (Temperatura máxima, ej. después de mediodía)
PEAK_TEMP_HOUR = 14.0 # Hora del día (0-23.99) con la temperatura máxima (14.0 = 2 PM)
TEMP_STD_DEV = 1.0   # Desviación estándar para la variabilidad Gaussiana de la temp.

# --- Estado Global de la Simulación (se irá actualizando) ---
current_lat = START_LAT
current_lon = START_LON
current_speed_mps = 0.0
is_stationary = True
# Direcciones: 0:Norte, 1:Este, 2:Sur, 3:Oeste
current_direction_index = random.randint(0, 3) 
steps_in_current_dir = 0
steps_until_next_direction_change = random.randint(MIN_STEPS_SAME_DIRECTION, MAX_STEPS_SAME_DIRECTION)

current_battery = INITIAL_BATTERY
battery_state = "DISCHARGING" # "CHARGING" o "DISCHARGING"

# --- Funciones Auxiliares ---
def get_chile_current_time():
    """Obtiene la hora actual en Chile."""
    return datetime.now(CHILE_TZ)

def calculate_temperature(chile_time):
    """Calcula la temperatura simulada basada en la hora del día en Chile."""
    hour_float = chile_time.hour + chile_time.minute / 60.0
    
    # Modelar ciclo diario con una función coseno
    # (MAX_TEMP_DAY + MIN_TEMP_DAY) / 2 es el valor medio
    # (MAX_TEMP_DAY - MIN_TEMP_DAY) / 2 es la amplitud
    mean_daily_temp = (MIN_TEMP_DAY + MAX_TEMP_DAY) / 2.0
    amplitude = (MAX_TEMP_DAY - MIN_TEMP_DAY) / 2.0
    
    # Queremos que el coseno sea 1 (máximo) en PEAK_TEMP_HOUR
    # cos(2*pi * (t - t_peak) / 24)
    temp_cycle = math.cos(2 * math.pi * (hour_float - PEAK_TEMP_HOUR) / 24.0)
    target_temp = mean_daily_temp + amplitude * temp_cycle
    
    # Añadir variabilidad Gaussiana
    simulated_temp = random.gauss(target_temp, TEMP_STD_DEV)
    return round(simulated_temp, 2)

def update_gps_and_speed():
    """Actualiza la posición GPS y la velocidad."""
    global current_lat, current_lon, current_speed_mps, is_stationary
    global current_direction_index, steps_in_current_dir, steps_until_next_direction_change

    # Decidir si cambiar estado movimiento/parado
    if random.random() < PROB_DECISION_MOVE_STOP:
        if is_stationary:
            if random.random() < PROB_BECOME_MOVING:
                is_stationary = False
        else: # está moviendose
            if random.random() < PROB_BECOME_STATIONARY:
                is_stationary = True
                current_speed_mps = 0.0
    
    if is_stationary:
        current_speed_mps = 0.0
        # Aunque esté quieto, el contador de dirección sigue para eventual cambio
        steps_in_current_dir +=1 
        if steps_in_current_dir >= steps_until_next_direction_change:
             # Forzar cambio de dirección potencial para la próxima vez que se mueva
            current_direction_index = random.randint(0, 3)
            steps_in_current_dir = 0
            steps_until_next_direction_change = random.randint(MIN_STEPS_SAME_DIRECTION, MAX_STEPS_SAME_DIRECTION)
        return current_lat, current_lon, current_speed_mps

    # Si está en movimiento
    max_speed_mps = MAX_SPEED_KMH * 1000 / 3600
    # Velocidad aleatoria entre 20% y 100% de la máxima (si se mueve)
    current_speed_mps = random.uniform(0.2 * max_speed_mps, max_speed_mps) 
    
    distance_m = current_speed_mps * UPDATE_INTERVAL

    # Cambiar de dirección si es necesario
    steps_in_current_dir += 1
    if steps_in_current_dir >= steps_until_next_direction_change:
        new_direction = random.randint(0, 3)
        # Evitar la misma dirección o la opuesta inmediata para un movimiento más variado
        while new_direction == current_direction_index or \
              new_direction == (current_direction_index + 2) % 4: # Evita misma y opuesta
            new_direction = random.randint(0, 3)
        current_direction_index = new_direction
        steps_in_current_dir = 0
        steps_until_next_direction_change = random.randint(MIN_STEPS_SAME_DIRECTION, MAX_STEPS_SAME_DIRECTION)

    # Aproximación de conversión de metros a grados de lat/lon
    # Radio de la Tierra en metros
    R_EARTH = 6371000 
    delta_lat_deg = (distance_m / R_EARTH) * (180 / math.pi)
    delta_lon_deg = (distance_m / (R_EARTH * math.cos(math.radians(current_lat)))) * (180 / math.pi)

    if current_direction_index == 0: # Norte
        current_lat += delta_lat_deg
    elif current_direction_index == 1: # Este
        current_lon += delta_lon_deg
    elif current_direction_index == 2: # Sur
        current_lat -= delta_lat_deg
    else: # Oeste (current_direction_index == 3)
        current_lon -= delta_lon_deg
    
    # Limitar latitud y longitud a rangos válidos (opcional, pero buena práctica)
    current_lat = max(-90.0, min(90.0, current_lat))
    current_lon = max(-180.0, min(180.0, current_lon))

    return round(current_lat, 6), round(current_lon, 6), round(current_speed_mps, 2)


def update_battery():
    """Actualiza el nivel de batería."""
    global current_battery, battery_state, current_speed_mps

    if battery_state == "CHARGING":
        current_battery += BATTERY_CHARGE_RATE
        if current_battery >= INITIAL_BATTERY: # O podría ser HIGH_BATTERY_THRESHOLD
            current_battery = INITIAL_BATTERY
            battery_state = "DISCHARGING"
            print("🔋 Batería cargada. Cambiando a descarga.")
    
    elif battery_state == "DISCHARGING":
        # Descarga base usando Weibull
        # random.weibullvariate(alpha, beta) -> alpha es escala (eta), beta es forma (k)
        weibull_component = random.weibullvariate(ALPHA_WEIBULL_DISCHARGE, BETA_WEIBULL_DISCHARGE)
        
        # Descarga adicional por velocidad
        # (current_speed_mps / (MAX_SPEED_KMH * 1000 / 3600)) es la fracción de la velocidad máxima
        max_speed_mps_calc = MAX_SPEED_KMH * 1000 / 3600
        speed_factor = (current_speed_mps / max_speed_mps_calc) if max_speed_mps_calc > 0 else 0
        speed_discharge = speed_factor * EXTRA_DISCHARGE_MAX_SPEED_FACTOR
        
        total_discharge = weibull_component + speed_discharge
        current_battery -= total_discharge
        
        if current_battery <= LOW_BATTERY_THRESHOLD:
            current_battery = max(0, current_battery) # Evitar negativo
            battery_state = "CHARGING"
            print(f"🔋 Batería baja ({current_battery:.1f}%). Cambiando a carga.")
        elif current_battery < 0: # Seguridad
             current_battery = 0
             battery_state = "CHARGING"

    current_battery = round(max(0.0, min(INITIAL_BATTERY, current_battery)), 1)
    return current_battery, battery_state


def send_to_thingspeak(api_key, temp, bat, lat, lon, speed):
    """Envía los datos al canal de ThingSpeak."""
    payload = {
        'api_key': api_key,
        'field1': temp,    # Temperatura
        'field2': bat,     # Batería
        'field3': lat,     # Latitud
        'field4': lon,     # Longitud
        'field5': speed    # Velocidad (m/s)
    }
    try:
        response = requests.post(THINGSPEAK_API_URL, data=payload)
        response.raise_for_status()
        if response.text == "0":
            print("❌ Error: ThingSpeak rechazó la actualización (demasiado rápido o clave inválida).")
        else:
            print(f"✅ Datos enviados! ID: {response.text}. Temp:{temp}°C, Bat:{bat}%, GPS:({lat},{lon}), Vel:{speed}m/s")
    except requests.exceptions.RequestException as e:
        print(f"❌ Error de conexión con ThingSpeak: {e}")
    except Exception as e:
        print(f"❌ Error inesperado en envío: {e}")

# --- Bucle Principal ---
if __name__ == "__main__":
    if THINGSPEAK_WRITE_API_KEY == "TU_WRITE_API_KEY":
        print("🛑 ¡ALERTA! Debes reemplazar 'TU_WRITE_API_KEY' con tu clave.")
        exit()

    print("🚀 Iniciando simulación avanzada y envío a ThingSpeak...")
    print(f"   Intervalo de actualización: {UPDATE_INTERVAL} segundos.")
    print(f"   Presiona CTRL+C para detener.")

    try:
        while True:
            # 1. Obtener hora de Chile
            chile_time = get_chile_current_time()
            
            # 2. Calcular Temperatura
            temperatura_actual = calculate_temperature(chile_time)
            
            # 3. Actualizar GPS y Velocidad
            lat_actual, lon_actual, velocidad_actual_mps = update_gps_and_speed()
            
            # 4. Actualizar Batería (depende de la velocidad)
            bateria_actual, estado_bateria = update_battery() # velocidad_actual_mps es global o pásala
            
            # 5. Enviar a ThingSpeak
            send_to_thingspeak(THINGSPEAK_WRITE_API_KEY,
                               temperatura_actual,
                               bateria_actual,
                               lat_actual,
                               lon_actual,
                               velocidad_actual_mps)
            
            # 6. Esperar para el siguiente ciclo
            time.sleep(UPDATE_INTERVAL)
            
    except KeyboardInterrupt:
        print("\n🛑 Simuzlación detenida por el usuario.")
    finally:
        print("👋 Script finalizado.")