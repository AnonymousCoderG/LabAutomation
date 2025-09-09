# # app.py (Corrected)

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
# socketio = SocketIO(app, async_mode='eventlet', cors_allowed_origins="*")

# # --- Define the file path for sharing sensor data ---
# SENSOR_DATA_FILE = 'latest_sensor_data.json'
# with open(SENSOR_DATA_FILE, 'w') as f:
#     json.dump({}, f)

# # ------------------- MQTT CONFIG -------------------
# MQTT_BROKER_URL = "450a2a0e66c34794aac4e8ff837827d2.s1.eu.hivemq.cloud"
# MQTT_BROKER_PORT = 8883
# MQTT_USERNAME = "lofhost"
# MQTT_PASSWORD = "LOF@123g"

# # --- TOPIC DEFINITIONS ---
# MQTT_COMMAND_TOPIC = "home/room/command"
# MQTT_GATE_COMMAND_TOPIC = "home/room/gate"
# MQTT_SENSOR_TOPIC = "home/room/sensors"

# # ------------------- MQTT LISTENER (for sensor data) -------------------
# listener_mqtt_client = mqtt.Client()

# def on_connect(client, userdata, flags, rc):
#     if rc == 0:
#         print("Listener client connected to MQTT Broker!")
#         client.subscribe(MQTT_SENSOR_TOPIC)
#     else:
#         print(f"Listener client failed to connect, return code {rc}\n")

# def on_message(client, userdata, msg):
#     payload = msg.payload.decode()
#     print(f"Received message from topic {msg.topic}: {payload}")
#     try:
#         sensor_data = json.loads(payload)
#         with open(SENSOR_DATA_FILE, 'w') as f:
#             json.dump(sensor_data, f)
#         print(f"Successfully wrote sensor data to {SENSOR_DATA_FILE}")
#     except Exception as e:
#         print(f"Error processing MQTT message or writing to file: {e}")

# # --- UPDATED: NON-BLOCKING MQTT LISTENER ---
# def mqtt_listener_setup():
#     """
#     Sets up and connects the MQTT client, then starts a non-blocking loop.
#     This is designed to be run once in a background thread.
#     """
#     listener_mqtt_client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
#     listener_mqtt_client.on_connect = on_connect
#     listener_mqtt_client.on_message = on_message
#     listener_mqtt_client.tls_set(tls_version=mqtt.ssl.PROTOCOL_TLS)
    
#     while True:
#         try:
#             print("Attempting to connect MQTT listener client...")
#             listener_mqtt_client.connect(MQTT_BROKER_URL, MQTT_BROKER_PORT, 60)
#             # Use loop_start() instead of loop_forever()
#             # loop_start() runs in a background thread and is non-blocking.
#             listener_mqtt_client.loop_start()
#             break # Exit the loop once connection is successful and loop has started
#         except Exception as e:
#             print(f"MQTT listener connection failed: {e}. Retrying in 5 seconds...")
#             time.sleep(5)

# # Start the MQTT listener setup in a daemon thread
# mqtt_thread = threading.Thread(target=mqtt_listener_setup, daemon=True)
# mqtt_thread.start()


# # --- Robust command sender (Unchanged) ---
# def send_command_robust(topic: str, command: str):
#     try:
#         print(f"Attempting to send command '{command}' to topic '{topic}'")
#         publisher_client = mqtt.Client()
#         publisher_client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
#         publisher_client.tls_set(tls_version=mqtt.ssl.PROTOCOL_TLS)
#         publisher_client.connect(MQTT_BROKER_URL, MQTT_BROKER_PORT, 60)
#         publisher_client.loop_start()
#         result = publisher_client.publish(topic, command)
#         result.wait_for_publish()
#         print(f"Publish result: {result.rc}. Message for command '{command}' sent to '{topic}'.")
#         publisher_client.loop_stop()
#         publisher_client.disconnect()
#         print("Publisher client disconnected.")
#     except Exception as e:
#         print(f"FAILED to publish command to MQTT: {e}")

# # --- Create temp audio directory (Unchanged) ---
# if not os.path.exists("temp_audio"):
#     os.makedirs("temp_audio")

# # ---------------- FLASK ENDPOINTS (Unchanged) ----------------
# @app.route('/send_command', methods=['POST'])
# def send_command():
#     command_val = request.form.get("command", "1")
#     send_command_robust(MQTT_COMMAND_TOPIC, command_val)
#     return "Command sent!"

