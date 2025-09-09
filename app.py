# app.py

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
# Topic for general commands like the fan
MQTT_COMMAND_TOPIC = "home/room/command"
# NEW: A separate topic just for gate commands
MQTT_GATE_COMMAND_TOPIC = "home/room/gate"
# Topic for receiving sensor data
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
    # This section is unchanged, it only handles incoming sensor data
    payload = msg.payload.decode()
    print(f"Received message from topic {msg.topic}: {payload}")
    try:
        sensor_data = json.loads(payload)
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
            print(f"MQTT listener connection failed: {e}. Retrying in 5 seconds...")
            time.sleep(5)

mqtt_thread = threading.Thread(target=mqtt_listener_thread, daemon=True)
mqtt_thread.start()

# --- UPDATED Robust command sender ---
# Now it can send any command (as a string) to any topic
def send_command_robust(topic: str, command: str):
    """
    Sends a command string to a specified MQTT topic.
    
    Args:
        topic (str): The MQTT topic to publish to.
        command (str): The message/command to send.
    """
    try:
        print(f"Attempting to send command '{command}' to topic '{topic}'")
        publisher_client = mqtt.Client()
        publisher_client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
        publisher_client.tls_set(tls_version=mqtt.ssl.PROTOCOL_TLS)
        publisher_client.connect(MQTT_BROKER_URL, MQTT_BROKER_PORT, 60)
        publisher_client.loop_start()
        result = publisher_client.publish(topic, command)
        result.wait_for_publish()
        print(f"Publish result: {result.rc}. Message for command '{command}' sent to '{topic}'.")
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
    # This endpoint for UI buttons is updated to use the new function
    command_val = request.form.get("command", "1")
    send_command_robust(MQTT_COMMAND_TOPIC, command_val)
    return "Command sent!"

@app.route('/gesture_command', methods=['POST'])
def gesture_command():
    # This endpoint for FAN gestures is updated to use the new function
    action = request.get_json().get('action')
    if action == 'ON':
        send_command_robust(MQTT_COMMAND_TOPIC, "1")  # Send "1" for fan on
    elif action == 'OFF':
        send_command_robust(MQTT_COMMAND_TOPIC, "0")  # Send "0" for fan off
    return jsonify({"status": "fan gesture command received"})

# --- NEW ENDPOINT FOR GATE GESTURES ---
@app.route('/gate_gesture_command', methods=['POST'])
def gate_gesture_command():
    """
    Handles gate control based on single-hand gestures.
    Your frontend should send:
    - {"action": "OPEN_GATE"} for one hand open
    - {"action": "CLOSE_GATE"} for one hand closed
    """
    action = request.get_json().get('action')
    if action == 'OPEN_GATE':
        # Send a clear "OPEN" command to the dedicated gate topic
        send_command_robust(MQTT_GATE_COMMAND_TOPIC, "OPEN")
        return jsonify({"status": "OPEN_GATE command sent"})
    elif action == 'CLOSE_GATE':
        # Send a clear "CLOSE" command to the dedicated gate topic
        send_command_robust(MQTT_GATE_COMMAND_TOPIC, "CLOSE")
        return jsonify({"status": "CLOSE_GATE command sent"})
    return jsonify({"status": "unknown gate action"}), 400


@app.route('/process_audio', methods=['POST'])
def process_audio():
    if 'audio_data' not in request.files:
        return jsonify({"error": "No audio file found"}), 400
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
            
            # Fan voice commands (updated to use the new function)
            if "turn on the fan" in processed_text:
                print("FAN ON command recognized.")
                send_command_robust(MQTT_COMMAND_TOPIC, "1")
            elif "turn off the fan" in processed_text:
                print("FAN OFF command recognized.")
                send_command_robust(MQTT_COMMAND_TOPIC, "0")
            # Gate voice commands
            elif "open the gate" in processed_text:
                print("GATE OPEN command recognized.")
                send_command_robust(MQTT_GATE_COMMAND_TOPIC, "OPEN")
            elif "close the gate" in processed_text:
                print("GATE CLOSE command recognized.")
                send_command_robust(MQTT_GATE_COMMAND_TOPIC, "CLOSE")
            
    except Exception as e:
        text = f"An error occurred: {e}"
        print(text)
    finally:
        if os.path.exists(filepath):
            os.remove(filepath)
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