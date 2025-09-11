// // script.js 

// document.addEventListener('DOMContentLoaded', function() {

//     // --- PART 1 & 2: Get DOM Elements (Unchanged) ---
//     const b = document.body;
//     const h = document.querySelector("#h");
//     const leftPanel = document.querySelector(".left-panel");
//     const unit = 1.75;
//     const a = document.querySelector("#a");
//     const block = document.querySelector("#block");
//     const mirrorContent = document.querySelector('.mirror-content');
//     const curiousContent = document.querySelector('.curious-content');
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
//     const moveFunc = (e) => { const rect = leftPanel.getBoundingClientRect(); let x = (e.clientX - rect.left) / rect.width - 0.5; let y = (e.clientY - rect.top) / rect.height - 0.5; h.style.transform = `perspective(${400*unit}vmin) rotateX(${y*30+66}deg) rotateZ(${-x*420+40}deg) translateZ(${-14*unit}vmin)`; };
//     const mouseDownFunc = () => b.addEventListener("mousemove", moveFunc);
//     const mouseUpFunc = () => b.removeEventListener("mousemove", moveFunc);
//     const playFunc = () => { h.classList.toggle("is-main-active"); a.loop = true; if (a.paused) a.play(); else { a.pause(); a.currentTime = 0; } mirrorContent.classList.toggle('is-hidden'); curiousContent.classList.toggle('is-hidden'); };
//     leftPanel.addEventListener("mousedown", mouseDownFunc);
//     b.addEventListener("mouseup", mouseUpFunc);
//     block.addEventListener("click", playFunc);

//     // --- PART 3: SENSOR DATA (Unchanged) ---
//     let lastKnownSensorData = {}; let connectionError = false; function fetchSensorData() { fetch('/get_initial_data').then(response => { if (!response.ok) throw new Error('Network response was not ok'); return response.json(); }).then(data => { lastKnownSensorData = data; connectionError = false; updateSensorUI(); }).catch(error => { console.error('Error fetching sensor data:', error); connectionError = true; updateSensorUI(); }); }
//     function updateSensorUI() { const data = lastKnownSensorData; let rightPanelContent = ''; if (!data || Object.keys(data).length === 0) { rightPanelContent = '<p class="sensor-reading"><span class="sensor-label">Status:</span> <span class="sensor-value">Waiting for data...</span></p>'; } else { rightPanelContent += `<p class="sensor-reading"><span class="sensor-label">Temperature:</span> <span class="sensor-value">${data.temperature || 'N/A'} °C</span></p>`; rightPanelContent += `<p class="sensor-reading"><span class="sensor-label">Humidity:</span> <span class="sensor-value">${data.humidity || 'N/A'} %</span></p>`; rightPanelContent += `<p class="sensor-reading"><span class="sensor-label">Rain Detected:</span> <span class="sensor-value">${data.isRaining || 'N/A'}</span></p>`; rightPanelContent += `<p class="sensor-reading"><span class="sensor-label">Fire Detected:</span> <span class="sensor-value">${data.fireDetected || 'N/A'}</span></p>`; rightPanelContent += `<p class="sensor-reading"><span class="sensor-label">Water Level:</span> <span class="sensor-value">${data.waterLevel || 'N/A'}</span></p>`; } if (connectionError) { rightPanelContent += `<p class="connection-status error">Connection lost. Retrying...</p>`; } sensorDataDiv.innerHTML = rightPanelContent; let mirrorContentText = ''; if (!data || Object.keys(data).length === 0) { mirrorContentText = '<p>Connecting...</p>'; sunIcon.style.display = 'none'; fireIcon.style.display = 'none'; clearRainEffect(); } else { mirrorContentText += `<p>Temp: ${data.temperature || 'N/A'} C</p>`; mirrorContentText += `<p>Hum: ${data.humidity || 'N/A'} %</p>`; mirrorContentText += `<p>Rain: ${data.isRaining || 'N/A'}</p>`; mirrorContentText += `<p>Fire: ${data.fireDetected || 'N/A'}</p>`; if (data.isRaining === 'Yes') createRainEffect(); else clearRainEffect(); sunIcon.style.display = (data.temperature > 20 && data.isRaining !== 'Yes') ? 'block' : 'none'; fireIcon.style.display = (data.fireDetected === 'Yes') ? 'block' : 'none'; } mirrorSensorDiv.innerHTML = mirrorContentText; }
//     function createRainEffect() { if (isRaining) return; isRaining = true; let drops = ""; for (let i = 0; i < 30; i++) { const left = Math.floor(Math.random() * 100); const duration = Math.random() * 0.5 + 0.5; const delay = Math.random() * 1; drops += `<div class="raindrop" style="left: ${left}%; animation-duration: ${duration}s; animation-delay: ${delay}s;"></div>`; } raindropContainer.innerHTML = drops; }
//     function clearRainEffect() { if (!isRaining) return; isRaining = false; raindropContainer.innerHTML = ""; }
    
//     // --- PART 4: VOICE COMMANDS (Unchanged) ---
//     let mediaRecorder; let audioChunks = []; let audioContext;
//     function encodeWAV(samples, sampleRate) { let buffer = new ArrayBuffer(44 + samples.length * 2); let view = new DataView(buffer); function writeString(view, offset, string) { for (let i = 0; i < string.length; i++) { view.setUint8(offset + i, string.charCodeAt(i)); } } writeString(view, 0, 'RIFF'); view.setUint32(4, 36 + samples.length * 2, true); writeString(view, 8, 'WAVE'); writeString(view, 12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true); view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true); writeString(view, 36, 'data'); view.setUint32(40, samples.length * 2, true); for (let i = 0; i < samples.length; i++) { view.setInt16(44 + i * 2, samples[i] * 0x7FFF, true); } return new Blob([view], { type: 'audio/wav' }); }
//     async function startRecording() { try { audioChunks = []; const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); audioContext = new (window.AudioContext || window.webkitAudioContext)(); const source = audioContext.createMediaStreamSource(stream); const processor = audioContext.createScriptProcessor(4096, 1, 1); processor.onaudioprocess = (e) => audioChunks.push(new Float32Array(e.inputBuffer.getChannelData(0))); source.connect(processor); processor.connect(audioContext.destination); mediaRecorder = { stream: stream, stop: () => { source.disconnect(); processor.disconnect(); audioContext.close(); const fullBuffer = new Float32Array(audioChunks.reduce((acc, val) => acc + val.length, 0)); let offset = 0; for(const chunk of audioChunks) { fullBuffer.set(chunk, offset); offset += chunk.length; } const audioBlob = encodeWAV(fullBuffer, audioContext.sampleRate); sendAudioToServer(audioBlob); stream.getTracks().forEach(track => track.stop()); } }; voiceStatus.textContent = 'Status: Listening...'; startRecordingButton.disabled = true; stopRecordingButton.disabled = false; } catch (err) { console.error("Error accessing microphone:", err); voiceStatus.textContent = 'Error: Could not access microphone.'; } }
//     function stopRecording() { if (mediaRecorder) { mediaRecorder.stop(); voiceStatus.textContent = 'Status: Processing...'; mediaRecorder = null; } }
//     async function sendAudioToServer(audioBlob) { const formData = new FormData(); formData.append('audio_data', audioBlob, 'recording.wav'); const controller = new AbortController(); const timeoutId = setTimeout(() => controller.abort(), 15000); try { const response = await fetch('/process_audio', { method: 'POST', body: formData, signal: controller.signal }); clearTimeout(timeoutId); if (!response.ok) throw new Error(`Server error: ${response.status}`); const result = await response.json(); voiceStatus.textContent = `Recognized: "${result.text}"`; } catch (err) { if (err.name === 'AbortError') { voiceStatus.textContent = 'Status: Request timed out. Try again.'; } else { voiceStatus.textContent = 'Error: Failed to process audio.'; } console.error("Error sending audio to server:", err); } finally { startRecordingButton.disabled = false; stopRecordingButton.disabled = true; } }