# @app.route('/gesture_command', methods=['POST'])
# def gesture_command():
#     action = request.get_json().get('action')
#     if action == 'ON':
#         send_command_robust(MQTT_COMMAND_TOPIC, "1")
#     elif action == 'OFF':
#         send_command_robust(MQTT_COMMAND_TOPIC, "0")
#     return jsonify({"status": "fan gesture command received"})

# @app.route('/gate_gesture_command', methods=['POST'])
# def gate_gesture_command():
#     action = request.get_json().get('action')
#     if action == 'OPEN_GATE':
#         send_command_robust(MQTT_GATE_COMMAND_TOPIC, "OPEN")
#         return jsonify({"status": "OPEN_GATE command sent"})
#     elif action == 'CLOSE_GATE':
#         send_command_robust(MQTT_GATE_COMMAND_TOPIC, "CLOSE")
#         return jsonify({"status": "CLOSE_GATE command sent"})
#     return jsonify({"status": "unknown gate action"}), 400

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
#             processed_text = text.lower()
#             if "turn on the fan" in processed_text:
#                 print("FAN ON command recognized.")
#                 send_command_robust(MQTT_COMMAND_TOPIC, "1")
#             elif "turn off the fan" in processed_text:
#                 print("FAN OFF command recognized.")
#                 send_command_robust(MQTT_COMMAND_TOPIC, "0")
#             elif "open the gate" in processed_text:
#                 print("GATE OPEN command recognized.")
#                 send_command_robust(MQTT_GATE_COMMAND_TOPIC, "OPEN")
#             elif "close the gate" in processed_text:
#                 print("GATE CLOSE command recognized.")
#                 send_command_robust(MQTT_GATE_COMMAND_TOPIC, "CLOSE")
#     except Exception as e:
#         text = f"An error occurred: {e}"
#         print(text)
#     finally:
#         if os.path.exists(filepath):
#             os.remove(filepath)
#     return jsonify({"text": text})

# @app.route('/get_initial_data', methods=['GET'])
# def get_initial_data():
#     try:
#         with open(SENSOR_DATA_FILE, 'r') as f:
#             data = json.load(f)
#             return jsonify(data)
#     except (FileNotFoundError, json.JSONDecodeError):
#         return jsonify({})

# @app.route('/')
# def home():
#     return render_template("index.html")

# # ---------------- MAIN (Unchanged) ----------------
# if __name__ == '__main__':
#     socketio.run(app, host="[::]", port=5000, debug=False)


#app.py for lights 
# app.py (Corrected for Voice & Gesture Clarity)

import eventlet
eventlet.monkey_patch()

from flask import Flask, render_template, request, jsonify
import json
import os
import threading
from flask_socketio import SocketIO
import paho.mqtt.client as mqtt
import speech_recognition as sr
import time

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

# --- TOPIC DEFINITIONS ---
MQTT_COMMAND_TOPIC = "home/room/command"
MQTT_GATE_COMMAND_TOPIC = "home/room/gate"
MQTT_SENSOR_TOPIC = "home/room/sensors"
MQTT_LIGHT_COMMAND_TOPIC = "home/room/lights"

# ------------------- MQTT LISTENER (Correct & Unchanged) -------------------
listener_mqtt_client = mqtt.Client()
def on_connect(client, userdata, flags, rc):
    if rc == 0: print("Listener client connected to MQTT Broker!"); client.subscribe(MQTT_SENSOR_TOPIC)
    else: print(f"Listener client failed to connect, return code {rc}\n")
def on_message(client, userdata, msg):
    if msg.topic == MQTT_SENSOR_TOPIC:
        payload = msg.payload.decode()
        print(f"Received message from topic {msg.topic}: {payload}")
        try:
            sensor_data = json.loads(payload)
            with open(SENSOR_DATA_FILE, 'w') as f: json.dump(sensor_data, f)
        except Exception as e: print(f"Error processing MQTT message: {e}")
def mqtt_listener_setup():
    listener_mqtt_client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
    listener_mqtt_client.on_connect = on_connect
    listener_mqtt_client.on_message = on_message
    listener_mqtt_client.tls_set(tls_version=mqtt.ssl.PROTOCOL_TLS)
    while True:
        try:
            print("Attempting to connect MQTT listener client...")
            listener_mqtt_client.connect(MQTT_BROKER_URL, MQTT_BROKER_PORT, 60)
            listener_mqtt_client.loop_start()
            break
        except Exception as e:
            print(f"MQTT listener connection failed: {e}. Retrying in 5s..."); time.sleep(5)
