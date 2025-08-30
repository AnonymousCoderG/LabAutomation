/*
	Designed by: Alex Harris 
	Original Image: https://www.artstation.com/artwork/vBYdY
*/

// --- 3D house animation logic (unchanged) ---
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
// --- End 3D House Logic ---


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

    // --- SENSOR DATA POLLING ---
    function fetchSensorData() {
        fetch('/get_sensor_data')
            .then(response => response.json())
            .then(data => {
                updateSensorUI(data);
            })
            .catch(error => {
                console.error('Error fetching sensor data:', error);
                const errorHtml = '<p class="sensor-reading"><span class="sensor-label">Status:</span> <span class="sensor-value">Connection Error</span></p>';
                sensorDataDiv.innerHTML = errorHtml;
                mirrorSensorDiv.innerHTML = '<p>Connection Lost</p>';
            });
    }

    function updateSensorUI(data) {
        // Update Right Panel (Control Panel)
        let rightPanelContent = '';
        if (!data || Object.keys(data).length === 0) {
            rightPanelContent = '<p class="sensor-reading"><span class="sensor-label">Status:</span> <span class="sensor-value">Waiting for data...</span></p>';
        } else {
            rightPanelContent += `<p class="sensor-reading"><span class="sensor-label">Temperature:</span> <span class="sensor-value">${data.temperature || 'N/A'} °C</span></p>`;
            rightPanelContent += `<p class="sensor-reading"><span class="sensor-label">Humidity:</span> <span class="sensor-value">${data.humidity || 'N/A'} %</span></p>`;
            rightPanelContent += `<p class="sensor-reading"><span class="sensor-label">Rain Detected:</span> <span class="sensor-value">${data.isRaining || 'N/A'}</span></p>`;
            rightPanelContent += `<p class="sensor-reading"><span class="sensor-label">Fire Detected:</span> <span class="sensor-value">${data.fireDetected || 'N/A'}</span></p>`;
            rightPanelContent += `<p class="sensor-reading"><span class="sensor-label">Water Level:</span> <span class="sensor-value">${data.waterLevel || 'N/A'}</span></p>`;
        }
        sensorDataDiv.innerHTML = rightPanelContent;

        // Update Left Panel (3D Mirror)
        let mirrorContentText = '';
        if (!data || Object.keys(data).length === 0) {
            mirrorContentText = '<p>Connecting...</p>';
            sunIcon.style.display = 'none';
            fireIcon.style.display = 'none';
            clearRainEffect();
        } else {
            mirrorContentText += `<p>Temp: ${data.temperature || 'N/A'} C</p>`;
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

    function createRainEffect() {
        if (isRaining) return;
        isRaining = true;
        let drops = "";
        for (let i = 0; i < 30; i++) {
            const left = Math.floor(Math.random() * 100);
            const duration = Math.random() * 0.5 + 0.5;
            const delay = Math.random() * 1;
            drops += `<div class="raindrop" style="left: ${left}%; animation-duration: ${duration}s; animation-delay: ${delay}s;"></div>`;
        }
        raindropContainer.innerHTML = drops;
    }

    function clearRainEffect() {
        if (!isRaining) return;
        isRaining = false;
        raindropContainer.innerHTML = "";
    }
    
    // --- MANUAL COMMANDS ---
    function sendCommand(commandValue) {
        const formData = new FormData();
        formData.append('command', commandValue);
        fetch('/send_command', { method: 'POST', body: formData })
            .catch(error => console.error('Error sending command:', error));
    }
    
    // --- VOICE CONTROL ---
    let mediaRecorder;
    let audioChunks = [];
    let audioContext;
    function encodeWAV(samples, sampleRate) {
        let buffer = new ArrayBuffer(44 + samples.length * 2);
        let view = new DataView(buffer);
        function writeString(view, offset, string) { for (let i = 0; i < string.length; i++) { view.setUint8(offset + i, string.charCodeAt(i)); } }
        writeString(view, 0, 'RIFF'); view.setUint32(4, 36 + samples.length * 2, true); writeString(view, 8, 'WAVE'); writeString(view, 12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true); view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true); writeString(view, 36, 'data'); view.setUint32(40, samples.length * 2, true);
        for (let i = 0; i < samples.length; i++) { view.setInt16(44 + i * 2, samples[i] * 0x7FFF, true); }
        return new Blob([view], { type: 'audio/wav' });
    }
    async function startRecording() {
        try {
            audioChunks = [];
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const source = audioContext.createMediaStreamSource(stream);
            const processor = audioContext.createScriptProcessor(4096, 1, 1);
            processor.onaudioprocess = (e) => audioChunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
            source.connect(processor);
            processor.connect(audioContext.destination);
            mediaRecorder = {
                stream: stream,
                stop: () => {
                    source.disconnect(); processor.disconnect(); audioContext.close();
                    const fullBuffer = new Float32Array(audioChunks.reduce((acc, val) => acc + val.length, 0));
                    let offset = 0; for(const chunk of audioChunks) { fullBuffer.set(chunk, offset); offset += chunk.length; }
                    const audioBlob = encodeWAV(fullBuffer, audioContext.sampleRate);
                    sendAudioToServer(audioBlob);
                    stream.getTracks().forEach(track => track.stop());
                }
            };
            voiceStatus.textContent = 'Status: Listening...';
            startRecordingButton.disabled = true; stopRecordingButton.disabled = false;
        } catch (err) {
            console.error("Error accessing microphone:", err);
            voiceStatus.textContent = 'Error: Could not access microphone.';
        }
    }
    function stopRecording() {
        if (mediaRecorder) {
            mediaRecorder.stop();
            voiceStatus.textContent = 'Status: Processing...';
            startRecordingButton.disabled = false; stopRecordingButton.disabled = true; mediaRecorder = null;
        }
    }
    async function sendAudioToServer(audioBlob) {
        const formData = new FormData();
        formData.append('audio_data', audioBlob, 'recording.wav');
        try {
            const response = await fetch('/process_audio', { method: 'POST', body: formData });
            const result = await response.json();
            voiceStatus.textContent = `Recognized: ${result.text}`;
        } catch (err) {
            console.error("Error sending audio to server:", err);
            voiceStatus.textContent = 'Error: Failed to send audio.';
        }
    }

    // --- ATTACH ALL EVENT LISTENERS ---
    turnOnButton.addEventListener('click', () => sendCommand(1));
    turnOffButton.addEventListener('click', () => sendCommand(0));
    startRecordingButton.addEventListener('click', startRecording);
    stopRecordingButton.addEventListener('click', stopRecording);

    // Initial data fetch and start the polling interval
    fetchSensorData();
    setInterval(fetchSensorData, 2000); // Poll every 2 seconds
});