//     // --- PART 5: MEDIAPIPE GESTURE RECOGNITION (UPDATED FOR STABILITY) ---
//     const TIP_IDS = [4, 8, 12, 16, 20];
//     const WINDOW_SIZE = 15; // Increased window size
//     const REQUIRED_FRACTION = 0.8; // Increased strictness
    
//     let fanActionWindow = [];
//     let lastStableFanAction = '';
//     let lastFanCommandTime = 0;
    
//     let gateActionWindow = [];
//     let lastStableGateAction = '';
//     let lastGateCommandTime = 0;
    
//     let lastFetchTime = 0;
//     const FETCH_INTERVAL = 2000;
    
//     function sendCommand(commandValue) { const formData = new FormData(); formData.append('command', commandValue); fetch('/send_command', { method: 'POST', body: formData }).catch(error => console.error('Error sending command:', error)); }
    
//     function sendFanGestureCommand(action) {
//         if (Date.now() - lastFanCommandTime < 3000) return; // Increased cooldown
//         lastFanCommandTime = Date.now();
//         console.log(`Sending FAN command: ${action}`);
//         fetch('/gesture_command', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: action }) }).catch(err => console.error('Error sending fan gesture command:', err));
//         fanActionWindow = [];
//     }

//     function sendGateGestureCommand(action) {
//         if (Date.now() - lastGateCommandTime < 3000) return; // Increased cooldown
//         lastGateCommandTime = Date.now();
//         console.log(`Sending GATE command: ${action}`);
//         fetch('/gate_gesture_command', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: action }) }).catch(err => console.error('Error sending gate gesture command:', err));
//         gateActionWindow = [];
//     }

//     function fingerStates(landmarks, handedLabel) { const fingers = [0, 0, 0, 0, 0]; const thumbTip = landmarks[TIP_IDS[0]]; const thumbIp = landmarks[TIP_IDS[0] - 1]; fingers[0] = (handedLabel === 'Right' ? thumbTip.x < thumbIp.x : thumbTip.x > thumbIp.x) ? 1 : 0; for (let i = 1; i < 5; i++) { fingers[i] = (landmarks[TIP_IDS[i]].y < landmarks[TIP_IDS[i] - 2].y) ? 1 : 0; } return fingers; }
//     function classifyHand(landmarks, handedLabel) { const up = fingerStates(landmarks, handedLabel).reduce((a, b) => a + b, 0); if (up >= 4) return 'Open'; if (up === 0) return 'Fist'; return 'Other'; }
    
//     function decideFanAction(perHandClasses) { const openCount = perHandClasses.filter(c => c === 'Open').length; const fistCount = perHandClasses.filter(c => c === 'Fist').length; if (openCount === 2) return 'ON'; if (fistCount === 2) return 'OFF'; return ''; }
//     function decideGateAction(perHandClasses) { const handState = perHandClasses[0]; if (handState === 'Open') return 'OPEN_GATE'; if (handState === 'Fist') return 'CLOSE_GATE'; return ''; }

//     function onResults(results) {
//         const now = Date.now();
//         if (now - lastFetchTime > FETCH_INTERVAL) { fetchSensorData(); lastFetchTime = now; }
        
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
        
//         // --- NEW: STRICT, MUTUALLY EXCLUSIVE GESTURE PROCESSING ---
//         let currentMode = 'NONE';
//         if (perHandClasses.length === 1) {
//             currentMode = 'GATE';
//         } else if (perHandClasses.length === 2) {
//             currentMode = 'FAN';
//         }

//         if (currentMode === 'FAN') {
//             const fanActionNow = decideFanAction(perHandClasses);
//             fanActionWindow.push(fanActionNow || '');
//             if (fanActionWindow.length > WINDOW_SIZE) fanActionWindow.shift();
//             // Forcefully reset the other mode
//             gateActionWindow = [];
//             lastStableGateAction = '';
//         } else if (currentMode === 'GATE') {
//             const gateActionNow = decideGateAction(perHandClasses);
//             gateActionWindow.push(gateActionNow || '');
//             if (gateActionWindow.length > WINDOW_SIZE) gateActionWindow.shift();
//             // Forcefully reset the other mode
//             fanActionWindow = [];
//             lastStableFanAction = '';
//         } else { // currentMode is 'NONE'
//             // If no hands are detected, clear any lingering stable actions
//             lastStableFanAction = '';
//             lastStableGateAction = '';
//         }

//         // --- Stabilize and Send Fan Command ---
//         const fanCounts = fanActionWindow.reduce((acc, val) => { if (val) acc[val] = (acc[val] || 0) + 1; return acc; }, {});
//         let stableFanAction = '';
//         if (Object.keys(fanCounts).length > 0) {
//             const topAction = Object.keys(fanCounts).reduce((a, b) => fanCounts[a] > fanCounts[b] ? a : b);
//             if (fanCounts[topAction] >= Math.floor(REQUIRED_FRACTION * fanActionWindow.length)) {
//                 stableFanAction = topAction;
//             }
//         }
//         if (stableFanAction && stableFanAction !== lastStableFanAction) {
//             lastStableFanAction = stableFanAction;
//             sendFanGestureCommand(stableFanAction);
//         } else if (!stableFanAction) {
//             lastStableFanAction = '';
//         }
        
//         // --- Stabilize and Send Gate Command ---
//         const gateCounts = gateActionWindow.reduce((acc, val) => { if (val) acc[val] = (acc[val] || 0) + 1; return acc; }, {});
//         let stableGateAction = '';
//         if (Object.keys(gateCounts).length > 0) {
//             const topAction = Object.keys(gateCounts).reduce((a, b) => gateCounts[a] > gateCounts[b] ? a : b);
//             if (gateCounts[topAction] >= Math.floor(REQUIRED_FRACTION * gateActionWindow.length)) {
//                 stableGateAction = topAction;
//             }
//         }
//         if (stableGateAction && stableGateAction !== lastStableGateAction) {
//             lastStableGateAction = stableGateAction;
//             sendGateGestureCommand(stableGateAction);
//         } else if (!stableGateAction) {
//             lastStableGateAction = '';
//         }

//         // --- NEW: CONTEXT-AWARE DISPLAY LOGIC ---
//         let displayText = '';
//         if (currentMode === 'FAN' && lastStableFanAction) {
//             displayText = lastStableFanAction === 'ON' ? 'ALL DEVICES ON' : 'ALL DEVICES OFF';
//         } else if (currentMode === 'GATE' && lastStableGateAction) {
//             displayText = lastStableGateAction === 'OPEN_GATE' ? 'GATE OPEN' : 'GATE CLOSE';
//         }

//         if (displayText) {
//             canvasCtx.scale(-1, 1);
//             canvasCtx.fillStyle = "red";
//             canvasCtx.font = "bold 30px 'Share Tech'";
//             canvasCtx.textAlign = "center";
//             canvasCtx.fillText(displayText, -canvasElement.width / 2, 40);
//         }

//         canvasCtx.restore();
//     }
    
//     const hands = new Hands({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });
//     hands.setOptions({ maxNumHands: 2, modelComplexity: 1, minDetectionConfidence: 0.7, minTrackingConfidence: 0.7 });
//     hands.onResults(onResults);
    
//     const camera = new Camera(videoElement, { onFrame: async () => await hands.send({ image: videoElement }), width: 480, height: 360 });
//     camera.start();
    
