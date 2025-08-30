/*
	Designed by: Alex Harris 
	Original Image: https://www.artstation.com/artwork/vBYdY
*/

// --- This section for the 3D house animation is unchanged ---
const b = document.body;
const h = document.querySelector("#h");
const leftPanel = document.querySelector(".left-panel");
const unit = 1.75;
let isRaining = false;
const a = document.querySelector("#a");
const block = document.querySelector("#block");
const mirrorContent = document.querySelector('.mirror-content');
const curiousContent = document.querySelector('.curious-content');

const moveFunc = (e) => {
    const rect = leftPanel.getBoundingClientRect();
    let x = (e.clientX - rect.left) / rect.width - 0.5;
    let y = (e.clientY - rect.top) / rect.height - 0.5;
    h.style.transform = `perspective(${400*unit}vmin) rotateX(${y*30+66}deg) rotateZ(${-x*420+40}deg) translateZ(${-14*unit}vmin)`;
};
const mouseDownFunc = () => b.addEventListener("mousemove", moveFunc);
const mouseUpFunc = () => b.removeEventListener("mousemove", moveFunc);
const playFunc = () => {
	h.classList.toggle("is-main-active");
	a.loop = true;
	if (a.paused) a.play();
	else { a.pause(); a.currentTime = 0; }
    mirrorContent.classList.toggle('is-hidden');
    curiousContent.classList.toggle('is-hidden');
};
leftPanel.addEventListener("mousedown", mouseDownFunc);
b.addEventListener("mouseup", mouseUpFunc);
block.addEventListener("click", playFunc);
// --- End 3D House Animation Logic ---


document.addEventListener('DOMContentLoaded', function() {
    // --- Get all DOM Elements ---
    const sensorDataDiv = document.getElementById('sensor-data');
    const turnOnButton = document.getElementById('turn-on');
    const turnOffButton = document.getElementById('turn-off');
    const startRecordingButton = document.getElementById('start-recording');
    const stopRecordingButton = document.getElementById('stop-recording');
    const voiceStatus = document.getElementById('voice-status');
    const mirrorSensorDiv = document.getElementById('mirror-sensor-data');
    const raindropContainer = document.getElementById('raindrop-container');
    const sunIcon = document.getElementById('sun-icon');
    const fireIcon = document.getElementById('fire-icon');
    const videoElement = document.getElementById('input-video');
    const canvasElement = document.getElementById('output-canvas');
    const canvasCtx = canvasElement.getContext('2d');

    // --- NEW: REAL-TIME SENSOR DATA WITH WEBSOCKETS ---
    // Establish connection to the WebSocket server
    const socket = io();

    socket.on('connect', () => {
        console.log('Connected to WebSocket server!');
    });

    // Listen for the 'sensor_update' event from the server
    socket.on('sensor_update', (data) => {
        console.log('Received sensor update:', data);
        updateSensorUI(data);
    });

    function updateSensorUI(data) {
        // --- Update Right Panel (Control Panel) ---
        let rightPanelContent = '';
        if (!data || Object.keys(data).length === 0) {
            rightPanelContent = '<p class="sensor-reading">No data received yet.</p>';
        } else {
            // Create styled HTML with labels and values
            rightPanelContent += `<p class="sensor-reading"><span class="sensor-label">Temperature:</span> <span class="sensor-value">${data.temperature || 'N/A'} °C</span></p>`;
            rightPanelContent += `<p class="sensor-reading"><span class="sensor-label">Humidity:</span> <span class="sensor-value">${data.humidity || 'N/A'} %</span></p>`;
            rightPanelContent += `<p class="sensor-reading"><span class="sensor-label">Rain Detected:</span> <span class="sensor-value">${data.isRaining || 'N/A'}</span></p>`;
            rightPanelContent += `<p class="sensor-reading"><span class="sensor-label">Fire Detected:</span> <span class="sensor-value">${data.fireDetected || 'N/A'}</span></p>`;
            rightPanelContent += `<p class="sensor-reading"><span class="sensor-label">Water Level:</span> <span class="sensor-value">${data.waterLevel || 'N/A'}</span></p>`;
        }
        sensorDataDiv.innerHTML = rightPanelContent;

        // --- Update Left Panel (3D Mirror) ---
        let mirrorContentText = '';
        if (!data || Object.keys(data).length === 0) {
            mirrorContentText = '<p>Offline</p>';
            sunIcon.style.display = 'none';
            fireIcon.style.display = 'none';
            clearRainEffect();
        } else {
            mirrorContentText += `<p>Temp: ${data.temperature || 'N/A'} °C</p>`;
            mirrorContentText += `<p>Hum: ${data.humidity || 'N/A'} %</p>`;
            mirrorContentText += `<p>Rain: ${data.isRaining || 'N/A'}</p>`;
            mirrorContentText += `<p>Fire: ${data.fireDetected || 'N/A'}</p>`;
            
            if (data.isRaining === 'Yes') createRainEffect();
            else clearRainEffect();
            
            sunIcon.style.display = (data.temperature > 20 && data.isRaining !== 'Yes') ? 'block' : 'none';
            fireIcon.style.display = (data.fireDetected === 'Yes') ? 'block' : 'none';
        }
        mirrorSensorDiv.innerHTML = mirrorContentText;
    }

    function createRainEffect() { /* ... content unchanged ... */ }
    function clearRainEffect() { /* ... content unchanged ... */ }
    // --- END SENSOR LOGIC ---

    function sendCommand(commandValue) {
        const formData = new FormData();
        formData.append('command', commandValue);
        fetch('/send_command', { method: 'POST', body: formData })
            .catch(error => console.error('Error sending command:', error));
    }

    // --- VOICE CONTROL FUNCTIONS (WITH WAV ENCODING FIX) ---
    // (These functions are complete and correct from your previous code)
    let mediaRecorder;
    let audioChunks = [];
    let audioContext;
    function encodeWAV(samples, sampleRate) { /* ... content unchanged ... */ }
    async function startRecording() { /* ... content unchanged ... */ }
    function stopRecording() { /* ... content unchanged ... */ }
    async function sendAudioToServer(audioBlob) { /* ... content unchanged ... */ }

    // --- MEDIAPIPE GESTURE RECOGNITION IN JAVASCRIPT ---
    // (This entire section is complete and correct from your previous code)
    const TIP_IDS = [4, 8, 12, 16, 20];
    const WINDOW_SIZE = 15;
    const REQUIRED_FRACTION = 0.7;
    let actionWindow = [];
    let lastStableAction = '';
    let lastCommandTime = 0;
    function sendGestureCommand(action) { /* ... */ }
    function fingerStates(landmarks, handedLabel) { /* ... */ }
    function classifyHand(landmarks, handedLabel) { /* ... */ }
    function decideAction(perHandClasses) { /* ... */ }
    function onResults(results) { /* ... */ }
    const hands = new Hands({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });
    hands.setOptions({ maxNumHands: 2, modelComplexity: 1, minDetectionConfidence: 0.7, minTrackingConfidence: 0.7 });
    hands.onResults(onResults);
    const camera = new Camera(videoElement, { onFrame: async () => await hands.send({ image: videoElement }), width: 480, height: 360 });
    camera.start();

    // --- ATTACH ALL EVENT LISTENERS ---
    turnOnButton.addEventListener('click', () => sendCommand(1));
    turnOffButton.addEventListener('click', () => sendCommand(0));
    startRecordingButton.addEventListener('click', startRecording);
    stopRecordingButton.addEventListener('click', stopRecording);
});