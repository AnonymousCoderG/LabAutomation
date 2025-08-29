from flask import Flask, request, jsonify, render_template, Response
import requests
import threading
import cv2
import time
import mediapipe as mp
from collections import deque, Counter
import speech_recognition as sr
import os

app = Flask(__name__, template_folder="templates", static_folder="static")

# Create a temporary directory for audio uploads if it doesn't exist
if not os.path.exists("temp_audio"):
    os.makedirs("temp_audio")

# ---------------- ESP32 CONFIG ----------------
ESP32_IP = "http://192.168.1.33"
ESP32_COMMAND_ENDPOINT = f"{ESP32_IP}/command"

# ---------------- SENSOR DATA STORAGE ----------------
latest_sensor_data = {}

# ---------------- COMMAND SENDER ----------------
last_command_sent = None
def send_command_async(command: int):
    global last_command_sent
    if command == last_command_sent:
        print(f"Skipping duplicate command {command}")
        return

    def worker():
        try:
            response = requests.post(
                ESP32_COMMAND_ENDPOINT, data=str(command), timeout=5
            )
            print(f"Sent command {command} → ESP32, Response: {response.text}")
        except Exception as e:
            print(f"Command send failed: {e}")

    last_command_sent = command
    threading.Thread(target=worker, daemon=True).start()

@app.route('/send_command', methods=['POST'])
def send_command():
    command = int(request.form.get("command", 1))
    send_command_async(command)
    return f"Command {command} sent!"

# ---------------- SENSOR ENDPOINT ----------------
@app.route('/sensor', methods=['POST'])
def sensor():
    global latest_sensor_data
    data = request.get_json()
    print("Received data from ESP:", data)
    if "isRaining" in data:
        data["isRaining"] = "Yes" if str(data["isRaining"]) in ["1", "true", "True"] else "No"
    if "fireDetected" in data:
        data["fireDetected"] = "Yes" if str(data["fireDetected"]) in ["1", "true", "True"] else "No"
    latest_sensor_data = data
    return jsonify({"status": "ok"})

@app.route('/get_sensor_data', methods=['GET'])
def get_sensor_data():
    return jsonify(latest_sensor_data)

# ---------------- CAMERA AND MEDIAPIPE SETUP ----------------
cap = None
try:
    cap = cv2.VideoCapture(0)
except Exception as e:
    print(f"Could not initialize camera: {e}")

latest_frame = None
latest_mediapipe_results = None
frame_lock = threading.Lock()
mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils
hands = mp_hands.Hands(max_num_hands=2, min_detection_confidence=0.6, min_tracking_confidence=0.6)
TIP_IDS = [4, 8, 12, 16, 20]

def finger_states(landmarks, handed_label):
    fingers = [0, 0, 0, 0, 0]
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

WINDOW, REQUIRED_FRACTION = 5, 0.6
action_window = deque(maxlen=WINDOW)
last_stable_action = ''
last_detect_time = 0.0

def capture_and_process_loop():
    global latest_frame, latest_mediapipe_results
    if not cap:
        print("Camera not available. Gesture recognition thread will not run.")
        return
    while True:
        try:
            ok, frame = cap.read()
            if not ok:
                print("Failed to read frame from camera. Exiting camera thread.")
                break
            
            frame = cv2.resize(frame, (640, 480))
            frame_flipped = cv2.flip(frame, 1)
            rgb_frame = cv2.cvtColor(frame_flipped, cv2.COLOR_BGR2RGB)
            results = hands.process(rgb_frame)
            
            with frame_lock:
                latest_frame = frame_flipped.copy()
                latest_mediapipe_results = results
            time.sleep(0.01)
        except Exception as e:
            print(f"Error in capture loop: {e}")
            break