//     fetchSensorData();
//     turnOnButton.addEventListener('click', () => sendCommand(1));
//     turnOffButton.addEventListener('click', () => sendCommand(0));
//     startRecordingButton.addEventListener('click', startRecording);
//     stopRecordingButton.addEventListener('click', stopRecording);
// });


//above code is only for gate now below i have integrated light control 
// script.js (Final Version: Stable and Responsive)

// document.addEventListener('DOMContentLoaded', function() {

//     // --- PART 1, 2, 3, 4: Setup, UI, Sensors, and Voice (Unchanged) ---
//     const b = document.body;
//     const h = document.querySelector("#h");
//     const leftPanel = document.querySelector(".left-panel");
//     const unit = 1.75;
//     const a = document.querySelector("#a");
//     const block = document.querySelector("#block");
//     const mirrorContent = document.querySelector('.mirror-content');
//     const curiousContent = document.querySelector('.curious-content');
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
//     const moveFunc = (e) => { const rect = leftPanel.getBoundingClientRect(); let x = (e.clientX - rect.left) / rect.width - 0.5; let y = (e.clientY - rect.top) / rect.height - 0.5; h.style.transform = `perspective(${400*unit}vmin) rotateX(${y*30+66}deg) rotateZ(${-x*420+40}deg) translateZ(${-14*unit}vmin)`; };
//     const mouseDownFunc = () => b.addEventListener("mousemove", moveFunc);
//     const mouseUpFunc = () => b.removeEventListener("mousemove", moveFunc);
//     const playFunc = () => { h.classList.toggle("is-main-active"); a.loop = true; if (a.paused) a.play(); else { a.pause(); a.currentTime = 0; } mirrorContent.classList.toggle('is-hidden'); curiousContent.classList.toggle('is-hidden'); };
//     leftPanel.addEventListener("mousedown", mouseDownFunc);
//     b.addEventListener("mouseup", mouseUpFunc);
//     block.addEventListener("click", playFunc);
//     let lastKnownSensorData = {}; let connectionError = false; function fetchSensorData() { fetch('/get_initial_data').then(response => { if (!response.ok) throw new Error('Network response was not ok'); return response.json(); }).then(data => { lastKnownSensorData = data; connectionError = false; updateSensorUI(); }).catch(error => { console.error('Error fetching sensor data:', error); connectionError = true; updateSensorUI(); }); }
//     function updateSensorUI() { const data = lastKnownSensorData; let rightPanelContent = ''; if (!data || Object.keys(data).length === 0) { rightPanelContent = '<p class="sensor-reading"><span class="sensor-label">Status:</span> <span class="sensor-value">Waiting for data...</span></p>'; } else { rightPanelContent += `<p class="sensor-reading"><span class="sensor-label">Temperature:</span> <span class="sensor-value">${data.temperature || 'N/A'} °C</span></p>`; rightPanelContent += `<p class="sensor-reading"><span class="sensor-label">Humidity:</span> <span class="sensor-value">${data.humidity || 'N/A'} %</span></p>`; rightPanelContent += `<p class="sensor-reading"><span class="sensor-label">Rain Detected:</span> <span class="sensor-value">${data.isRaining || 'N/A'}</span></p>`; rightPanelContent += `<p class="sensor-reading"><span class="sensor-label">Fire Detected:</span> <span class="sensor-value">${data.fireDetected || 'N/A'}</span></p>`; rightPanelContent += `<p class="sensor-reading"><span class="sensor-label">Water Level:</span> <span class="sensor-value">${data.waterLevel || 'N/A'}</span></p>`; } if (connectionError) { rightPanelContent += `<p class="connection-status error">Connection lost. Retrying...</p>`; } sensorDataDiv.innerHTML = rightPanelContent; let mirrorContentText = ''; if (!data || Object.keys(data).length === 0) { mirrorContentText = '<p>Connecting...</p>'; sunIcon.style.display = 'none'; fireIcon.style.display = 'none'; clearRainEffect(); } else { mirrorContentText += `<p>Temp: ${data.temperature || 'N/A'} C</p>`; mirrorContentText += `<p>Hum: ${data.humidity || 'N/A'} %</p>`; mirrorContentText += `<p>Rain: ${data.isRaining || 'N/A'}</p>`; mirrorContentText += `<p>Fire: ${data.fireDetected || 'N/A'}</p>`; if (data.isRaining === 'Yes') createRainEffect(); else clearRainEffect(); sunIcon.style.display = (data.temperature > 20 && data.isRaining !== 'Yes') ? 'block' : 'none'; fireIcon.style.display = (data.fireDetected === 'Yes') ? 'block' : 'none'; } mirrorSensorDiv.innerHTML = mirrorContentText; }
//     function createRainEffect() { if (isRaining) return; isRaining = true; let drops = ""; for (let i = 0; i < 30; i++) { const left = Math.floor(Math.random() * 100); const duration = Math.random() * 0.5 + 0.5; const delay = Math.random() * 1; drops += `<div class="raindrop" style="left: ${left}%; animation-duration: ${duration}s; animation-delay: ${delay}s;"></div>`; } raindropContainer.innerHTML = drops; }
//     function clearRainEffect() { if (!isRaining) return; isRaining = false; raindropContainer.innerHTML = ""; }
//     let mediaRecorder; let audioChunks = []; let audioContext; function encodeWAV(samples, sampleRate) { let buffer = new ArrayBuffer(44 + samples.length * 2); let view = new DataView(buffer); function writeString(view, offset, string) { for (let i = 0; i < string.length; i++) { view.setUint8(offset + i, string.charCodeAt(i)); } } writeString(view, 0, 'RIFF'); view.setUint32(4, 36 + samples.length * 2, true); writeString(view, 8, 'WAVE'); writeString(view, 12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true); view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true); writeString(view, 36, 'data'); view.setUint32(40, samples.length * 2, true); for (let i = 0; i < samples.length; i++) { view.setInt16(44 + i * 2, samples[i] * 0x7FFF, true); } return new Blob([view], { type: 'audio/wav' }); }
//     async function startRecording() { try { audioChunks = []; const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); audioContext = new (window.AudioContext || window.webkitAudioContext)(); const source = audioContext.createMediaStreamSource(stream); const processor = audioContext.createScriptProcessor(4096, 1, 1); processor.onaudioprocess = (e) => audioChunks.push(new Float32Array(e.inputBuffer.getChannelData(0))); source.connect(processor); processor.connect(audioContext.destination); mediaRecorder = { stream: stream, stop: () => { source.disconnect(); processor.disconnect(); audioContext.close(); const fullBuffer = new Float32Array(audioChunks.reduce((acc, val) => acc + val.length, 0)); let offset = 0; for(const chunk of audioChunks) { fullBuffer.set(chunk, offset); offset += chunk.length; } const audioBlob = encodeWAV(fullBuffer, audioContext.sampleRate); sendAudioToServer(audioBlob); stream.getTracks().forEach(track => track.stop()); } }; voiceStatus.textContent = 'Status: Listening...'; startRecordingButton.disabled = true; stopRecordingButton.disabled = false; } catch (err) { console.error("Error accessing microphone:", err); voiceStatus.textContent = 'Error: Could not access microphone.'; } }
//     function stopRecording() { if (mediaRecorder) { mediaRecorder.stop(); voiceStatus.textContent = 'Status: Processing...'; mediaRecorder = null; } }
//     async function sendAudioToServer(audioBlob) { const formData = new FormData(); formData.append('audio_data', audioBlob, 'recording.wav'); const controller = new AbortController(); const timeoutId = setTimeout(() => controller.abort(), 15000); try { const response = await fetch('/process_audio', { method: 'POST', body: formData, signal: controller.signal }); clearTimeout(timeoutId); if (!response.ok) throw new Error(`Server error: ${response.status}`); const result = await response.json(); voiceStatus.textContent = `Recognized: "${result.text}"`; } catch (err) { if (err.name === 'AbortError') { voiceStatus.textContent = 'Status: Request timed out. Try again.'; } else { voiceStatus.textContent = 'Error: Failed to process audio.'; } console.error("Error sending audio to server:", err); } finally { startRecordingButton.disabled = false; stopRecordingButton.disabled = true; } }

