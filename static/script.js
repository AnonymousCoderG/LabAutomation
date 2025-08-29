/*
	Designed by: Alex Harris 
	Original Image: https://www.artstation.com/artwork/vBYdY
*/

const b = document.body;
const h = document.querySelector("#h");
const leftPanel = document.querySelector(".left-panel");
const unit = 1.75;
let isRaining = false;

const a = document.querySelector("#a");
const block = document.querySelector("#block");
const mirrorContent = document.querySelector('.mirror-content');
const curiousContent = document.querySelector('.curious-content');

/*****************/
const moveFunc = (e) => {
    const rect = leftPanel.getBoundingClientRect();
    let x = (e.clientX - rect.left) / rect.width - 0.5;
    let y = (e.clientY - rect.top) / rect.height - 0.5;

    h.style.transform = `
        perspective(${400 * unit}vmin)
        rotateX(${y * 30 + 66}deg)
        rotateZ(${-x * 420 + 40}deg)
        translateZ(${-14 * unit}vmin)
    `;
};

const mouseDownFunc = () => b.addEventListener("mousemove", moveFunc);
const mouseUpFunc = () => b.removeEventListener("mousemove", moveFunc);

const playFunc = () => {
	h.classList.toggle("is-main-active");
	a.loop = true;
	if (a.paused) {
		a.play();
	} else {
		a.pause();
		a.currentTime = 0;
	}
    mirrorContent.classList.toggle('is-hidden');
    curiousContent.classList.toggle('is-hidden');
};
/*****************/
leftPanel.addEventListener("mousedown", mouseDownFunc);
b.addEventListener("mouseup", mouseUpFunc);
block.addEventListener("click", playFunc);

