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

from flask import Flask, request, jsonify, render_template, Response
import requests
import threading
import cv2
import time
import mediapipe as mp
from collections import deque, Counter
import speech_recognition as sr
import os
import json
import paho.mqtt.client as mqtt
import numpy as np

app = Flask(__name__, template_folder="templates", static_folder="static")

# ------------------- MQTT CONFIG -------------------
MQTT_BROKER_URL = "450a2a0e66c34794aac4e8ff837827d2.s1.eu.hivemq.cloud"
MQTT_BROKER_PORT = 8883
MQTT_USERNAME = "lofhost"
MQTT_PASSWORD = "LOF@123g"
MQTT_COMMAND_TOPIC = "home/room/command"
MQTT_SENSOR_TOPIC = "home/room/sensors"

# ------------------- GLOBAL VARIABLES -------------------
latest_sensor_data = {}
latest_frame = None
latest_mediapipe_results = None
frame_lock = threading.Lock()
cap = None # Will be initialized later

# --- Setup the MQTT Client ---
def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("Connected to MQTT Broker!")
        client.subscribe(MQTT_SENSOR_TOPIC)
    else:
        print(f"Failed to connect to MQTT, return code {rc}\n")

def on_message(client, userdata, msg):
    global latest_sensor_data
    payload = msg.payload.decode()
    print(f"Received message from topic {msg.topic}: {payload}")
    try:
        latest_sensor_data = json.loads(payload)
    except json.JSONDecodeError as e:
        print(f"Error decoding JSON from MQTT: {e}")

mqtt_client = mqtt.Client()
mqtt_client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
mqtt_client.on_connect = on_connect
mqtt_client.on_message = on_message
mqtt_client.tls_set(tls_version=mqtt.ssl.PROTOCOL_TLS)

def mqtt_thread_function():
    while True:
        try:
            print("Attempting to connect to MQTT broker...")
            mqtt_client.connect(MQTT_BROKER_URL, MQTT_BROKER_PORT, 60)
            mqtt_client.loop_forever()
        except Exception as e:
            print(f"MQTT connection failed: {e}. Retrying in 5 seconds...")
            time.sleep(5)

# ---------------- COMMAND SENDER (Uses MQTT) ----------------
last_command_sent = None
def send_command_async(command: int):
    global last_command_sent
    if command == last_command_sent: return
    try:
        mqtt_client.publish(MQTT_COMMAND_TOPIC, str(command))
        print(f"Published command '{command}' to topic '{MQTT_COMMAND_TOPIC}'")
    except Exception as e:
        print(f"Failed to publish to MQTT: {e}")
    last_command_sent = command

# --- CAMERA AND MEDIAPIPE SETUP (SERVER-SIDE) ---
try:
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        raise IOError("Cannot open webcam")
    print("Camera initialized successfully.")
    # Initialize MediaPipe only if camera is available
    mp_hands = mp.solutions.hands
    hands = mp_hands.Hands(max_num_hands=2, min_detection_confidence=0.6, min_tracking_confidence=0.6)
    mp_drawing = mp.solutions.drawing_utils
    TIP_IDS = [4, 8, 12, 16, 20]
    action_window = deque(maxlen=5)

except Exception as e:
    print("**********************************************")
    print(f"WARNING: Could not initialize camera: {e}")
    print("Gesture recognition will be disabled.")
    print("**********************************************")
    cap = None

# --- Gesture Recognition Logic ---
def finger_states(landmarks, handed_label):
    fingers = [0, 0, 0, 0, 0]
    if landmarks:
        thumb_tip, thumb_ip = landmarks[TIP_IDS[0]], landmarks[TIP_IDS[0] - 1]
        fingers[0] = 1 if (thumb_tip.x < thumb_ip.x if handed_label == 'Right' else thumb_tip.x > thumb_ip.x) else 0
        for i, tip_id in enumerate(TIP_IDS[1:], start=1):
            fingers[i] = 1 if landmarks[tip_id].y < landmarks[tip_id - 2].y else 0
    return fingers