def gesture_detection_logic_loop():
    global last_stable_action, last_detect_time
    while True:
        if latest_mediapipe_results is None:
            time.sleep(0.1)
            continue
        
        with frame_lock:
            results = latest_mediapipe_results

        per_hand_classes = []
        if results and results.multi_hand_landmarks and results.multi_handedness:
            for hand_lms, handed in zip(results.multi_hand_landmarks, results.multi_handedness):
                per_hand_classes.append(classify_hand(hand_lms.landmark, handed.classification[0].label))

        action_now = decide_action(per_hand_classes)
        action_window.append(action_now or '')
        
        counts = Counter(action_window)
        counts.pop('', None)
        
        stable_action = ''
        if counts:
            top_action, top_count = counts.most_common(1)[0]
            if top_count >= int(REQUIRED_FRACTION * len(action_window)):
                stable_action = top_action

        if stable_action and stable_action != last_stable_action:
            last_stable_action = stable_action
            last_detect_time = time.time()
            if stable_action == "All Devices ON": send_command_async(1)
            elif stable_action == "All Devices OFF": send_command_async(0)
        
        time.sleep(0.02)

def generate_frames():
    while True:
        with frame_lock:
            if latest_frame is None:
                # If camera fails, generate a placeholder image
                placeholder = cv2.imencode('.jpg', cv2.UMat(240, 320, cv2.CV_8UC3))[1].tobytes()
                yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + placeholder + b'\r\n')
                time.sleep(1)
                continue
            frame_to_stream = latest_frame.copy()
            results_to_draw = latest_mediapipe_results
        
        if results_to_draw and results_to_draw.multi_hand_landmarks:
            for hand_lms in results_to_draw.multi_hand_landmarks:
                mp_drawing.draw_landmarks(frame_to_stream, hand_lms, mp_hands.HAND_CONNECTIONS)
        
        if time.time() - last_detect_time <= 1.0 and last_stable_action:
            cv2.putText(frame_to_stream, last_stable_action, (40, 440), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 0, 255), 3)
        
        ret, buffer = cv2.imencode('.jpg', frame_to_stream, [cv2.IMWRITE_JPEG_QUALITY, 90])
        if ret:
            yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')

# --- VOICE CONTROL (REWRITTEN TO REMOVE PYAUDIO DEPENDENCY) ---
recognizer = sr.Recognizer()

@app.route('/process_audio', methods=['POST'])
def process_audio():
    """Receives audio file from browser, processes it, and returns text."""
    if 'audio_data' not in request.files:
        return jsonify({"error": "No audio file found"}), 400

    audio_file = request.files['audio_data']
    
    # Save the file temporarily
    filepath = os.path.join("temp_audio", "recording.wav")
    audio_file.save(filepath)

    text = "Could not recognize audio."
    try:
        # Use SpeechRecognition to process the AUDIO FILE
        with sr.AudioFile(filepath) as source:
            audio_data = recognizer.record(source)
            text = recognizer.recognize_google(audio_data)
            print(f"Recognized: {text}")

            # Perform actions based on recognized text
            if "on" in text.lower():
                send_command_async(1)
            elif "off" in text.lower():
                send_command_async(0)

    except sr.UnknownValueError:
        text = "Google Speech Recognition could not understand audio"
    except sr.RequestError as e:
        text = f"Could not request results from Google; {e}"
    except Exception as e:
        text = f"An error occurred: {e}"
    finally:
        # Clean up the temporary file
        if os.path.exists(filepath):
            os.remove(filepath)

    return jsonify({"text": text})

# ---------------- ROUTES ----------------
@app.route('/')
def home(): 
    return render_template("index.html")

@app.route('/video_feed')
def video_feed(): 
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

# ---------------- MAIN ----------------
if __name__ == '__main__':
    processing_thread = threading.Thread(target=capture_and_process_loop, daemon=True)
    processing_thread.start()

    gesture_thread = threading.Thread(target=gesture_detection_logic_loop, daemon=True)
    gesture_thread.start()
    
    app.run(host="0.0.0.0", port=5000, debug=False, threaded=True)