// ------------------- CODE FOR INTEGRATION -------------------
document.addEventListener('DOMContentLoaded', function() {
    // Right Panel Elements
    const sensorDataDiv = document.getElementById('sensor-data');
    const turnOnButton = document.getElementById('turn-on');
    const turnOffButton = document.getElementById('turn-off');
    const startRecordingButton = document.getElementById('start-recording');
    const stopRecordingButton = document.getElementById('stop-recording');
    const voiceStatus = document.getElementById('voice-status');

    // 3D Mirror Elements
    const mirrorSensorDiv = document.getElementById('mirror-sensor-data');
    const raindropContainer = document.getElementById('raindrop-container');
    const sunIcon = document.getElementById('sun-icon');
    const fireIcon = document.getElementById('fire-icon');
    
    // --- Rain Animation Functions ---
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


    // --- Main Data Fetching and UI Update Function ---
    function fetchSensorData() {
        fetch('/get_sensor_data')
            .then(response => response.json())
            .then(data => {
                let rightPanelContent = '';
                if (Object.keys(data).length === 0) {
                    rightPanelContent = '<p>No data received yet.</p>';
                } else {
                    for (const [key, value] of Object.entries(data)) {
                        const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                        rightPanelContent += `<p><strong>${formattedKey}:</strong> ${value}</p>`;
                    }
                }
                sensorDataDiv.innerHTML = rightPanelContent;

                let mirrorContent = '';
                if (Object.keys(data).length === 0) {
                    mirrorContent = '<p>Offline</p>';
                    sunIcon.style.display = 'none';
                    fireIcon.style.display = 'none';
                    clearRainEffect();
                } else {
                    mirrorContent += `<p>Temp: ${data.temperature || 'N/A'} °C</p>`;
                    mirrorContent += `<p>Humidity: ${data.humidity || 'N/A'} %</p>`;
                    mirrorContent += `<p>Rain: ${data.isRaining || 'N/A'}</p>`;
                    mirrorContent += `<p>Fire: ${data.fireDetected || 'N/A'}</p>`;
                    
                    if (data.isRaining === 'Yes') createRainEffect();
                    else clearRainEffect();
                    
                    sunIcon.style.display = (data.temperature > 20 && data.isRaining !== 'Yes') ? 'block' : 'none';
                    fireIcon.style.display = (data.fireDetected === 'Yes') ? 'block' : 'none';
                }
                mirrorSensorDiv.innerHTML = mirrorContent;
            })
            .catch(error => {
                console.error('Error fetching sensor data:', error);
                sensorDataDiv.innerHTML = '<p>Error loading data.</p>';
                mirrorSensorDiv.innerHTML = '<p>Connection Lost</p>';
            });
    }

    // --- Manual Command Function ---
    function sendCommand(commandValue) {
        const formData = new FormData();
        formData.append('command', commandValue);
        fetch('/send_command', { method: 'POST', body: formData })
            .then(response => response.text())
            .then(result => console.log(result))
            .catch(error => console.error('Error sending command:', error));
    }

    // --- NEW VOICE CONTROL LOGIC WITH WAV ENCODING ---
    let mediaRecorder;
    let audioChunks = [];
    let audioContext; // <-- To get the sample rate

    // This function encodes the raw audio data into a valid WAV file format
    function encodeWAV(samples, sampleRate) {
        let buffer = new ArrayBuffer(44 + samples.length * 2);
        let view = new DataView(buffer);

        function writeString(view, offset, string) {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        }

        writeString(view, 0, 'RIFF');
        view.setUint32(4, 36 + samples.length * 2, true);
        writeString(view, 8, 'WAVE');
        writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true); // Mono channel
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeString(view, 36, 'data');
        view.setUint32(40, samples.length * 2, true);

        for (let i = 0; i < samples.length; i++) {
            view.setInt16(44 + i * 2, samples[i] * 0x7FFF, true);
        }

        return new Blob([view], { type: 'audio/wav' });
    }


    async function startRecording() {
        try {
            audioChunks = []; // Clear previous recordings
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // We need AudioContext to process the raw audio data
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const source = audioContext.createMediaStreamSource(stream);
            const processor = audioContext.createScriptProcessor(4096, 1, 1);

            processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                // We store the raw float32 data
                audioChunks.push(new Float32Array(inputData));
            };

            source.connect(processor);
            processor.connect(audioContext.destination);

            mediaRecorder = { // We create a mock recorder object
                stream: stream,
                stop: () => {
                    source.disconnect();
                    processor.disconnect();
                    audioContext.close();
                    
                    // Combine all the Float32 arrays into one
                    const fullBuffer = new Float32Array(audioChunks.reduce((acc, val) => acc + val.length, 0));
                    let offset = 0;
                    for(const chunk of audioChunks) {
                        fullBuffer.set(chunk, offset);
                        offset += chunk.length;
                    }
                    
                    // Encode the combined buffer into a WAV blob
                    const audioBlob = encodeWAV(fullBuffer, audioContext.sampleRate);
                    sendAudioToServer(audioBlob);

                    // Stop all microphone tracks to turn off the indicator
                    stream.getTracks().forEach(track => track.stop());
                }
            };
            
            voiceStatus.textContent = 'Status: Listening...';
            startRecordingButton.disabled = true;
            stopRecordingButton.disabled = false;

        } catch (err) {
            console.error("Error accessing microphone:", err);
            voiceStatus.textContent = 'Error: Could not access microphone.';
        }
    }

    function stopRecording() {
        if (mediaRecorder) {
            mediaRecorder.stop();
            voiceStatus.textContent = 'Status: Processing...';
            startRecordingButton.disabled = false;
            stopRecordingButton.disabled = true;
            mediaRecorder = null;
        }
    }

    async function sendAudioToServer(audioBlob) {
        const formData = new FormData();
        formData.append('audio_data', audioBlob, 'recording.wav');

        try {
            const response = await fetch('/process_audio', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();

            if (response.ok) {
                voiceStatus.textContent = `Recognized: ${result.text}`;
            } else {
                voiceStatus.textContent = `Error: ${result.error}`;
            }
        } catch (err) {
            console.error("Error sending audio to server:", err);
            voiceStatus.textContent = 'Error: Failed to send audio.';
        }
    }

    // --- Attach Event Listeners ---
    turnOnButton.addEventListener('click', () => sendCommand(1));
    turnOffButton.addEventListener('click', () => sendCommand(0));
    startRecordingButton.addEventListener('click', startRecording);
    stopRecordingButton.addEventListener('click', stopRecording);

    // Initial fetch and set interval to update data every 2 seconds
    fetchSensorData();
    setInterval(fetchSensorData, 2000);
});