//     // --- PART 5: MEDIAPIPE GESTURE RECOGNITION (RE-ENGINEERED) ---
//     const TIP_IDS = [4, 8, 12, 16, 20];
//     const WINDOW_SIZE = 10;           // Faster response window
//     const REQUIRED_FRACTION = 0.7;    // Balanced strictness
    
//     let actionWindow = [];
//     let lastStableAction = '';
//     let lastCommandTime = 0;
//     const COMMAND_COOLDOWN = 1500; // Reduced cooldown for responsiveness

//     // --- NEW: State tracker to detect changes in gesture ---
//     let lastAction = 'none'; 

//     let lastFetchTime = 0;
//     const FETCH_INTERVAL = 2000;
    
//     function sendGestureCommand(endpoint, action) {
//         if (Date.now() - lastCommandTime < COMMAND_COOLDOWN) return;
//         lastCommandTime = Date.now();
//         console.log(`Sending command to ${endpoint}: ${action}`);
//         fetch(endpoint, { 
//             method: 'POST', 
//             headers: { 'Content-Type': 'application/json' }, 
//             body: JSON.stringify({ action: action }) 
//         }).catch(err => console.error(`Error sending gesture command to ${endpoint}:`, err));
//     }

//     // --- REWRITTEN: More accurate finger state detection ---
//     function fingerStates(landmarks, handedLabel) {
//         const fingers = [0, 0, 0, 0, 0]; // Thumb, Index, Middle, Ring, Pinky
//         fingers[0] = (handedLabel.toLowerCase() === 'right' ? landmarks[TIP_IDS[0]].x < landmarks[TIP_IDS[0] - 1].x : landmarks[TIP_IDS[0]].x > landmarks[TIP_IDS[0] - 1].x) ? 1 : 0;
//         for (let i = 1; i < 5; i++) {
//             fingers[i] = (landmarks[TIP_IDS[i]].y < landmarks[TIP_IDS[i] - 2].y) ? 1 : 0;
//         }
//         return fingers;
//     }

//     // --- REWRITTEN: More specific gesture classification ---
//     function classifyHand(landmarks, handedLabel) {
//         const states = fingerStates(landmarks, handedLabel);
//         const upCount = states.reduce((a, b) => a + b, 0);

//         if (states[0] && !states[1] && !states[2] && !states[3] && !states[4]) return 'Thumbs_Up';
//         if (states[0] && states[4] && !states[1] && !states[2] && !states[3]) return 'Shaka';
//         if (states[1] && states[2] && !states[0] && !states[3] && !states[4]) return 'Peace';
//         if (states[1] && !states[0] && !states[2] && !states[3] && !states[4]) return 'Point';
//         if (upCount >= 4) return 'Open';
//         if (upCount === 0) return 'Fist';
        
//         return 'Other';
//     }
    
//     function onResults(results) {
//         const now = Date.now();
//         if (now - lastFetchTime > FETCH_INTERVAL) { fetchSensorData(); lastFetchTime = now; }
        
//         canvasCtx.save();
//         canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
//         canvasCtx.translate(canvasElement.width, 0);
//         canvasCtx.scale(-1, 1);
//         canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
        
//         let currentAction = 'Other';

//         if (results.multiHandLandmarks && results.multiHandLandmarks.length === 1) {
//             const landmarks = results.multiHandLandmarks[0];
//             const handedness = results.multiHandedness[0];
//             drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 5 });
//             drawLandmarks(canvasCtx, landmarks, { color: '#FF0000', lineWidth: 2 });
//             currentAction = classifyHand(landmarks, handedness.label);
//         }
        
//         // --- NEW: Aggressive Reset Logic ---
//         // If the detected gesture changes AT ALL, wipe the history.
//         if (currentAction !== lastAction) {
//             actionWindow = [];
//             lastAction = currentAction;
//         }

//         actionWindow.push(currentAction);
//         if (actionWindow.length > WINDOW_SIZE) actionWindow.shift();

//         // --- Stabilize and Send Commands ---
//         const actionCounts = actionWindow.reduce((acc, val) => { if (val !== 'Other') acc[val] = (acc[val] || 0) + 1; return acc; }, {});
//         let stableAction = '';
//         if (Object.keys(actionCounts).length > 0) {
//             const topAction = Object.keys(actionCounts).reduce((a, b) => actionCounts[a] > actionCounts[b] ? a : b);
//             if (actionCounts[topAction] >= Math.floor(REQUIRED_FRACTION * actionWindow.length)) {
//                 stableAction = topAction;
//             }
//         }
        
//         if (stableAction && stableAction !== lastStableAction) {
//             lastStableAction = stableAction;
//             switch(stableAction) {
//                 case 'Thumbs_Up': sendGestureCommand('/gesture_command', 'ON'); break;
//                 case 'Shaka': sendGestureCommand('/gesture_command', 'OFF'); break;
//                 case 'Open': sendGestureCommand('/gate_gesture_command', 'OPEN_GATE'); break;
//                 case 'Fist': sendGestureCommand('/gate_gesture_command', 'CLOSE_GATE'); break;
//                 case 'Peace': sendGestureCommand('/light_gesture_command', 'LIGHTS_ON'); break;
//                 case 'Point': sendGestureCommand('/light_gesture_command', 'LIGHTS_OFF'); break;
//             }
//         } else if (!stableAction) {
//             lastStableAction = '';
//         }

//         // --- Display Logic ---
//         let displayText = '';
//         if (lastStableAction) {
//             switch(lastStableAction) {
//                 case 'Thumbs_Up': displayText = 'FAN ON'; break;
//                 case 'Shaka': displayText = 'FAN OFF'; break;
//                 case 'Open': displayText = 'GATE OPEN'; break;
//                 case 'Fist': displayText = 'GATE CLOSE'; break;
//                 case 'Peace': displayText = 'LIGHTS ON'; break;
//                 case 'Point': displayText = 'LIGHTS OFF'; break;
//             }
//         }

//         if (displayText) {
//             canvasCtx.scale(-1, 1);
//             canvasCtx.fillStyle = "red";
//             canvasCtx.font = "bold 30px 'Share Tech'";
//             canvasCtx.textAlign = "center";
//             canvasCtx.fillText(displayText, -canvasElement.width / 2, 40);
//         }
//         canvasCtx.restore();
//     }
    
//     const hands = new Hands({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });
//     hands.setOptions({ 
//         maxNumHands: 1, // Force one-hand mode
//         modelComplexity: 0, // --- PERFORMANCE: Use the Lite model ---
//         minDetectionConfidence: 0.7, 
//         minTrackingConfidence: 0.7
//     });
//     hands.onResults(onResults);
    
//     const camera = new Camera(videoElement, { onFrame: async () => await hands.send({ image: videoElement }), width: 480, height: 360 });
//     camera.start();
    
