from flask import Flask, request, jsonify, render_template, Response
import requests
import threading
import cv2
import time
import mediapipe as mp
from collections import deque, Counter
import speech_recognition as sr

app = Flask(__name__, template_folder="templates", static_folder="static")

# ---------------- ESP32 CONFIG ----------------
ESP32_IP = "http://192.168.1.33"
ESP32_COMMAND_ENDPOINT = f"{ESP32_IP}/command"

# ---------------- SENSOR DATA STORAGE ----------------
latest_sensor_data = {}

# ---------------- COMMAND SENDER ----------------
last_command_sent = None
def send_command_async(command: int):
    # (This function is unchanged)
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
    # (This function is unchanged)
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

# ---------------- CAMERA AND MEDIAPIPE SETUP (MODIFIED FOR PERFORMANCE) ----------------
cap = cv2.VideoCapture(0)

# ---- NEW: Global variables for sharing frames AND processed results ----
latest_frame = None
latest_mediapipe_results = None # <-- IMPORTANT NEW VARIABLE
frame_lock = threading.Lock()
# -----------------------------------------------------------------------

mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils
hands = mp_hands.Hands(max_num_hands=2, min_detection_confidence=0.6, min_tracking_confidence=0.6)
TIP_IDS = [4, 8, 12, 16, 20]

def finger_states(landmarks, handed_label):
    # (This function is unchanged)
    fingers = [0, 0, 0, 0, 0]
    thumb_tip, thumb_ip = landmarks[TIP_IDS[0]], landmarks[TIP_IDS[0] - 1]
    fingers[0] = 1 if (thumb_tip.x < thumb_ip.x if handed_label == 'Right' else thumb_tip.x > thumb_ip.x) else 0
    for i, tip_id in enumerate(TIP_IDS[1:], start=1):
        fingers[i] = 1 if landmarks[tip_id].y < landmarks[tip_id - 2].y else 0
    return fingers

def classify_hand(landmarks, handed_label):
    # (This function is unchanged)
    up = sum(finger_states(landmarks, handed_label))
    if up >= 4: return 'Open'
    if up == 0: return 'Fist'
    return 'Other'

def decide_action(per_hand_classes):
    # (This function is unchanged)
    if len(per_hand_classes) != 2: return ''
    if per_hand_classes.count('Open') == 2: return 'All Devices ON'
    if per_hand_classes.count('Fist') == 2: return 'All Devices OFF'
    return ''

WINDOW, REQUIRED_FRACTION = 5, 0.6
action_window = deque(maxlen=WINDOW)
last_stable_action = ''
last_detect_time = 0.0

# ---- MODIFIED: The capture thread now resizes the frame for performance ----
def capture_and_process_loop():
    """Reads frames, resizes them, processes with MediaPipe, and stores both frame and results."""
    global latest_frame, latest_mediapipe_results
    while True:
        ok, frame = cap.read()
        if not ok:
            print("Failed to read frame from camera. Exiting camera thread.")
            break
        
        # ---- OPTIMIZATION: Resize frame to reduce processing load ----
        frame = cv2.resize(frame, (640, 480))
        
        # --- Do the heavy processing here, only once ---
        frame_flipped = cv2.flip(frame, 1)
        rgb_frame = cv2.cvtColor(frame_flipped, cv2.COLOR_BGR2RGB)
        results = hands.process(rgb_frame)
        
        # --- Store the results and the frame safely ---
        with frame_lock:
            latest_frame = frame_flipped.copy()
            latest_mediapipe_results = results

        # Sleep to prevent 100% CPU usage, but can be shorter now
        time.sleep(0.01)

# ---- MODIFIED: Gesture detection is now much lighter ----
def gesture_detection_logic_loop():
    """Uses the pre-processed results to determine actions."""
    global last_stable_action, last_detect_time
    while True:
        # Wait until results are available
        if latest_mediapipe_results is None:
            time.sleep(0.1)
            continue
        
        with frame_lock:
            # Safely get a reference to the latest results
            results = latest_mediapipe_results

        # ---- NO MORE cv2 or hands.process() calls HERE ----
        
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
        
        # This loop can be slightly slower as it's just logic
        time.sleep(0.02)

# ---- MODIFIED: Video streaming is now MUCH lighter and faster ----
def generate_frames():
    """Streams frames, drawing pre-processed landmarks."""
    while True:
        with frame_lock:
            # Safely get a copy of the latest frame and results
            if latest_frame is None:
                time.sleep(0.1)
                continue
            frame_to_stream = latest_frame.copy()
            results_to_draw = latest_mediapipe_results
        
        # ---- NO MORE cv2 or hands.process() calls HERE ----

        # Draw the pre-calculated landmarks
        if results_to_draw and results_to_draw.multi_hand_landmarks:
            for hand_lms in results_to_draw.multi_hand_landmarks:
                mp_drawing.draw_landmarks(frame_to_stream, hand_lms, mp_hands.HAND_CONNECTIONS)
        
        if time.time() - last_detect_time <= 1.0 and last_stable_action:
            cv2.putText(frame_to_stream, last_stable_action, (40, 440), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 0, 255), 3)
        
        # ---- OPTIMIZATION: Set JPEG quality for faster encoding ----
        ret, buffer = cv2.imencode('.jpg', frame_to_stream, [cv2.IMWRITE_JPEG_QUALITY, 90])
        
        if ret:
            yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')

# ---------------- VOICE CONTROL (Unchanged) ----------------
recognizer = sr.Recognizer()
# ... (rest of the voice control code is unchanged) ...
def listen_in_background():
    global audio_data
    try:
        with sr.Microphone() as source:
            recognizer.adjust_for_ambient_noise(source, duration=1)
            print("Listening...")
            audio_data = recognizer.listen(source, timeout=None, phrase_time_limit=None)
            print("Recording finished.")
    except Exception as e:
        print(f"Error in listen_in_background: {e}")
        audio_data = None
@app.route('/start', methods=['POST'])
def start():
    global recording_thread
    audio_data = None
    recording_thread = threading.Thread(target=listen_in_background)
    recording_thread.start()
    return jsonify({"status": "Recording started"})
@app.route('/stop', methods=['POST'])
def stop():
    global audio_data
    if recording_thread is not None:
        recording_thread.join(timeout=1)
    text = "No audio recorded or recognized."
    if audio_data:
        try:
            text = recognizer.recognize_google(audio_data)
            print(f"Recognized: {text}")
            if "on" in text.lower(): send_command_async(1)
            elif "off" in text.lower(): send_command_async(0)
        except Exception as e:
            text = f"Could not recognize audio; {e}"
    return jsonify({"text": text})

# ---------------- ROUTES ----------------
@app.route('/')
def home(): return render_template("index.html")

@app.route('/video_feed')
def video_feed(): return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

# ---------------- MAIN ----------------
if __name__ == '__main__':
    # ---- MODIFIED: Start the new, combined camera and processing thread ----
    processing_thread = threading.Thread(target=capture_and_process_loop, daemon=True)
    processing_thread.start()

    # Start the separate (and now very light) gesture logic thread
    gesture_thread = threading.Thread(target=gesture_detection_logic_loop, daemon=True)
    gesture_thread.start()
    
    app.run(host="0.0.0.0", port=5000, debug=False, threaded=True)