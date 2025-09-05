// /*
// 	Designed by: Alex Harris 
// 	Original Image: https://www.artstation.com/artwork/vBYdY
// */

// // --- Wrap ALL application logic inside this event listener ---
// // This ensures all HTML is loaded before the script tries to find elements.
// document.addEventListener('DOMContentLoaded', function() {
    
//     // --- PART 1: 3D House Animation Logic ---
//     const b = document.body;
//     const h = document.querySelector("#h");
//     const leftPanel = document.querySelector(".left-panel");
//     const unit = 1.75;
//     const a = document.querySelector("#a");
//     const block = document.querySelector("#block");
//     const mirrorContent = document.querySelector('.mirror-content');
//     const curiousContent = document.querySelector('.curious-content');

//     const moveFunc = (e) => {
//         const rect = leftPanel.getBoundingClientRect();
//         let x = (e.clientX - rect.left) / rect.width - 0.5;
//         let y = (e.clientY - rect.top) / rect.height - 0.5;
//         h.style.transform = `perspective(${400*unit}vmin) rotateX(${y*30+66}deg) rotateZ(${-x*420+40}deg) translateZ(${-14*unit}vmin)`;
//     };
//     const mouseDownFunc = () => b.addEventListener("mousemove", moveFunc);
//     const mouseUpFunc = () => b.removeEventListener("mousemove", moveFunc);
//     const playFunc = () => {
//         h.classList.toggle("is-main-active");
//         a.loop = true;
//         if (a.paused) a.play();
//         else { a.pause(); a.currentTime = 0; }
//         mirrorContent.classList.toggle('is-hidden');
//         curiousContent.classList.toggle('is-hidden');
//     };
//     leftPanel.addEventListener("mousedown", mouseDownFunc);
//     b.addEventListener("mouseup", mouseUpFunc);
//     block.addEventListener("click", playFunc);

//     // --- PART 2: Get all other DOM Elements ---
//     const sensorDataDiv = document.getElementById('sensor-data');
//     const turnOnButton = document.getElementById('turn-on');
//     const turnOffButton = document.getElementById('turn-off');
//     const startRecordingButton = document.getElementById('start-recording');
//     const stopRecordingButton = document.getElementById('stop-recording');
//     const voiceStatus = document.getElementById('voice-status');
//     const mirrorSensorDiv = document.getElementById('mirror-sensor-data');
//     const raindropContainer = document.getElementById('raindrop-container');
//     const sunIcon = document.getElementById('sun-icon');
//     const fireIcon = document.getElementById('fire-icon');
//     const videoElement = document.getElementById('input-video');
//     const canvasElement = document.getElementById('output-canvas');
//     const canvasCtx = canvasElement.getContext('2d');
//     let isRaining = false;

//     // --- PART 3: REAL-TIME SENSOR DATA WITH WEBSOCKETS ---
//     const socket = io();

//     socket.on('connect', () => {
//         console.log('Connected to WebSocket server!');
//         fetch('/get_initial_data')
//             .then(response => response.json())
//             .then(data => {
//                 console.log('Received initial sensor data:', data);
//                 updateSensorUI(data);
//             });
//     });

//     socket.on('sensor_update', (data) => {
//         console.log('Received sensor update:', data);
//         updateSensorUI(data);
//     });
    
//     socket.on('disconnect', () => {
//         console.log('Disconnected from WebSocket server.');
//     });

//     function updateSensorUI(data) {
//         let rightPanelContent = '';
//         if (!data || Object.keys(data).length === 0) {
//             rightPanelContent = '<p class="sensor-reading"><span class="sensor-label">Status:</span> <span class="sensor-value">Waiting for data...</span></p>';
//         } else {
//             rightPanelContent += `<p class="sensor-reading"><span class="sensor-label">Temperature:</span> <span class="sensor-value">${data.temperature || 'N/A'} °C</span></p>`;
//             rightPanelContent += `<p class="sensor-reading"><span class="sensor-label">Humidity:</span> <span class="sensor-value">${data.humidity || 'N/A'} %</span></p>`;
//             rightPanelContent += `<p class="sensor-reading"><span class="sensor-label">Rain Detected:</span> <span class="sensor-value">${data.isRaining || 'N/A'}</span></p>`;
//             rightPanelContent += `<p class="sensor-reading"><span class="sensor-label">Fire Detected:</span> <span class="sensor-value">${data.fireDetected || 'N/A'}</span></p>`;
//             rightPanelContent += `<p class="sensor-reading"><span class="sensor-label">Water Level:</span> <span class="sensor-value">${data.waterLevel || 'N/A'}</span></p>`;
//         }
//         sensorDataDiv.innerHTML = rightPanelContent;