//     fetchSensorData();
//     const sendButtonCommand = (val) => { const fd = new FormData(); fd.append('command', val); fetch('/send_command', { method: 'POST', body: fd }); };
//     turnOnButton.addEventListener('click', () => sendButtonCommand(1));
//     turnOffButton.addEventListener('click', () => sendButtonCommand(0));
//     startRecordingButton.addEventListener('click', startRecording);
//     stopRecordingButton.addEventListener('click', stopRecording);
// });



//updated code for more accurate results 
// script.js (Final Version: With "I Love You" Gesture for Fan Off)
// script.js (Final Version: With "Shaka" Gesture for Fan Off)


// script.js (Final Version: With "Shaka" Gesture for Fan Off)

// document.addEventListener('DOMContentLoaded', function() {

//     // --- PART 1, 2, 3, 4: Setup, UI, Sensors, and Voice (Unchanged) ---
//     const b = document.body;
//     const h = document.querySelector("#h");
//     const leftPanel = document.querySelector(".left-panel");
//     const unit = 1.75;
//     const a = document.querySelector("#a");
//     const block = document.querySelector("#block");
//     const mirrorContent = document.querySelector('.mirror-content');
//     const curiousContent = document.querySelector('.curious-content');
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
//     const moveFunc = (e) => { const rect = leftPanel.getBoundingClientRect(); let x = (e.clientX - rect.left) / rect.width - 0.5; let y = (e.clientY - rect.top) / rect.height - 0.5; h.style.transform = `perspective(${400*unit}vmin) rotateX(${y*30+66}deg) rotateZ(${-x*420+40}deg) translateZ(${-14*unit}vmin)`; };
//     const mouseDownFunc = () => b.addEventListener("mousemove", moveFunc);
//     const mouseUpFunc = () => b.removeEventListener("mousemove", moveFunc);
//     const playFunc = () => { h.classList.toggle("is-main-active"); a.loop = true; if (a.paused) a.play(); else { a.pause(); a.currentTime = 0; } mirrorContent.classList.toggle('is-hidden'); curiousContent.classList.toggle('is-hidden'); };
//     leftPanel.addEventListener("mousedown", mouseDownFunc);
//     b.addEventListener("mouseup", mouseUpFunc);
//     block.addEventListener("click", playFunc);
//     let lastKnownSensorData = {}; let connectionError = false; function fetchSensorData() { fetch('/get_initial_data').then(response => { if (!response.ok) throw new Error('Network response was not ok'); return response.json(); }).then(data => { lastKnownSensorData = data; connectionError = false; updateSensorUI(); }).catch(error => { console.error('Error fetching sensor data:', error); connectionError = true; updateSensorUI(); }); }
//     function updateSensorUI() { const data = lastKnownSensorData; let rightPanelContent = ''; if (!data || Object.keys(data).length === 0) { rightPanelContent = '<p class="sensor-reading"><span class="sensor-label">Status:</span> <span class="sensor-value">Waiting for data...</span></p>'; } else { rightPanelContent += `<p class="sensor-reading"><span class="sensor-label">Temperature:</span> <span class="sensor-value">${data.temperature || 'N/A'} °C</span></p>`; rightPanelContent += `<p class="sensor-reading"><span class="sensor-label">Humidity:</span> <span class="sensor-value">${data.humidity || 'N/A'} %</span></p>`; rightPanelContent += `<p class="sensor-reading"><span class="sensor-label">Rain Detected:</span> <span class="sensor-value">${data.isRaining || 'N/A'}</span></p>`; rightPanelContent += `<p class="sensor-reading"><span class="sensor-label">Fire Detected:</span> <span class="sensor-value">${data.fireDetected || 'N/A'}</span></p>`; rightPanelContent += `<p class="sensor-reading"><span class="sensor-label">Water Level:</span> <span class="sensor-value">${data.waterLevel || 'N/A'}</span></p>`; } if (connectionError) { rightPanelContent += `<p class="connection-status error">Connection lost. Retrying...</p>`; } sensorDataDiv.innerHTML = rightPanelContent; let mirrorContentText = ''; if (!data || Object.keys(data).length === 0) { mirrorContentText = '<p>Connecting...</p>'; sunIcon.style.display = 'none'; fireIcon.style.display = 'none'; clearRainEffect(); } else { mirrorContentText += `<p>Temp: ${data.temperature || 'N/A'} C</p>`; mirrorContentText += `<p>Hum: ${data.humidity || 'N/A'} %</p>`; mirrorContentText += `<p>Rain: ${data.isRaining || 'N/A'}</p>`; mirrorContentText += `<p>Fire: ${data.fireDetected || 'N/A'}</p>`; if (data.isRaining === 'Yes') createRainEffect(); else clearRainEffect(); sunIcon.style.display = (data.temperature > 20 && data.isRaining !== 'Yes') ? 'block' : 'none'; fireIcon.style.display = (data.fireDetected === 'Yes') ? 'block' : 'none'; } mirrorSensorDiv.innerHTML = mirrorContentText; }
//     function createRainEffect() { if (isRaining) return; isRaining = true; let drops = ""; for (let i = 0; i < 30; i++) { const left = Math.floor(Math.random() * 100); const duration = Math.random() * 0.5 + 0.5; const delay = Math.random() * 1; drops += `<div class="raindrop" style="left: ${left}%; animation-duration: ${duration}s; animation-delay: ${delay}s;"></div>`; } raindropContainer.innerHTML = drops; }
//     function clearRainEffect() { if (!isRaining) return; isRaining = false; raindropContainer.innerHTML = ""; }
//     let mediaRecorder; let audioChunks = []; let audioContext; function encodeWAV(samples, sampleRate) { let buffer = new ArrayBuffer(44 + samples.length * 2); let view = new DataView(buffer); function writeString(view, offset, string) { for (let i = 0; i < string.length; i++) { view.setUint8(offset + i, string.charCodeAt(i)); } } writeString(view, 0, 'RIFF'); view.setUint32(4, 36 + samples.length * 2, true); writeString(view, 8, 'WAVE'); writeString(view, 12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true); view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true); writeString(view, 36, 'data'); view.setUint32(40, samples.length * 2, true); for (let i = 0; i < samples.length; i++) { view.setInt16(44 + i * 2, samples[i] * 0x7FFF, true); } return new Blob([view], { type: 'audio/wav' }); }
//     async function startRecording() { try { audioChunks = []; const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); audioContext = new (window.AudioContext || window.webkitAudioContext)(); const source = audioContext.createMediaStreamSource(stream); const processor = audioContext.createScriptProcessor(4096, 1, 1); processor.onaudioprocess = (e) => audioChunks.push(new Float32Array(e.inputBuffer.getChannelData(0))); source.connect(processor); processor.connect(audioContext.destination); mediaRecorder = { stream: stream, stop: () => { source.disconnect(); processor.disconnect(); audioContext.close(); const fullBuffer = new Float32Array(audioChunks.reduce((acc, val) => acc + val.length, 0)); let offset = 0; for(const chunk of audioChunks) { fullBuffer.set(chunk, offset); offset += chunk.length; } const audioBlob = encodeWAV(fullBuffer, audioContext.sampleRate); sendAudioToServer(audioBlob); stream.getTracks().forEach(track => track.stop()); } }; voiceStatus.textContent = 'Status: Listening...'; startRecordingButton.disabled = true; stopRecordingButton.disabled = false; } catch (err) { console.error("Error accessing microphone:", err); voiceStatus.textContent = 'Error: Could not access microphone.'; } }
//     function stopRecording() { if (mediaRecorder) { mediaRecorder.stop(); voiceStatus.textContent = 'Status: Processing...'; mediaRecorder = null; } }
//     async function sendAudioToServer(audioBlob) { const formData = new FormData(); formData.append('audio_data', audioBlob, 'recording.wav'); const controller = new AbortController(); const timeoutId = setTimeout(() => controller.abort(), 15000); try { const response = await fetch('/process_audio', { method: 'POST', body: formData, signal: controller.signal }); clearTimeout(timeoutId); if (!response.ok) throw new Error(`Server error: ${response.status}`); const result = await response.json(); voiceStatus.textContent = `Recognized: "${result.text}"`; } catch (err) { if (err.name === 'AbortError') { voiceStatus.textContent = 'Status: Request timed out. Try again.'; } else { voiceStatus.textContent = 'Error: Failed to process audio.'; } console.error("Error sending audio to server:", err); } finally { startRecordingButton.disabled = false; stopRecordingButton.disabled = true; } }

