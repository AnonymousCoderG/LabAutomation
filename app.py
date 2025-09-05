# from flask import Flask, request, jsonify, render_template
# import requests
# import threading
# import speech_recognition as sr
# import os

# app = Flask(__name__, template_folder="templates", static_folder="static")

# # Create a temporary directory for audio uploads if it doesn't exist
# if not os.path.exists("temp_audio"):
#     os.makedirs("temp_audio")

# # ---------------- ESP32 CONFIG ----------------
# # --- FIX: Added 'http://' to the IP address to make it a valid URL ---
# ESP32_IP = "http://192.168.1.62" 
# ESP32_COMMAND_ENDPOINT = f"{ESP32_IP}/command"

# # ---------------- SENSOR DATA STORAGE ----------------
# latest_sensor_data = {}

# # ---------------- COMMAND SENDER ----------------
# last_command_sent = None
# def send_command_async(command: int):
#     global last_command_sent
#     # Debounce: Don't send the same command twice in a row
#     if command == last_command_sent:
#         print(f"Skipping duplicate command {command}")
#         return

#     def worker():
#         try:
#             # This request will now work correctly
#             response = requests.post(
#                 ESP32_COMMAND_ENDPOINT, data=str(command), timeout=5
#             )
#             print(f"Sent command {command} → ESP32, Response: {response.text}")
#         except Exception as e:
#             print(f"Command send failed: {e}")

#     last_command_sent = command
#     threading.Thread(target=worker, daemon=True).start()

# # --- Endpoint for MANUAL buttons ---
# @app.route('/send_command', methods=['POST'])
# def send_command():
#     command = int(request.form.get("command", 1))
#     send_command_async(command)
#     return f"Command {command} sent!"

# # --- Endpoint to receive GESTURE commands from the browser ---
# @app.route('/gesture_command', methods=['POST'])
# def gesture_command():
#     data = request.get_json()
#     action = data.get('action')
#     print(f"Received gesture action: {action}")
#     if action == 'ON':
#         send_command_async(1)
#     elif action == 'OFF':
#         send_command_async(0)
#     # Reset last_command_sent to allow alternating gesture commands
#     global last_command_sent
#     last_command_sent = None 
#     return jsonify({"status": "gesture command received"})

# # ---------------- SENSOR ENDPOINT ----------------
# @app.route('/sensor', methods=['POST'])
# def sensor():
#     global latest_sensor_data
#     data = request.get_json()
#     if "isRaining" in data:
#         data["isRaining"] = "Yes" if str(data["isRaining"]) in ["1", "true", "True"] else "No"
#     if "fireDetected" in data:
#         data["fireDetected"] = "Yes" if str(data["fireDetected"]) in ["1", "true", "True"] else "No"
#     latest_sensor_data = data
#     return jsonify({"status": "ok"})

# @app.route('/get_sensor_data', methods=['GET'])
# def get_sensor_data():
#     return jsonify(latest_sensor_data)

# # --- VOICE CONTROL (From uploaded audio file) ---
# recognizer = sr.Recognizer()

# @app.route('/process_audio', methods=['POST'])
# def process_audio():
#     if 'audio_data' not in request.files:
#         return jsonify({"error": "No audio file found"}), 400
#     audio_file = request.files['audio_data']
#     filepath = os.path.join("temp_audio", "recording.wav")
#     audio_file.save(filepath)
#     text = "Could not recognize audio."
#     try:
#         with sr.AudioFile(filepath) as source:
#             audio_data = recognizer.record(source)
#             text = recognizer.recognize_google(audio_data)
#             print(f"Recognized: {text}")
#             if "on" in text.lower():
#                 send_command_async(1)
#             elif "off" in text.lower():
#                 send_command_async(0)
#     except Exception as e:
#         text = f"An error occurred: {e}"
#         print(f"Speech recognition error: {e}")
#     finally:
#         if os.path.exists(filepath):
#             os.remove(filepath)
#     return jsonify({"text": text})

# # ---------------- ROUTES ----------------
# @app.route('/')
# def home(): 
#     return render_template("index.html")

# # ---------------- MAIN ----------------
# if __name__ == '__main__':
#     app.run(host="0.0.0.0", port=5000, debug=False, threaded=True)


#above code works perfectly without the mqtt
# from flask import Flask, request, jsonify, render_template
# import threading
# import speech_recognition as sr
# import os
# import paho.mqtt.client as mqtt