//         let mirrorContentText = '';
//         if (!data || Object.keys(data).length === 0) {
//             mirrorContentText = '<p>Connecting...</p>';
//             sunIcon.style.display = 'none';
//             fireIcon.style.display = 'none';
//             clearRainEffect();
//         } else {
//             mirrorContentText += `<p>Temp: ${data.temperature || 'N/A'} C</p>`;
//             mirrorContentText += `<p>Hum: ${data.humidity || 'N/A'} %</p>`;
//             mirrorContentText += `<p>Rain: ${data.isRaining || 'N/A'}</p>`;
//             mirrorContentText += `<p>Fire: ${data.fireDetected || 'N/A'}</p>`;
            
//             if (data.isRaining === 'Yes') createRainEffect();
//             else clearRainEffect();
            
//             sunIcon.style.display = (data.temperature > 20 && data.isRaining !== 'Yes') ? 'block' : 'none';
//             fireIcon.style.display = (data.fireDetected === 'Yes') ? 'block' : 'none';
//         }
//         mirrorSensorDiv.innerHTML = mirrorContentText;
//     }

//     function createRainEffect() {
//         if (isRaining) return;
//         isRaining = true;
//         let drops = "";
//         for (let i = 0; i < 30; i++) {
//             const left = Math.floor(Math.random() * 100);
//             const duration = Math.random() * 0.5 + 0.5;
//             const delay = Math.random() * 1;
//             drops += `<div class="raindrop" style="left: ${left}%; animation-duration: ${duration}s; animation-delay: ${delay}s;"></div>`;
//         }
//         raindropContainer.innerHTML = drops;
//     }

//     function clearRainEffect() {
//         if (!isRaining) return;
//         isRaining = false;
//         raindropContainer.innerHTML = "";
//     }
    
//     // --- PART 4: VOICE AND MANUAL COMMANDS ---
//     function sendCommand(commandValue) {
//         const formData = new FormData();
//         formData.append('command', commandValue);
//         fetch('/send_command', { method: 'POST', body: formData })
//             .catch(error => console.error('Error sending command:', error));
//     }
    
