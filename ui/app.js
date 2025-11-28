// Tauri API
const { invoke } = window.__TAURI__.tauri;
const { listen } = window.__TAURI__.event;
const { open } = window.__TAURI__.shell;

// State
let isRunning = false;
let isPaused = false;
let startTime = null;
let activityCount = 0;
let uptimeInterval = null;

// DOM Elements
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const stopBtn = document.getElementById('stopBtn');
const uptimeEl = document.getElementById('uptime');
const activityCountEl = document.getElementById('activityCount');
const lastTriggerEl = document.getElementById('lastTrigger');
const logEntriesEl = document.getElementById('logEntries');
const githubLink = document.getElementById('githubLink');

// Config inputs
const intervalInput = document.getElementById('interval');
const adaptiveInput = document.getElementById('adaptive');
const burstInput = document.getElementById('burst');
const idleCheckInput = document.getElementById('idleCheck');

// Initialize
async function init() {
    try {
        // Load saved config
        const config = await invoke('load_config');
        intervalInput.value = config.interval;
        adaptiveInput.checked = config.adaptive;
        burstInput.checked = config.burst;
        idleCheckInput.checked = config.idle_check;
        
        addLog('Application initialized');
    } catch (error) {
        console.error('Failed to load config:', error);
        addLog('Failed to load configuration', 'error');
    }

    // Listen for tray events
    await listen('tray-event', (event) => {
        const action = event.payload;
        if (action === 'start') {
            handleStart();
        } else if (action === 'pause') {
            handlePause();
        } else if (action === 'stop') {
            handleStop();
        }
    });
}

// Get current config
function getConfig() {
    return {
        interval: parseInt(intervalInput.value),
        adaptive: adaptiveInput.checked,
        burst: burstInput.checked,
        idle_check: idleCheckInput.checked,
        low_priority: true
    };
}

// Start
async function handleStart() {
    if (isRunning) return;
    
    try {
        const config = getConfig();
        
        // Save config
        await invoke('save_config', { config });
        
        // Start green dot
        const result = await invoke('start_green_dot', { config });
        
        isRunning = true;
        isPaused = false;
        startTime = Date.now();
        activityCount = 0;
        
        updateUI();
        startUptimeCounter();
        addLog('Green Dot started', 'success');
        addLog(`Interval: ${config.interval} minutes, AI Adaptive: ${config.adaptive ? 'Yes' : 'No'}`);
        
    } catch (error) {
        console.error('Failed to start:', error);
        addLog('Failed to start: ' + error, 'error');
    }
}

// Pause
async function handlePause() {
    if (!isRunning || isPaused) return;
    
    isPaused = true;
    updateUI();
    addLog('Paused', 'warning');
}

// Stop
async function handleStop() {
    if (!isRunning) return;
    
    try {
        await invoke('stop_green_dot');
        
        isRunning = false;
        isPaused = false;
        startTime = null;
        
        stopUptimeCounter();
        updateUI();
        addLog('Green Dot stopped', 'info');
        
    } catch (error) {
        console.error('Failed to stop:', error);
        addLog('Failed to stop: ' + error, 'error');
    }
}

// Update UI based on state
function updateUI() {
    if (isRunning && !isPaused) {
        statusDot.classList.add('active');
        statusText.textContent = 'Active';
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        stopBtn.disabled = false;
        document.querySelector('.pulse-ring').classList.add('active');
    } else if (isRunning && isPaused) {
        statusDot.classList.remove('active');
        statusText.textContent = 'Paused';
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        stopBtn.disabled = false;
        document.querySelector('.pulse-ring').classList.remove('active');
    } else {
        statusDot.classList.remove('active');
        statusText.textContent = 'Inactive';
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        stopBtn.disabled = true;
        document.querySelector('.pulse-ring').classList.remove('active');
        uptimeEl.textContent = '00:00:00';
    }
}

// Uptime counter
function startUptimeCounter() {
    if (uptimeInterval) clearInterval(uptimeInterval);
    
    uptimeInterval = setInterval(() => {
        if (startTime && !isPaused) {
            const elapsed = Date.now() - startTime;
            const hours = Math.floor(elapsed / 3600000);
            const minutes = Math.floor((elapsed % 3600000) / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            
            uptimeEl.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
    }, 1000);
}

function stopUptimeCounter() {
    if (uptimeInterval) {
        clearInterval(uptimeInterval);
        uptimeInterval = null;
    }
}

// Add log entry
function addLog(message, type = 'info') {
    const time = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = `
        <span class="time">${time}</span>
        <span class="message">${message}</span>
    `;
    
    logEntriesEl.insertBefore(entry, logEntriesEl.firstChild);
    
    // Keep only last 50 entries
    while (logEntriesEl.children.length > 50) {
        logEntriesEl.removeChild(logEntriesEl.lastChild);
    }
    
    // Update activity count for successful triggers
    if (message.includes('Keep-alive sent') || message.includes('started')) {
        activityCount++;
        activityCountEl.textContent = activityCount;
        lastTriggerEl.textContent = time;
    }
}

// Event listeners
startBtn.addEventListener('click', handleStart);
pauseBtn.addEventListener('click', handlePause);
stopBtn.addEventListener('click', handleStop);

// Save config on change
[intervalInput, adaptiveInput, burstInput, idleCheckInput].forEach(input => {
    input.addEventListener('change', async () => {
        try {
            const config = getConfig();
            await invoke('save_config', { config });
            addLog('Configuration saved');
        } catch (error) {
            console.error('Failed to save config:', error);
        }
    });
});

// GitHub link
githubLink.addEventListener('click', async (e) => {
    e.preventDefault();
    await open('https://github.com/Gzeu/green-dot');
});

// Initialize app
init();

// Simulate activity updates (for demo - replace with real IPC events)
if (process.env.NODE_ENV === 'development') {
    setInterval(() => {
        if (isRunning && !isPaused && Math.random() > 0.7) {
            const methods = ['F13', 'F14', 'F15', 'Shift'];
            const method = methods[Math.floor(Math.random() * methods.length)];
            addLog(`🟢 Keep-alive sent (Method: ${method})`, 'success');
        }
    }, 30000);
}