# app = Flask(__name__, template_folder="templates", static_folder="static")

# # ------------------- MQTT CONFIG -------------------
# # --- IMPORTANT: FILL THESE IN FROM YOUR HIVEMQ CLOUD DASHBOARD ---
# MQTT_BROKER_URL = "450a2a0e66c34794aac4e8ff837827d2.s1.eu.hivemq.cloud"  # Your Hostname
# MQTT_BROKER_PORT = 8883                                # The TLS Port
# MQTT_USERNAME = "lofhost"                           # Your created username
# MQTT_PASSWORD = "LOF@123g"                           # Your created password
# MQTT_COMMAND_TOPIC = "home/room/command"                  # The "mailbox" for commands
# MQTT_SENSOR_TOPIC = "home/room/sensors"                   # The "mailbox" for sensor data

# # --- Setup the MQTT Client ---
# def on_connect(client, userdata, flags, rc):
#     if rc == 0:
#         print("Connected to MQTT Broker!")
#         client.subscribe(MQTT_SENSOR_TOPIC) # Subscribe to sensor topic on connect
#     else:
#         print(f"Failed to connect, return code {rc}\n")

# def on_message(client, userdata, msg):
#     global latest_sensor_data
#     print(f"Received message from topic {msg.topic}: {msg.payload.decode()}")
#     # Here you would parse the JSON string from the ESP32
#     # For simplicity, we assume the payload is a simple string for now.
#     # In a real scenario, you'd use: latest_sensor_data = json.loads(msg.payload.decode())
    
# mqtt_client = mqtt.Client()
# mqtt_client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
# mqtt_client.on_connect = on_connect
# mqtt_client.on_message = on_message
# mqtt_client.tls_set(tls_version=mqtt.ssl.PROTOCOL_TLS) # Use secure connection
# mqtt_client.connect(MQTT_BROKER_URL, MQTT_BROKER_PORT)
# mqtt_client.loop_start() # Start a background thread to handle MQTT

# # Create a temporary directory for audio uploads
# if not os.path.exists("temp_audio"):
#     os.makedirs("temp_audio")

# # ---------------- SENSOR DATA STORAGE ----------------
# latest_sensor_data = {}

# # ---------------- COMMAND SENDER (NOW USES MQTT) ----------------
# last_command_sent = None
# def send_command_async(command: int):
#     global last_command_sent
#     if command == last_command_sent:
#         return

#     try:
#         mqtt_client.publish(MQTT_COMMAND_TOPIC, str(command))
#         print(f"Published command '{command}' to topic '{MQTT_COMMAND_TOPIC}'")
#     except Exception as e:
#         print(f"Failed to publish to MQTT: {e}")
#     last_command_sent = command

# # --- Endpoints for MANUAL, GESTURE, and VOICE commands ---
# @app.route('/send_command', methods=['POST'])
# def send_command():
#     send_command_async(int(request.form.get("command", 1)))
#     return "Command sent!"

# @app.route('/gesture_command', methods=['POST'])
# def gesture_command():
#     action = request.get_json().get('action')
#     print(f"Received gesture action: {action}")
#     if action == 'ON': send_command_async(1)
#     elif action == 'OFF': send_command_async(0)
#     global last_command_sent
#     last_command_sent = None
#     return jsonify({"status": "gesture command received"})

# @app.route('/process_audio', methods=['POST'])
# def process_audio():
#     # (This function is unchanged, it just calls send_command_async now)
#     if 'audio_data' not in request.files: return jsonify({"error": "No audio file found"}), 400
#     audio_file = request.files['audio_data']
#     filepath = os.path.join("temp_audio", "recording.wav")
#     audio_file.save(filepath)
#     text = "Could not recognize audio."
#     try:
#         recognizer = sr.Recognizer()
#         with sr.AudioFile(filepath) as source:
#             audio_data = recognizer.record(source)
#             text = recognizer.recognize_google(audio_data)
#             print(f"Recognized: {text}")
#             if "on" in text.lower(): send_command_async(1)
#             elif "off" in text.lower(): send_command_async(0)
#     except Exception as e:
#         text = f"An error occurred: {e}"
#     finally:
#         if os.path.exists(filepath): os.remove(filepath)
#     return jsonify({"text": text})