//     // --- PART 5: MEDIAPIPE GESTURE RECOGNITION (RE-ENGINEERED) ---
//     const TIP_IDS = [4, 8, 12, 16, 20];
//     const WINDOW_SIZE = 10;
//     const REQUIRED_FRACTION = 0.7;
//     let actionWindow = [];
//     let lastStableAction = '';
//     let lastCommandTime = 0;
//     const COMMAND_COOLDOWN = 1500;
//     let lastAction = 'none'; 
//     let lastFetchTime = 0;
//     const FETCH_INTERVAL = 2000;
    
//     function sendGestureCommand(endpoint, action) {
//         if (Date.now() - lastCommandTime < COMMAND_COOLDOWN) return;
//         lastCommandTime = Date.now();
//         console.log(`Sending command to ${endpoint}: ${action}`);
//         fetch(endpoint, { 
//             method: 'POST', 
//             headers: { 'Content-Type': 'application/json' }, 
//             body: JSON.stringify({ action: action }) 
//         }).catch(err => console.error(`Error sending gesture command to ${endpoint}:`, err));
//     }

//     function fingerStates(landmarks, handedLabel) {
//         const fingers = [0, 0, 0, 0, 0];
//         fingers[0] = (handedLabel.toLowerCase() === 'right' ? landmarks[TIP_IDS[0]].x < landmarks[TIP_IDS[0] - 1].x : landmarks[TIP_IDS[0]].x > landmarks[TIP_IDS[0] - 1].x) ? 1 : 0;
//         for (let i = 1; i < 5; i++) {
//             fingers[i] = (landmarks[TIP_IDS[i]].y < landmarks[TIP_IDS[i] - 2].y) ? 1 : 0;
//         }
//         return fingers;
//     }

//     // --- REWRITTEN: New, unambiguous gesture classification ---
//     function classifyHand(landmarks, handedLabel) {
//         const states = fingerStates(landmarks, handedLabel);
//         const upCount = states.reduce((a, b) => a + b, 0);

//         // --- THE CHANGE IS HERE ---
//         // Check for the most specific gestures first to avoid conflicts.
//         // states are [Thumb, Index, Middle, Ring, Pinky]
//         if (states[0] && states[4] && !states[1] && !states[2] && !states[3]) return 'Shaka'; // Fan Off
//         if (states[1] && states[2] && states[3] && !states[0] && !states[4]) return 'Three_Fingers'; // Fan On
//         if (states[1] && states[2] && !states[0] && !states[3] && !states[4]) return 'Peace'; // Lights On
//         if (states[1] && !states[0] && !states[2] && !states[3] && !states[4]) return 'Point'; // Lights Off
        
//         // Then check for general gestures
//         if (upCount >= 4) return 'Open'; // Gate Open
//         if (upCount === 0) return 'Fist'; // Gate Close
        
//         return 'Other';
//     }
    
//     function onResults(results) {
//         const now = Date.now();
//         if (now - lastFetchTime > FETCH_INTERVAL) { fetchSensorData(); lastFetchTime = now; }
        
//         canvasCtx.save();
//         canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
//         canvasCtx.translate(canvasElement.width, 0);
//         canvasCtx.scale(-1, 1);
//         canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
        
//         let currentAction = 'Other';

//         if (results.multiHandLandmarks && results.multiHandLandmarks.length === 1) {
//             const landmarks = results.multiHandLandmarks[0];
//             const handedness = results.multiHandedness[0];
//             drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 5 });
//             drawLandmarks(canvasCtx, landmarks, { color: '#FF0000', lineWidth: 2 });
//             currentAction = classifyHand(landmarks, handedness.label);
//         }
        
//         if (currentAction !== lastAction) {
//             actionWindow = [];
//             lastAction = currentAction;
//         }

//         actionWindow.push(currentAction);
//         if (actionWindow.length > WINDOW_SIZE) actionWindow.shift();

//         const actionCounts = actionWindow.reduce((acc, val) => { if (val !== 'Other') acc[val] = (acc[val] || 0) + 1; return acc; }, {});
//         let stableAction = '';
//         if (Object.keys(actionCounts).length > 0) {
//             const topAction = Object.keys(actionCounts).reduce((a, b) => actionCounts[a] > actionCounts[b] ? a : b);
//             if (actionCounts[topAction] >= Math.floor(REQUIRED_FRACTION * actionWindow.length)) {
//                 stableAction = topAction;
//             }
//         }
        
//         if (stableAction && stableAction !== lastStableAction) {
//             lastStableAction = stableAction;
//             switch(stableAction) {
//                 case 'Three_Fingers': sendGestureCommand('/gesture_command', 'ON'); break;
//                 case 'Shaka': sendGestureCommand('/gesture_command', 'OFF'); break; // <-- UPDATED
//                 case 'Open': sendGestureCommand('/gate_gesture_command', 'OPEN_GATE'); break;
//                 case 'Fist': sendGestureCommand('/gate_gesture_command', 'CLOSE_GATE'); break;
//                 case 'Peace': sendGestureCommand('/light_gesture_command', 'LIGHTS_ON'); break;
//                 case 'Point': sendGestureCommand('/light_gesture_command', 'LIGHTS_OFF'); break;
//             }
//         } else if (!stableAction) {
//             lastStableAction = '';
//         }

//         let displayText = '';
//         if (lastStableAction) {
//             switch(lastStableAction) {
//                 case 'Three_Fingers': displayText = 'FAN ON'; break;
//                 case 'Shaka': displayText = 'FAN OFF'; break; // <-- UPDATED
//                 case 'Open': displayText = 'GATE OPEN'; break;
//                 case 'Fist': displayText = 'GATE CLOSE'; break;
//                 case 'Peace': displayText = 'LIGHTS ON'; break;
//                 case 'Point': displayText = 'LIGHTS OFF'; break;
//             }
//         }

//         if (displayText) {
//             canvasCtx.scale(-1, 1);
//             canvasCtx.fillStyle = "red";
//             canvasCtx.font = "bold 30px 'Share Tech'";
//             canvasCtx.textAlign = "center";
//             canvasCtx.fillText(displayText, -canvasElement.width / 2, 40);
//         }
//         canvasCtx.restore();
//     }
    
//     const hands = new Hands({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });
//     hands.setOptions({ 
//         maxNumHands: 1,
//         modelComplexity: 0,
//         minDetectionConfidence: 0.7, 
//         minTrackingConfidence: 0.7
//     });
//     hands.onResults(onResults);
    
//     const camera = new Camera(videoElement, { onFrame: async () => await hands.send({ image: videoElement }), width: 480, height: 360 });
//     camera.start();
    
//     fetchSensorData();
//     const sendButtonCommand = (val) => { const fd = new FormData(); fd.append('command', val); fetch('/send_command', { method: 'POST', body: fd }); };
//     turnOnButton.addEventListener('click', () => sendButtonCommand(1));
//     turnOffButton.addEventListener('click', () => sendButtonCommand(0));
//     startRecordingButton.addEventListener('click', startRecording);
//     stopRecordingButton.addEventListener('click', stopRecording);
// });









