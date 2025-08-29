from flask import Flask, request, jsonify, render_template
import requests
import threading
import speech_recognition as sr
import os

app = Flask(__name__, template_folder="templates", static_folder="static")

# Create a temporary directory for audio uploads if it doesn't exist
if not os.path.exists("temp_audio"):
    os.makedirs("temp_audio")

# ---------------- ESP32 CONFIG ----------------
# --- FIX: Added 'http://' to the IP address to make it a valid URL ---
ESP32_IP = "http://192.168.1.62" 
ESP32_COMMAND_ENDPOINT = f"{ESP32_IP}/command"

# ---------------- SENSOR DATA STORAGE ----------------
latest_sensor_data = {}

# ---------------- COMMAND SENDER ----------------
last_command_sent = None
def send_command_async(command: int):
    global last_command_sent
    # Debounce: Don't send the same command twice in a row
    if command == last_command_sent:
        print(f"Skipping duplicate command {command}")
        return

    def worker():
        try:
            # This request will now work correctly
            response = requests.post(
                ESP32_COMMAND_ENDPOINT, data=str(command), timeout=5
            )
            print(f"Sent command {command} → ESP32, Response: {response.text}")
        except Exception as e:
            print(f"Command send failed: {e}")

    last_command_sent = command
    threading.Thread(target=worker, daemon=True).start()

# --- Endpoint for MANUAL buttons ---
@app.route('/send_command', methods=['POST'])
def send_command():
    command = int(request.form.get("command", 1))
    send_command_async(command)
    return f"Command {command} sent!"

# --- Endpoint to receive GESTURE commands from the browser ---
@app.route('/gesture_command', methods=['POST'])
def gesture_command():
    data = request.get_json()
    action = data.get('action')
    print(f"Received gesture action: {action}")
    if action == 'ON':
        send_command_async(1)
    elif action == 'OFF':
        send_command_async(0)
    # Reset last_command_sent to allow alternating gesture commands
    global last_command_sent
    last_command_sent = None 
    return jsonify({"status": "gesture command received"})

# ---------------- SENSOR ENDPOINT ----------------
@app.route('/sensor', methods=['POST'])
def sensor():
    global latest_sensor_data
    data = request.get_json()
    if "isRaining" in data:
        data["isRaining"] = "Yes" if str(data["isRaining"]) in ["1", "true", "True"] else "No"
    if "fireDetected" in data:
        data["fireDetected"] = "Yes" if str(data["fireDetected"]) in ["1", "true", "True"] else "No"
    latest_sensor_data = data
    return jsonify({"status": "ok"})

@app.route('/get_sensor_data', methods=['GET'])
def get_sensor_data():
    return jsonify(latest_sensor_data)

# --- VOICE CONTROL (From uploaded audio file) ---
recognizer = sr.Recognizer()

@app.route('/process_audio', methods=['POST'])
def process_audio():
    if 'audio_data' not in request.files:
        return jsonify({"error": "No audio file found"}), 400
    audio_file = request.files['audio_data']
    filepath = os.path.join("temp_audio", "recording.wav")
    audio_file.save(filepath)
    text = "Could not recognize audio."
    try:
        with sr.AudioFile(filepath) as source:
            audio_data = recognizer.record(source)
            text = recognizer.recognize_google(audio_data)
            print(f"Recognized: {text}")
            if "on" in text.lower():
                send_command_async(1)
            elif "off" in text.lower():
                send_command_async(0)
    except Exception as e:
        text = f"An error occurred: {e}"
        print(f"Speech recognition error: {e}")
    finally:
        if os.path.exists(filepath):
            os.remove(filepath)
    return jsonify({"text": text})

# ---------------- ROUTES ----------------
@app.route('/')
def home(): 
    return render_template("index.html")

# ---------------- MAIN ----------------
if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=False, threaded=True)