# # --- SENSOR ENDPOINTS ---
# # This endpoint is no longer needed as data comes via MQTT's on_message
# # @app.route('/sensor', methods=['POST']) ...

# @app.route('/get_sensor_data', methods=['GET'])
# def get_sensor_data():
#     return jsonify(latest_sensor_data)

# # ---------------- ROUTES & MAIN ----------------
# @app.route('/')
# def home(): 
#     return render_template("index.html")

# if __name__ == '__main__':
#     app.run(host="0.0.0.0", port=5000, debug=False, threaded=True)

#above code works well but sensor data is not received in app and command is not received by esp
# --- IMPORTANT: This must be the very first line of your app.py ---
# import eventlet
# eventlet.monkey_patch()

# from flask import Flask, render_template, request, jsonify
# import json
# import os
# import threading
# from flask_socketio import SocketIO
# import paho.mqtt.client as mqtt
# import speech_recognition as sr
# import time

# app = Flask(__name__, template_folder="templates", static_folder="static")
# app.config['SECRET_KEY'] = 'a_very_secret_and_random_key_for_security' 
# #socketio = SocketIO(app, async_mode='eventlet')
# socketio = SocketIO(app, async_mode='eventlet', cors_allowed_origins="*")
# # ------------------- MQTT CONFIG -------------------
# # --- IMPORTANT: FILL THESE IN FROM YOUR HIVEMQ CLOUD DASHBOARD ---
# MQTT_BROKER_URL = "450a2a0e66c34794aac4e8ff837827d2.s1.eu.hivemq.cloud"
# MQTT_BROKER_PORT = 8883
# MQTT_USERNAME = "lofhost"
# MQTT_PASSWORD = "LOF@123g"
# MQTT_COMMAND_TOPIC = "home/room/command"
# MQTT_SENSOR_TOPIC = "home/room/sensors"

# # --- Setup the MQTT Client (now in a more robust way) ---
# mqtt_client = mqtt.Client()
# latest_sensor_data = {} # Initialize here

# def on_connect(client, userdata, flags, rc):
#     if rc == 0:
#         print("Connected to MQTT Broker!")
#         client.subscribe(MQTT_SENSOR_TOPIC)
#     else:
#         print(f"Failed to connect to MQTT, return code {rc}\n")

# def on_message(client, userdata, msg):
#     global latest_sensor_data
#     payload = msg.payload.decode()
#     print(f"Received message from topic {msg.topic}: {payload}")
#     try:
#         latest_sensor_data = json.loads(payload)
#         # Use socketio.emit to push data to all connected clients
#         # NEW CODE (The Fix)
#         socketio.emit('sensor_update', latest_sensor_data, namespace='/')
#         print("Pushed sensor data to UI via WebSocket.")
#     except Exception as e:
#         print(f"Error processing MQTT message: {e}")

# def mqtt_thread_function():
#     mqtt_client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
#     mqtt_client.on_connect = on_connect
#     mqtt_client.on_message = on_message
#     mqtt_client.tls_set(tls_version=mqtt.ssl.PROTOCOL_TLS)
    
#     while True:
#         try:
#             print("Attempting to connect to MQTT broker...")
#             mqtt_client.connect(MQTT_BROKER_URL, MQTT_BROKER_PORT, 60)
#             mqtt_client.loop_forever() # This is a blocking call that runs the client
#         except Exception as e:
#             print(f"MQTT connection failed: {e}. Retrying in 5 seconds...")
#             time.sleep(5)

# # --- Start MQTT connection in a non-blocking background thread ---
# mqtt_thread = threading.Thread(target=mqtt_thread_function, daemon=True)
# mqtt_thread.start()

# # Create a temporary directory for audio uploads
# if not os.path.exists("temp_audio"):
#     os.makedirs("temp_audio")

# # ---------------- COMMAND SENDER ----------------
# last_command_sent = None
# def send_command_async(command: int):
#     global last_command_sent
#     if command == last_command_sent: return
#     try:
#         mqtt_client.publish(MQTT_COMMAND_TOPIC, str(command))
#         print(f"Published command '{command}' to topic '{MQTT_COMMAND_TOPIC}'")
#     except Exception as e:
#         print(f"Failed to publish to MQTT: {e}")
#     last_command_sent = command

# # --- Endpoints ---
# @app.route('/send_command', methods=['POST'])
# def send_command():
#     send_command_async(int(request.form.get("command", 1)))
#     return "Command sent!"