//     let mediaRecorder;
//     let audioChunks = [];
//     let audioContext;
//     function encodeWAV(samples, sampleRate) {
//         let buffer = new ArrayBuffer(44 + samples.length * 2);
//         let view = new DataView(buffer);
//         function writeString(view, offset, string) { for (let i = 0; i < string.length; i++) { view.setUint8(offset + i, string.charCodeAt(i)); } }
//         writeString(view, 0, 'RIFF'); view.setUint32(4, 36 + samples.length * 2, true); writeString(view, 8, 'WAVE'); writeString(view, 12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true); view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true); writeString(view, 36, 'data'); view.setUint32(40, samples.length * 2, true);
//         for (let i = 0; i < samples.length; i++) { view.setInt16(44 + i * 2, samples[i] * 0x7FFF, true); }
//         return new Blob([view], { type: 'audio/wav' });
//     }
//     async function startRecording() {
//         try {
//             audioChunks = [];
//             const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//             audioContext = new (window.AudioContext || window.webkitAudioContext)();
//             const source = audioContext.createMediaStreamSource(stream);
//             const processor = audioContext.createScriptProcessor(4096, 1, 1);
//             processor.onaudioprocess = (e) => audioChunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
//             source.connect(processor);
//             processor.connect(audioContext.destination);
//             mediaRecorder = {
//                 stream: stream,
//                 stop: () => {
//                     source.disconnect(); processor.disconnect(); audioContext.close();
//                     const fullBuffer = new Float32Array(audioChunks.reduce((acc, val) => acc + val.length, 0));
//                     let offset = 0; for(const chunk of audioChunks) { fullBuffer.set(chunk, offset); offset += chunk.length; }
//                     const audioBlob = encodeWAV(fullBuffer, audioContext.sampleRate);
//                     sendAudioToServer(audioBlob);
//                     stream.getTracks().forEach(track => track.stop());
//                 }
//             };
//             voiceStatus.textContent = 'Status: Listening...';
//             startRecordingButton.disabled = true; stopRecordingButton.disabled = false;
//         } catch (err) {
//             console.error("Error accessing microphone:", err);
//             voiceStatus.textContent = 'Error: Could not access microphone.';
//         }
//     }
//     function stopRecording() {
//         if (mediaRecorder) {
//             mediaRecorder.stop();
//             voiceStatus.textContent = 'Status: Processing...';
//             startRecordingButton.disabled = false; stopRecordingButton.disabled = true; mediaRecorder = null;
//         }
//     }
//     async function sendAudioToServer(audioBlob) {
//         const formData = new FormData();
//         formData.append('audio_data', audioBlob, 'recording.wav');
//         try {
//             const response = await fetch('/process_audio', { method: 'POST', body: formData });
//             const result = await response.json();
//             voiceStatus.textContent = `Recognized: ${result.text}`;
//         } catch (err) {
//             console.error("Error sending audio to server:", err);
//             voiceStatus.textContent = 'Error: Failed to send audio.';
//         }
//     }

//     // --- PART 5: MEDIAPIPE GESTURE RECOGNITION ---
//     const TIP_IDS = [4, 8, 12, 16, 20];
//     const WINDOW_SIZE = 15;
//     const REQUIRED_FRACTION = 0.7;
//     let actionWindow = [];
//     let lastStableAction = '';
//     let lastCommandTime = 0;
//     function sendGestureCommand(action) {
//         if (Date.now() - lastCommandTime < 3000) return;
//         lastCommandTime = Date.now();
//         fetch('/gesture_command', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ action: action })
//         }).catch(err => console.error('Error sending gesture command:', err));
//     }
//     function fingerStates(landmarks, handedLabel) {
//         const fingers = [0, 0, 0, 0, 0];
//         const thumbTip = landmarks[TIP_IDS[0]];
//         const thumbIp = landmarks[TIP_IDS[0] - 1];
//         fingers[0] = (handedLabel === 'Right' ? thumbTip.x < thumbIp.x : thumbTip.x > thumbIp.x) ? 1 : 0;
//         for (let i = 1; i < 5; i++) {
//             fingers[i] = (landmarks[TIP_IDS[i]].y < landmarks[TIP_IDS[i] - 2].y) ? 1 : 0;
//         }
//         return fingers;
//     }
//     function classifyHand(landmarks, handedLabel) {
//         const up = fingerStates(landmarks, handedLabel).reduce((a, b) => a + b, 0);
//         if (up >= 4) return 'Open';
//         if (up === 0) return 'Fist';
//         return 'Other';
//     }
//     function decideAction(perHandClasses) {
//         if (perHandClasses.length !== 2) return '';
//         const openCount = perHandClasses.filter(c => c === 'Open').length;
//         const fistCount = perHandClasses.filter(c => c === 'Fist').length;
//         if (openCount === 2) return 'ON';
//         if (fistCount === 2) return 'OFF';
//         return '';
//     }
//     function onResults(results) {
//         canvasCtx.save();
//         canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
//         canvasCtx.translate(canvasElement.width, 0);
//         canvasCtx.scale(-1, 1);
//         canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
//         const perHandClasses = [];
//         if (results.multiHandLandmarks && results.multiHandedness) {
//             for (let i = 0; i < results.multiHandLandmarks.length; i++) {
//                 const landmarks = results.multiHandLandmarks[i];
//                 const handedness = results.multiHandedness[i];
//                 drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 5 });
//                 drawLandmarks(canvasCtx, landmarks, { color: '#FF0000', lineWidth: 2 });
//                 perHandClasses.push(classifyHand(landmarks, handedness.label));
//             }
//         }
//         const actionNow = decideAction(perHandClasses);
//         actionWindow.push(actionNow || '');
//         if (actionWindow.length > WINDOW_SIZE) actionWindow.shift();
//         const counts = actionWindow.reduce((acc, val) => { if (val) acc[val] = (acc[val] || 0) + 1; return acc; }, {});
//         let stableAction = '';
//         if (Object.keys(counts).length > 0) {
//             const topAction = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
//             if (counts[topAction] >= Math.floor(REQUIRED_FRACTION * actionWindow.length)) {
//                 stableAction = topAction;
//             }
//         }
//         if (stableAction && stableAction !== lastStableAction) {
//             lastStableAction = stableAction;
//             sendGestureCommand(stableAction);
//         } else if (!stableAction) {
//             lastStableAction = '';
//         }
//         if (lastStableAction) {
//              canvasCtx.scale(-1, 1);
//              canvasCtx.fillStyle = "red";
//              canvasCtx.font = "bold 30px 'Share Tech'";
//              canvasCtx.textAlign = "center";
//              canvasCtx.fillText(lastStableAction === 'ON' ? 'ALL DEVICES ON' : 'ALL DEVICES OFF', -canvasElement.width / 2, 40);
//         }
//         canvasCtx.restore();
//     }
//     const hands = new Hands({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });
//     hands.setOptions({ maxNumHands: 2, modelComplexity: 1, minDetectionConfidence: 0.7, minTrackingConfidence: 0.7 });
//     hands.onResults(onResults);
//     const camera = new Camera(videoElement, { onFrame: async () => await hands.send({ image: videoElement }), width: 480, height: 360 });
//     camera.start();