def classify_hand(landmarks, handed_label):
    up = sum(finger_states(landmarks, handed_label))
    if up >= 4: return 'Open'
    if up == 0: return 'Fist'
    return 'Other'

def decide_action(per_hand_classes):
    if len(per_hand_classes) != 2: return ''
    if per_hand_classes.count('Open') == 2: return 'All Devices ON'
    if per_hand_classes.count('Fist') == 2: return 'All Devices OFF'
    return ''

# --- Background Threads for Video Processing ---
def capture_and_process_loop():
    global latest_frame, latest_mediapipe_results
    if not cap: return

    last_stable_action = ''
    last_detect_time = 0.0
    
    while True:
        ok, frame = cap.read()
        if not ok:
            print("Failed to read frame from camera.")
            break
        
        frame = cv2.resize(frame, (640, 480))
        frame_flipped = cv2.flip(frame, 1)
        rgb_frame = cv2.cvtColor(frame_flipped, cv2.COLOR_BGR2RGB)
        results = hands.process(rgb_frame)
        
        per_hand_classes = []
        if results.multi_hand_landmarks and results.multi_handedness:
            for hand_lms, handed in zip(results.multi_hand_landmarks, results.multi_handedness):
                mp_drawing.draw_landmarks(frame_flipped, hand_lms, mp_hands.HAND_CONNECTIONS)
                per_hand_classes.append(classify_hand(hand_lms.landmark, handed.classification[0].label))

        action_now = decide_action(per_hand_classes)
        action_window.append(action_now or '')
        
        counts = Counter(action_window)
        counts.pop('', None)
        
        stable_action = ''
        if counts:
            top_action, top_count = counts.most_common(1)[0]
            if top_count >= int(0.6 * len(action_window)):
                stable_action = top_action

        if stable_action and stable_action != last_stable_action:
            last_stable_action = stable_action
            last_detect_time = time.time()
            if stable_action == "All Devices ON": send_command_async(1)
            elif stable_action == "All Devices OFF": send_command_async(0)

        if time.time() - last_detect_time <= 1.0 and last_stable_action:
            cv2.putText(frame_flipped, last_stable_action, (40, 440), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 0, 255), 3)

        with frame_lock:
            latest_frame = frame_flipped.copy()
        
        time.sleep(0.01)

def generate_frames():
    while True:
        with frame_lock:
            if latest_frame is None:
                if not cap: # If camera failed to initialize
                    placeholder = np.zeros((360, 480, 3), dtype=np.uint8)
                    cv2.putText(placeholder, "Camera Not Available", (50, 180), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
                    ret, buffer = cv2.imencode('.jpg', placeholder)
                    frame_bytes = buffer.tobytes()
                    yield (b'--frame\r\n'
                           b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
                    time.sleep(1)
                    continue
                else: # If camera is just warming up
                    time.sleep(0.1)
                    continue
            
            ret, buffer = cv2.imencode('.jpg', latest_frame)
            if not ret:
                continue
            frame_bytes = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
        time.sleep(0.03) # Limit framerate to ~30fps to reduce CPU load

# ------------------- FLASK ROUTES -------------------
@app.route('/')
def home(): 
    return render_template("index.html")

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/get_sensor_data', methods=['GET'])
def get_sensor_data():
    return jsonify(latest_sensor_data)

@app.route('/send_command', methods=['POST'])
def send_command():
    send_command_async(int(request.form.get("command", 1)))
    return "Command sent!"

@app.route('/process_audio', methods=['POST'])
def process_audio():
    # This function is unchanged
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
            if "on" in text.lower(): send_command_async(1)
            elif "off" in text.lower(): send_command_async(0)
    except Exception as e:
        text = f"An error occurred: {e}"
    finally:
        if os.path.exists(filepath): os.remove(filepath)
    return jsonify({"text": text})

if __name__ == '__main__':
    # Start MQTT connection in a background thread
    mqtt_thread = threading.Thread(target=mqtt_thread_function, daemon=True)
    mqtt_thread.start()
    # Start video processing in a background thread
    video_thread = threading.Thread(target=capture_and_process_loop, daemon=True)
    video_thread.start()
    
    app.run(host="0.0.0.0", port=5000, debug=False)