# @app.route('/gesture_command', methods=['POST'])
# def gesture_command():
#     action = request.get_json().get('action')
#     if action == 'ON': send_command_async(1)
#     elif action == 'OFF': send_command_async(0)
#     global last_command_sent
#     last_command_sent = None
#     return jsonify({"status": "gesture command received"})

# @app.route('/process_audio', methods=['POST'])
# def process_audio():
#     if 'audio_data' not in request.files: return jsonify({"error": "No audio file found"}), 400
#     audio_file = request.files['audio_data']
#     filepath = os.path.join("temp_audio", "recording.wav")
#     audio_file.save(filepath)
#     text = "Could not recognize audio."
#     try:
#         recognizer = sr.Recognizer()
#         with sr.AudioFile(filepath) as source:
#             audio_data = recognizer.record(source)
#             text = recognizer.recognize_google(audio_data)
#             print(f"Recognized: {text}")
#             if "on" in text.lower(): send_command_async(1)
#             elif "off" in text.lower(): send_command_async(0)
#     except Exception as e:
#         text = f"An error occurred: {e}"
#     finally:
#         if os.path.exists(filepath): os.remove(filepath)
#     return jsonify({"text": text})

# # Endpoint for the initial data load when a client first connects
# @app.route('/get_initial_data', methods=['GET'])
# def get_initial_data():
#     return jsonify(latest_sensor_data)

# @app.route('/')
# def home(): 
#     return render_template("index.html")

# # ---------------- MAIN ----------------
# if __name__ == '__main__':
#     # Use socketio.run() to start the eventlet server
#     socketio.run(app, host="0.0.0.0", port=5000, debug=False)

# import eventlet
# eventlet.monkey_patch()

# from flask import Flask, render_template, request, jsonify
# import json
# import os
# import threading
# from flask_socketio import SocketIO
# import paho.mqtt.client as mqtt
# import speech_recognition as sr
# import time

# app = Flask(__name__, template_folder="templates", static_folder="static")
# app.config['SECRET_KEY'] = 'a_very_secret_and_random_key_for_security'
# # We don't need SocketIO for sensor data anymore, but we'll leave it in case it's used elsewhere.
# socketio = SocketIO(app, async_mode='eventlet', cors_allowed_origins="*")

# # --- Define the file path for sharing sensor data ---
# SENSOR_DATA_FILE = 'latest_sensor_data.json'

# # --- Initialize the file with empty JSON to prevent errors on first read ---
# with open(SENSOR_DATA_FILE, 'w') as f:
#     json.dump({}, f)

# # ------------------- MQTT CONFIG -------------------
# MQTT_BROKER_URL = "450a2a0e66c34794aac4e8ff837827d2.s1.eu.hivemq.cloud"
# MQTT_BROKER_PORT = 8883
# MQTT_USERNAME = "lofhost"
# MQTT_PASSWORD = "LOF@123g"
# MQTT_COMMAND_TOPIC = "home/room/command"
# MQTT_SENSOR_TOPIC = "home/room/sensors"

# mqtt_client = mqtt.Client()

# def on_connect(client, userdata, flags, rc):
#     if rc == 0:
#         print("Connected to MQTT Broker!")
#         client.subscribe(MQTT_SENSOR_TOPIC)
#     else:
#         print(f"Failed to connect to MQTT, return code {rc}\n")

# def on_message(client, userdata, msg):
#     payload = msg.payload.decode()
#     print(f"Received message from topic {msg.topic}: {payload}")
#     try:
#         # ** THE FIX: Write the latest data to a shared file **
#         sensor_data = json.loads(payload)
#         with open(SENSOR_DATA_FILE, 'w') as f:
#             json.dump(sensor_data, f)
#         print(f"Successfully wrote sensor data to {SENSOR_DATA_FILE}")
#     except Exception as e:
#         print(f"Error processing MQTT message or writing to file: {e}")

# def mqtt_thread_function():
#     mqtt_client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
#     mqtt_client.on_connect = on_connect
#     mqtt_client.on_message = on_message
#     mqtt_client.tls_set(tls_version=mqtt.ssl.PROTOCOL_TLS)
    