mqtt_thread = threading.Thread(target=mqtt_listener_setup, daemon=True)
mqtt_thread.start()

# --- Robust command sender (Correct & Unchanged) ---
def send_command_robust(topic: str, command: str):
    try:
        print(f"Attempting to send command '{command}' to topic '{topic}'")
        publisher_client = mqtt.Client()
        publisher_client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
        publisher_client.tls_set(tls_version=mqtt.ssl.PROTOCOL_TLS)
        publisher_client.connect(MQTT_BROKER_URL, MQTT_BROKER_PORT, 60)
        publisher_client.loop_start()
        result = publisher_client.publish(topic, command)
        result.wait_for_publish()
        publisher_client.loop_stop()
        publisher_client.disconnect()
    except Exception as e: print(f"FAILED to publish command to MQTT: {e}")

if not os.path.exists("temp_audio"): os.makedirs("temp_audio")

# ---------------- FLASK ENDPOINTS (Unchanged) ----------------
@app.route('/send_command', methods=['POST'])
def send_command():
    command_val = request.form.get("command", "1")
    send_command_robust(MQTT_COMMAND_TOPIC, command_val)
    return "Command sent!"

@app.route('/gesture_command', methods=['POST'])
def gesture_command():
    action = request.get_json().get('action')
    if action == 'ON': send_command_robust(MQTT_COMMAND_TOPIC, "1")
    elif action == 'OFF': send_command_robust(MQTT_COMMAND_TOPIC, "0")
    return jsonify({"status": "fan gesture command received"})

@app.route('/gate_gesture_command', methods=['POST'])
def gate_gesture_command():
    action = request.get_json().get('action')
    if action == 'OPEN_GATE': send_command_robust(MQTT_GATE_COMMAND_TOPIC, "OPEN")
    elif action == 'CLOSE_GATE': send_command_robust(MQTT_GATE_COMMAND_TOPIC, "CLOSE")
    return jsonify({"status": "gate gesture command received"})

@app.route('/light_gesture_command', methods=['POST'])
def light_gesture_command():
    action = request.get_json().get('action')
    if action == 'LIGHTS_ON': send_command_robust(MQTT_LIGHT_COMMAND_TOPIC, "LIGHTS_ON")
    elif action == 'LIGHTS_OFF': send_command_robust(MQTT_LIGHT_COMMAND_TOPIC, "LIGHTS_OFF")
    return jsonify({"status": "light gesture command received"})

# --- UPDATED: VOICE PROCESSING FOR CLARITY ---
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
            processed_text = text.lower()
            
            # Use 'elif' to ensure only one command is triggered
            if "fan" in processed_text:
                if "on" in processed_text: send_command_robust(MQTT_COMMAND_TOPIC, "1")
                elif "off" in processed_text: send_command_robust(MQTT_COMMAND_TOPIC, "0")
            elif "gate" in processed_text:
                if "open" in processed_text: send_command_robust(MQTT_GATE_COMMAND_TOPIC, "OPEN")
                elif "close" in processed_text: send_command_robust(MQTT_GATE_COMMAND_TOPIC, "CLOSE")
            elif "light" in processed_text: # Catches "light" and "lights"
                if "on" in processed_text: send_command_robust(MQTT_LIGHT_COMMAND_TOPIC, "LIGHTS_ON")
                elif "off" in processed_text: send_command_robust(MQTT_LIGHT_COMMAND_TOPIC, "LIGHTS_OFF")
                
    except Exception as e: text = f"An error occurred: {e}"; print(text)
    finally:
        if os.path.exists(filepath): os.remove(filepath)
    return jsonify({"text": text})

@app.route('/get_initial_data', methods=['GET'])
def get_initial_data():
    try:
        with open(SENSOR_DATA_FILE, 'r') as f: data = json.load(f)
        return jsonify(data)
    except (FileNotFoundError, json.JSONDecodeError): return jsonify({})

@app.route('/')
def home(): return render_template("index.html")

if __name__ == '__main__':
    socketio.run(app, host="[::]", port=5000, debug=False)