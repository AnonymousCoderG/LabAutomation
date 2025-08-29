/*
	Designed by: Alex Harris 
	Original Image: https://www.artstation.com/artwork/vBYdY
*/

const b = document.body;
const h = document.querySelector("#h");
const leftPanel = document.querySelector(".left-panel");
const unit = 1.75;
let isRaining = false;

// --- Elements for restored dance functionality ---
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

// --- MODIFIED function for music, dance, and content toggle ---
const playFunc = () => {
	// Toggle the dance animation and music
	h.classList.toggle("is-main-active");
	a.loop = true;
	if (a.paused) {
		a.play();
	} else {
		a.pause();
		a.currentTime = 0;
	}

    // Toggle between sensor display and "Be Curious" message
    mirrorContent.classList.toggle('is-hidden');
    curiousContent.classList.toggle('is-hidden');
};
/*****************/
// Attach listeners
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
                // --- Update Right Panel (Control Panel) ---
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

                // --- Update Left Panel (3D Mirror) ---
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
                    
                    if (data.isRaining === 'Yes') {
                        createRainEffect();
                    } else {
                        clearRainEffect();
                    }
                    
                    if (data.temperature > 20 && data.isRaining !== 'Yes') {
                         sunIcon.style.display = 'block';
                    } else {
                         sunIcon.style.display = 'none';
                    }

                    if (data.fireDetected === 'Yes') {
                        fireIcon.style.display = 'block';
                    } else {
                        fireIcon.style.display = 'none';
                    }
                }
                mirrorSensorDiv.innerHTML = mirrorContent;
            })
            .catch(error => {
                console.error('Error fetching sensor data:', error);
                sensorDataDiv.innerHTML = '<p>Error loading data.</p>';
                mirrorSensorDiv.innerHTML = '<p>Connection Lost</p>';
            });
    }

    // --- Command and Voice Functions (unchanged) ---
    function sendCommand(commandValue) {
        const formData = new FormData();
        formData.append('command', commandValue);
        fetch('/send_command', { method: 'POST', body: formData })
            .then(response => response.text())
            .then(result => console.log(result))
            .catch(error => console.error('Error sending command:', error));
    }

    function startRecording() {
        fetch('/start', { method: 'POST' })
            .then(response => response.json())
            .then(data => {
                if(data.status === "Recording started") {
                    voiceStatus.textContent = 'Status: Listening...';
                }
            });
    }

    function stopRecording() {
        voiceStatus.textContent = 'Status: Processing...';
        fetch('/stop', { method: 'POST' })
            .then(response => response.json())
            .then(data => {
                voiceStatus.textContent = `Recognized: ${data.text || 'Nothing'}`;
            });
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