#     while True:
#         try:
#             print("Attempting to connect to MQTT broker...")
#             mqtt_client.connect(MQTT_BROKER_URL, MQTT_BROKER_PORT, 60)
#             mqtt_client.loop_forever()
#         except Exception as e:
#             print(f"MQTT connection failed: {e}. Retrying in 5 seconds...")
#             time.sleep(5)

# mqtt_thread = threading.Thread(target=mqtt_thread_function, daemon=True)
# mqtt_thread.start()

# if not os.path.exists("temp_audio"):
#     os.makedirs("temp_audio")

# # ---------------- COMMAND SENDER ----------------
# last_command_sent = None
# def send_command_async(command: int):
#     global last_command_sent
#     if command == last_command_sent: return
#     try:
#         mqtt_client.publish(MQTT_COMMAND_TOPIC, str(command))
#         print(f"Published command '{command}' to topic '{MQTT_COMMAND_TOPIC}'")
#     except Exception as e:
#         print(f"Failed to publish to MQTT: {e}")
#     last_command_sent = command

# # --- Endpoints ---
# @app.route('/send_command', methods=['POST'])
# def send_command():
#     send_command_async(int(request.form.get("command", 1)))
#     return "Command sent!"

# @app.route('/gesture_command', methods=['POST'])
# def gesture_command():
#     action = request.get_json().get('action')
#     if action == 'ON': send_command_async(1)
#     elif action == 'OFF': send_command_async(0)
#     global last_command_sent
#     last_command_sent = None
#     return jsonify({"status": "gesture command received"})

# @app.route('/process_audio', methods=['POST'])
# def process_audio():
#     if 'audio_data' not in request.files: return jsonify({"error": "No audio file found"}), 400
#     audio_file = request.files['audio_data']
#     filepath = os.path.join("temp_audio", "recording.wav")
#     audio_file.save(filepath)
#     text = "Could not recognize audio."
#     try:
#         recognizer = sr.Recognizer()
#         with sr.AudioFile(filepath) as source:
#             audio_data = recognizer.record(source)
#             text = recognizer.recognize_google(audio_data)
#             print(f"Recognized: {text}")
#             if "on" in text.lower(): send_command_async(1)
#             elif "off" in text.lower(): send_command_async(0)
#     except Exception as e:
#         text = f"An error occurred: {e}"
#     finally:
#         if os.path.exists(filepath): os.remove(filepath)
#     return jsonify({"text": text})

# # ** THE FIX: This endpoint now reads from the shared file **
# @app.route('/get_initial_data', methods=['GET'])
# def get_initial_data():
#     try:
#         with open(SENSOR_DATA_FILE, 'r') as f:
#             data = json.load(f)
#             return jsonify(data)
#     except (FileNotFoundError, json.JSONDecodeError):
#         # If file doesn't exist or is empty/corrupt, return an empty object
#         return jsonify({})

# @app.route('/')
# def home(): 
#     return render_template("index.html")

# # ---------------- MAIN ----------------
# if __name__ == '__main__':
#     socketio.run(app, host="0.0.0.0", port=5000, debug=False)



#above code works perfectly for sensors now resolving the communication problem from the command 



import eventlet
eventlet.monkey_patch()

from flask import Flask, render_template, request, jsonify
import json
import os
import threading
from flask_socketio import SocketIO
import paho.mqtt.client as mqtt
import speech_recognition as sr
import time # Make sure time is imported

app = Flask(__name__, template_folder="templates", static_folder="static")
socketio = SocketIO(app, async_mode='eventlet', cors_allowed_origins="*")

# --- Define the file path for sharing sensor data ---
SENSOR_DATA_FILE = 'latest_sensor_data.json'
with open(SENSOR_DATA_FILE, 'w') as f:
    json.dump({}, f)

# ------------------- MQTT CONFIG -------------------
MQTT_BROKER_URL = "450a2a0e66c34794aac4e8ff837827d2.s1.eu.hivemq.cloud"
MQTT_BROKER_PORT = 8883
MQTT_USERNAME = "lofhost"
MQTT_PASSWORD = "LOF@123g"
MQTT_COMMAND_TOPIC = "home/room/command"
MQTT_SENSOR_TOPIC = "home/room/sensors"

# ------------------- MQTT LISTENER (for sensor data) -------------------
listener_mqtt_client = mqtt.Client()

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("Listener client connected to MQTT Broker!")
        client.subscribe(MQTT_SENSOR_TOPIC)
    else:
        print(f"Listener client failed to connect, return code {rc}\n")