document.addEventListener('DOMContentLoaded', function() {

    // --- PART 1, 2, 3, 4: Setup, UI, Sensors, and Voice (Unchanged) ---
    const b = document.body;
    const h = document.querySelector("#h");
    const leftPanel = document.querySelector(".left-panel");
    const unit = 1.75;
    const a = document.querySelector("#a");
    const block = document.querySelector("#block");
    const mirrorContent = document.querySelector('.mirror-content');
    const curiousContent = document.querySelector('.curious-content');
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
    const moveFunc = (e) => { const rect = leftPanel.getBoundingClientRect(); let x = (e.clientX - rect.left) / rect.width - 0.5; let y = (e.clientY - rect.top) / rect.height - 0.5; h.style.transform = `perspective(${400*unit}vmin) rotateX(${y*30+66}deg) rotateZ(${-x*420+40}deg) translateZ(${-14*unit}vmin)`; };
    const mouseDownFunc = () => b.addEventListener("mousemove", moveFunc);
    const mouseUpFunc = () => b.removeEventListener("mousemove", moveFunc);
    const playFunc = () => { h.classList.toggle("is-main-active"); a.loop = true; if (a.paused) a.play(); else { a.pause(); a.currentTime = 0; } mirrorContent.classList.toggle('is-hidden'); curiousContent.classList.toggle('is-hidden'); };
    leftPanel.addEventListener("mousedown", mouseDownFunc);
    b.addEventListener("mouseup", mouseUpFunc);
    block.addEventListener("click", playFunc);
    let lastKnownSensorData = {}; let connectionError = false; function fetchSensorData() { fetch('/get_initial_data').then(response => { if (!response.ok) throw new Error('Network response was not ok'); return response.json(); }).then(data => { lastKnownSensorData = data; connectionError = false; updateSensorUI(); }).catch(error => { console.error('Error fetching sensor data:', error); connectionError = true; updateSensorUI(); }); }
    function updateSensorUI() { const data = lastKnownSensorData; let rightPanelContent = ''; if (!data || Object.keys(data).length === 0) { rightPanelContent = '<p class="sensor-reading"><span class="sensor-label">Status:</span> <span class="sensor-value">Waiting for data...</span></p>'; } else { rightPanelContent += `<p class="sensor-reading"><span class="sensor-label">Temperature:</span> <span class="sensor-value">${data.temperature || 'N/A'} °C</span></p>`; rightPanelContent += `<p class="sensor-reading"><span class="sensor-label">Humidity:</span> <span class="sensor-value">${data.humidity || 'N/A'} %</span></p>`; rightPanelContent += `<p class="sensor-reading"><span class="sensor-label">Rain Detected:</span> <span class="sensor-value">${data.isRaining || 'N/A'}</span></p>`; rightPanelContent += `<p class="sensor-reading"><span class="sensor-label">Fire Detected:</span> <span class="sensor-value">${data.fireDetected || 'N/A'}</span></p>`; rightPanelContent += `<p class="sensor-reading"><span class="sensor-label">Water Level:</span> <span class="sensor-value">${data.waterLevel || 'N/A'}</span></p>`; } if (connectionError) { rightPanelContent += `<p class="connection-status error">Connection lost. Retrying...</p>`; } sensorDataDiv.innerHTML = rightPanelContent; let mirrorContentText = ''; if (!data || Object.keys(data).length === 0) { mirrorContentText = '<p>Connecting...</p>'; sunIcon.style.display = 'none'; fireIcon.style.display = 'none'; clearRainEffect(); } else { mirrorContentText += `<p>Temp: ${data.temperature || 'N/A'} C</p>`; mirrorContentText += `<p>Hum: ${data.humidity || 'N/A'} %</p>`; mirrorContentText += `<p>Rain: ${data.isRaining || 'N/A'}</p>`; mirrorContentText += `<p>Fire: ${data.fireDetected || 'N/A'}</p>`; if (data.isRaining === 'Yes') createRainEffect(); else clearRainEffect(); sunIcon.style.display = (data.temperature > 20 && data.isRaining !== 'Yes') ? 'block' : 'none'; fireIcon.style.display = (data.fireDetected === 'Yes') ? 'block' : 'none'; } mirrorSensorDiv.innerHTML = mirrorContentText; }
    function createRainEffect() { if (isRaining) return; isRaining = true; let drops = ""; for (let i = 0; i < 30; i++) { const left = Math.floor(Math.random() * 100); const duration = Math.random() * 0.5 + 0.5; const delay = Math.random() * 1; drops += `<div class="raindrop" style="left: ${left}%; animation-duration: ${duration}s; animation-delay: ${delay}s;"></div>`; } raindropContainer.innerHTML = drops; }
    function clearRainEffect() { if (!isRaining) return; isRaining = false; raindropContainer.innerHTML = ""; }
    let mediaRecorder; let audioChunks = []; let audioContext; function encodeWAV(samples, sampleRate) { let buffer = new ArrayBuffer(44 + samples.length * 2); let view = new DataView(buffer); function writeString(view, offset, string) { for (let i = 0; i < string.length; i++) { view.setUint8(offset + i, string.charCodeAt(i)); } } writeString(view, 0, 'RIFF'); view.setUint32(4, 36 + samples.length * 2, true); writeString(view, 8, 'WAVE'); writeString(view, 12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true); view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true); writeString(view, 36, 'data'); view.setUint32(40, samples.length * 2, true); for (let i = 0; i < samples.length; i++) { view.setInt16(44 + i * 2, samples[i] * 0x7FFF, true); } return new Blob([view], { type: 'audio/wav' }); }
    async function startRecording() { try { audioChunks = []; const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); audioContext = new (window.AudioContext || window.webkitAudioContext)(); const source = audioContext.createMediaStreamSource(stream); const processor = audioContext.createScriptProcessor(4096, 1, 1); processor.onaudioprocess = (e) => audioChunks.push(new Float32Array(e.inputBuffer.getChannelData(0))); source.connect(processor); processor.connect(audioContext.destination); mediaRecorder = { stream: stream, stop: () => { source.disconnect(); processor.disconnect(); audioContext.close(); const fullBuffer = new Float32Array(audioChunks.reduce((acc, val) => acc + val.length, 0)); let offset = 0; for(const chunk of audioChunks) { fullBuffer.set(chunk, offset); offset += chunk.length; } const audioBlob = encodeWAV(fullBuffer, audioContext.sampleRate); sendAudioToServer(audioBlob); stream.getTracks().forEach(track => track.stop()); } }; voiceStatus.textContent = 'Status: Listening...'; startRecordingButton.disabled = true; stopRecordingButton.disabled = false; } catch (err) { console.error("Error accessing microphone:", err); voiceStatus.textContent = 'Error: Could not access microphone.'; } }
    function stopRecording() { if (mediaRecorder) { mediaRecorder.stop(); voiceStatus.textContent = 'Status: Processing...'; mediaRecorder = null; } }
    async function sendAudioToServer(audioBlob) { const formData = new FormData(); formData.append('audio_data', audioBlob, 'recording.wav'); const controller = new AbortController(); const timeoutId = setTimeout(() => controller.abort(), 15000); try { const response = await fetch('/process_audio', { method: 'POST', body: formData, signal: controller.signal }); clearTimeout(timeoutId); if (!response.ok) throw new Error(`Server error: ${response.status}`); const result = await response.json(); voiceStatus.textContent = `Recognized: "${result.text}"`; } catch (err) { if (err.name === 'AbortError') { voiceStatus.textContent = 'Status: Request timed out. Try again.'; } else { voiceStatus.textContent = 'Error: Failed to process audio.'; } console.error("Error sending audio to server:", err); } finally { startRecordingButton.disabled = false; stopRecordingButton.disabled = true; } }

    // --- PART 5: MEDIAPIPE GESTURE RECOGNITION (RE-ENGINEERED FOR MAXIMUM STABILITY) ---
    const TIP_IDS = [4, 8, 12, 16, 20];

    // --- STABILITY CONTROLS (ADJUST THESE FOR MORE/LESS SENSITIVITY) ---
    const STABILITY_THRESHOLD = 25;   // How many consecutive frames of the same gesture are needed.
    const COMMAND_COOLDOWN = 3000;    // 3-second delay between sending commands.

    let lastCommandTime = 0;
    let lastActionSent = '';          // Stores the last action that successfully sent a command.
    
    // --- State for the new stability logic ---
    let potentialAction = 'none';     // The gesture we are currently tracking.
    let consecutiveFrames = 0;        // How many frames in a row we've seen this gesture.

    let lastFetchTime = 0;
    const FETCH_INTERVAL = 2000;
    
    function sendGestureCommand(endpoint, action) {
        if (Date.now() - lastCommandTime < COMMAND_COOLDOWN) {
            console.log(`COMMAND BLOCKED by cooldown. Tried to send ${action}.`);
            return;
        }
        lastCommandTime = Date.now();
        console.log(`>>> COMMAND SENT to ${endpoint}: ${action}`);
        fetch(endpoint, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ action: action }) 
        }).catch(err => console.error(`Error sending gesture command to ${endpoint}:`, err));
    }

    // Unchanged as requested.
    function fingerStates(landmarks, handedLabel) {
        const fingers = [0, 0, 0, 0, 0];
        fingers[0] = (handedLabel.toLowerCase() === 'right' ? landmarks[TIP_IDS[0]].x < landmarks[TIP_IDS[0] - 1].x : landmarks[TIP_IDS[0]].x > landmarks[TIP_IDS[0] - 1].x) ? 1 : 0;
        for (let i = 1; i < 5; i++) {
            fingers[i] = (landmarks[TIP_IDS[i]].y < landmarks[TIP_IDS[i] - 2].y) ? 1 : 0;
        }
        return fingers;
    }

    // Unchanged as requested.
    function classifyHand(landmarks, handedLabel) {
        const states = fingerStates(landmarks, handedLabel);
        const upCount = states.reduce((a, b) => a + b, 0);

        if (states[1] && states[2] && states[3] && !states[0] && !states[4]) return 'Three_Fingers'; // Fan On
        if (states[0] && states[4] && !states[1] && !states[2] && !states[3]) return 'Shaka'; // Fan Off
        if (states[1] && states[2] && !states[0] && !states[3] && !states[4]) return 'Peace'; // Lights On
        if (states[1] && !states[0] && !states[2] && !states[3] && !states[4]) return 'Point'; // Lights Off
        if (upCount >= 4) return 'Open'; // Gate Open
        if (upCount === 0) return 'Fist'; // Gate Close
        
        return 'Other';
    }
    
    function onResults(results) {
        const now = Date.now();
        if (now - lastFetchTime > FETCH_INTERVAL) { fetchSensorData(); }
        
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        canvasCtx.translate(canvasElement.width, 0);
        canvasCtx.scale(-1, 1);
        canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
        
        let currentAction = 'none';

        if (results.multiHandLandmarks && results.multiHandLandmarks.length === 1) {
            const landmarks = results.multiHandLandmarks[0];
            const handedness = results.multiHandedness[0];
            drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 5 });
            drawLandmarks(canvasCtx, landmarks, { color: '#FF0000', lineWidth: 2 });
            currentAction = classifyHand(landmarks, handedness.label);
        }
        
        // --- NEW, STRICTER STABILITY LOGIC ---
        if (currentAction !== 'none' && currentAction !== 'Other') {
            if (currentAction === potentialAction) {
                // If we see the same gesture again, increment the counter.
                consecutiveFrames++;
            } else {
                // If the gesture changes, reset the counter and start tracking the new one.
                potentialAction = currentAction;
                consecutiveFrames = 1;
            }
        } else {
            // If no valid gesture is detected (or multiple hands), reset everything.
            potentialAction = 'none';
            consecutiveFrames = 0;
        }

        // --- TRIGGER COMMAND LOGIC ---
        if (consecutiveFrames >= STABILITY_THRESHOLD) {
            if (potentialAction !== lastActionSent) {
                console.log(`Stable action '${potentialAction}' detected for ${consecutiveFrames} frames.`);
                lastActionSent = potentialAction;
                
                switch(lastActionSent) {
                    case 'Three_Fingers': sendGestureCommand('/gesture_command', 'ON'); break;
                    case 'Shaka': sendGestureCommand('/gesture_command', 'OFF'); break;
                    case 'Open': sendGestureCommand('/gate_gesture_command', 'OPEN_GATE'); break;
                    case 'Fist': sendGestureCommand('/gate_gesture_command', 'CLOSE_GATE'); break;
                    case 'Peace': sendGestureCommand('/light_gesture_command', 'LIGHTS_ON'); break;
                    case 'Point': sendGestureCommand('/light_gesture_command', 'LIGHTS_OFF'); break;
                }
            }
        } else {
            // If the gesture is no longer stable, we clear the `lastActionSent`.
            // This allows the same command to be triggered again later.
            lastActionSent = '';
        }

        // --- DISPLAY LOGIC ---
        let displayText = '';
        if (lastActionSent) {
            // If a command was just sent, display it firmly.
            switch(lastActionSent) {
                case 'Three_Fingers': displayText = 'FAN ON'; break;
                case 'Shaka': displayText = 'FAN OFF'; break;
                case 'Open': displayText = 'GATE OPEN'; break;
                case 'Fist': displayText = 'GATE CLOSE'; break;
                case 'Peace': displayText = 'LIGHTS ON'; break;
                case 'Point': displayText = 'LIGHTS OFF'; break;
            }
        } else if (potentialAction !== 'none') {
            // Show what the system is currently "thinking" and its progress towards stability.
            const progress = Math.min(100, Math.round((consecutiveFrames / STABILITY_THRESHOLD) * 100));
            let potentialText = potentialAction.replace('_', ' ');
            displayText = `${potentialText}? (${progress}%)`;
        }

        if (displayText) {
            canvasCtx.scale(-1, 1);
            canvasCtx.fillStyle = "red";
            canvasCtx.font = "bold 30px 'Share Tech'";
            canvasCtx.textAlign = "center";
            canvasCtx.fillText(displayText, -canvasElement.width / 2, 40);
        }
        canvasCtx.restore();
    }
    
    const hands = new Hands({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });
    hands.setOptions({ 
        maxNumHands: 1,
        modelComplexity: 1, 
        minDetectionConfidence: 0.85, // Stricter detection to avoid noise.
        minTrackingConfidence: 0.85   // Stricter tracking for stability.
    });
    hands.onResults(onResults);
    
    const camera = new Camera(videoElement, { onFrame: async () => await hands.send({ image: videoElement }), width: 480, height: 360 });
    camera.start();
    
    fetchSensorData();
    const sendButtonCommand = (val) => { const fd = new FormData(); fd.append('command', val); fetch('/send_command', { method: 'POST', body: fd }); };
    turnOnButton.addEventListener('click', () => sendButtonCommand(1));
    turnOffButton.addEventListener('click', () => sendButtonCommand(0));
    startRecordingButton.addEventListener('click', startRecording);
    stopRecordingButton.addEventListener('click', stopRecording);
});