//     // --- ATTACH ALL EVENT LISTENERS ---
//     turnOnButton.addEventListener('click', () => sendCommand(1));
//     turnOffButton.addEventListener('click', () => sendCommand(0));
//     startRecordingButton.addEventListener('click', startRecording);
//     stopRecordingButton.addEventListener('click', stopRecording);
// });





/*
	Designed by: Alex Harris
	Original Image: https://www.artstation.com/artwork/vBYdY
*/

// --- Wrap ALL application logic inside this event listener ---
// This ensures all HTML is loaded before the script tries to find elements.
document.addEventListener('DOMContentLoaded', function() {

    // --- PART 1: 3D House Animation Logic ---
    const b = document.body;
    const h = document.querySelector("#h");
    const leftPanel = document.querySelector(".left-panel");
    const unit = 1.75;
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

    // --- PART 2: Get all other DOM Elements ---
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
    let isRaining = false;

    // --- PART 3: REAL-TIME SENSOR DATA WITH WEBSOCKETS (UPDATED) ---
    // Explicitly connect to the origin of the current page. This is more reliable in deployed environments.
    const socket = io.connect(window.location.origin);

    socket.on('connect', () => {
        console.log('Successfully connected to WebSocket server!');
        // Fetch initial data to populate the UI immediately after connecting.
        fetch('/get_initial_data')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Network response was not ok: ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Received initial sensor data via fetch:', data);
                updateSensorUI(data);
            })
            .catch(error => {
                console.error('Error fetching initial data:', error);
                sensorDataDiv.innerHTML = '<p class="sensor-reading"><span class="sensor-label">Status:</span> <span class="sensor-value">Error loading initial data.</span></p>';
            });
    });

    // This listener waits for 'sensor_update' events pushed from the server.
    socket.on('sensor_update', (data) => {
        // This is a crucial log. Check your browser's developer console for this message.
        console.log('Received real-time sensor update via WebSocket:', data);
        updateSensorUI(data);
    });

    // NEW: Handle connection errors explicitly.
    socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        sensorDataDiv.innerHTML = '<p class="sensor-reading"><span class="sensor-label">Error:</span> <span class="sensor-value">Could not connect to server.</span></p>';
    });

    // Handle disconnections.
    socket.on('disconnect', () => {
        console.log('Disconnected from WebSocket server.');
        sensorDataDiv.innerHTML = '<p class="sensor-reading"><span class="sensor-label">Status:</span> <span class="sensor-value">Disconnected. Retrying...</span></p>';
    });


    function updateSensorUI(data) {
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

    // --- PART 4: VOICE AND MANUAL COMMANDS ---
    function sendCommand(commandValue) {
        const formData = new FormData();
        formData.append('command', commandValue);
        fetch('/send_command', { method: 'POST', body: formData })
            .catch(error => console.error('Error sending command:', error));
    }

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

    // --- PART 5: MEDIAPIPE GESTURE RECOGNITION ---
    const TIP_IDS = [4, 8, 12, 16, 20];
    const WINDOW_SIZE = 15;
    const REQUIRED_FRACTION = 0.7;
    let actionWindow = [];
    let lastStableAction = '';
    let lastCommandTime = 0;
    function sendGestureCommand(action) {
        if (Date.now() - lastCommandTime < 3000) return;
        lastCommandTime = Date.now();
        fetch('/gesture_command', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: action })
        }).catch(err => console.error('Error sending gesture command:', err));
    }
    function fingerStates(landmarks, handedLabel) {
        const fingers = [0, 0, 0, 0, 0];
        const thumbTip = landmarks[TIP_IDS[0]];
        const thumbIp = landmarks[TIP_IDS[0] - 1];
        fingers[0] = (handedLabel === 'Right' ? thumbTip.x < thumbIp.x : thumbTip.x > thumbIp.x) ? 1 : 0;
        for (let i = 1; i < 5; i++) {
            fingers[i] = (landmarks[TIP_IDS[i]].y < landmarks[TIP_IDS[i] - 2].y) ? 1 : 0;
        }
        return fingers;
    }
    function classifyHand(landmarks, handedLabel) {
        const up = fingerStates(landmarks, handedLabel).reduce((a, b) => a + b, 0);
        if (up >= 4) return 'Open';
        if (up === 0) return 'Fist';
        return 'Other';
    }
    function decideAction(perHandClasses) {
        if (perHandClasses.length !== 2) return '';
        const openCount = perHandClasses.filter(c => c === 'Open').length;
        const fistCount = perHandClasses.filter(c => c === 'Fist').length;
        if (openCount === 2) return 'ON';
        if (fistCount === 2) return 'OFF';
        return '';
    }
    function onResults(results) {
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        canvasCtx.translate(canvasElement.width, 0);
        canvasCtx.scale(-1, 1);
        canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
        const perHandClasses = [];
        if (results.multiHandLandmarks && results.multiHandedness) {
            for (let i = 0; i < results.multiHandLandmarks.length; i++) {
                const landmarks = results.multiHandLandmarks[i];
                const handedness = results.multiHandedness[i];
                drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 5 });
                drawLandmarks(canvasCtx, landmarks, { color: '#FF0000', lineWidth: 2 });
                perHandClasses.push(classifyHand(landmarks, handedness.label));
            }
        }
        const actionNow = decideAction(perHandClasses);
        actionWindow.push(actionNow || '');
        if (actionWindow.length > WINDOW_SIZE) actionWindow.shift();
        const counts = actionWindow.reduce((acc, val) => { if (val) acc[val] = (acc[val] || 0) + 1; return acc; }, {});
        let stableAction = '';
        if (Object.keys(counts).length > 0) {
            const topAction = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
            if (counts[topAction] >= Math.floor(REQUIRED_FRACTION * actionWindow.length)) {
                stableAction = topAction;
            }
        }
        if (stableAction && stableAction !== lastStableAction) {
            lastStableAction = stableAction;
            sendGestureCommand(stableAction);
        } else if (!stableAction) {
            lastStableAction = '';
        }
        if (lastStableAction) {
             canvasCtx.scale(-1, 1);
             canvasCtx.fillStyle = "red";
             canvasCtx.font = "bold 30px 'Share Tech'";
             canvasCtx.textAlign = "center";
             canvasCtx.fillText(lastStableAction === 'ON' ? 'ALL DEVICES ON' : 'ALL DEVICES OFF', -canvasElement.width / 2, 40);
        }
        canvasCtx.restore();
    }
    const hands = new Hands({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@medipe/hands/${file}` });
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