def on_message(client, userdata, msg):
    payload = msg.payload.decode()
    print(f"Received message from topic {msg.topic}: {payload}")
    try:
        sensor__data = json.loads(payload)
        with open(SENSOR_DATA_FILE, 'w') as f:
            json.dump(sensor_data, f)
        print(f"Successfully wrote sensor data to {SENSOR_DATA_FILE}")
    except Exception as e:
        print(f"Error processing MQTT message or writing to file: {e}")

def mqtt_listener_thread():
    listener_mqtt_client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
    listener_mqtt_client.on_connect = on_connect
    listener_mqtt_client.on_message = on_message
    listener_mqtt_client.tls_set(tls_version=mqtt.ssl.PROTOCOL_TLS)
    while True:
        try:
            print("Attempting to connect MQTT listener client...")
            listener_mqtt_client.connect(MQTT_BROKER_URL, MQTT_BROKER_PORT, 60)
            listener_mqtt_client.loop_forever()
        except Exception as e:
            print(f"MQTT listener connection failed: {e}. Retrying in 2 seconds...")
            time.sleep(2)

mqtt_thread = threading.Thread(target=mqtt_listener_thread, daemon=True)
mqtt_thread.start()


# --- THE FINAL ROBUST FIX FOR SENDING COMMANDS ---
def send_command_robust(command: int):
    """
    Creates a new, short-lived client that waits for the message to send
    before disconnecting. This is the definitive fix.
    """
    try:
        print(f"Attempting to send command: {command}")
        publisher_client = mqtt.Client()
        publisher_client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
        publisher_client.tls_set(tls_version=mqtt.ssl.PROTOCOL_TLS)
        
        publisher_client.connect(MQTT_BROKER_URL, MQTT_BROKER_PORT, 60)

        # ** THE FIX IS HERE **
        # 1. Start a non-blocking network loop
        publisher_client.loop_start()

        # 2. Publish the message
        result = publisher_client.publish(MQTT_COMMAND_TOPIC, str(command))
        # Wait for the message to be sent
        result.wait_for_publish() 
        print(f"Publish result: {result.rc}. Message for command '{command}' was sent.")
        
        # 3. Stop the loop and disconnect
        publisher_client.loop_stop()
        publisher_client.disconnect()
        print("Publisher client disconnected.")

    except Exception as e:
        print(f"FAILED to publish command to MQTT: {e}")


# --- Create temp audio directory ---
if not os.path.exists("temp_audio"):
    os.makedirs("temp_audio")

# ---------------- FLASK ENDPOINTS ----------------
@app.route('/send_command', methods=['POST'])
def send_command():
    command_val = int(request.form.get("command", 1))
    send_command_robust(command_val)
    return "Command sent!"

@app.route('/gesture_command', methods=['POST'])
def gesture_command():
    action = request.get_json().get('action')
    if action == 'ON':
        send_command_robust(1)
    elif action == 'OFF':
        send_command_robust(0)
    return jsonify({"status": "gesture command received"})

@app.route('/process_audio', methods=['POST'])
def process_audio():
    if 'audio_data' not in request.files: return jsonify({"error": "No audio file found"}), 400
    audio_file = request.files['audio_data']
    filepath = os.path.join("temp_audio", "recording.wav")
    audio_file.save(filepath)
    text = "Could not recognize audio."
    try:
        recognizer = sr.Recognizer()
        with sr.AudioFile(filepath) as source:
            audio_data = recognizer.record(source)
            text = recognizer.recognize_google(audio_data)
            print(f"Recognized: {text}")
            if "on" in text.lower():
                send_command_robust(1)
            elif "off" in text.lower():
                send_command_robust(0)
    except Exception as e:
        text = f"An error occurred: {e}"
    finally:
        if os.path.exists(filepath): os.remove(filepath)
    return jsonify({"text": text})

@app.route('/get_initial_data', methods=['GET'])
def get_initial_data():
    try:
        with open(SENSOR_DATA_FILE, 'r') as f:
            data = json.load(f)
            return jsonify(data)
    except (FileNotFoundError, json.JSONDecodeError):
        return jsonify({})

@app.route('/')
def home(): 
    return render_template("index.html")

# ---------------- MAIN ----------------
if __name__ == '__main__':
    socketio.run(app, host="0.0.0.0", port=5000, debug=False)