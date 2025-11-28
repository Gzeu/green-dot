// Green Dot Web App - Wake Lock Implementation

class GreenDotWeb {
    constructor() {
        this.wakeLock = null;
        this.isActive = false;
        this.startTime = null;
        this.timerInterval = null;
        this.batteryManager = null;
        
        // DOM elements
        this.statusDot = document.getElementById('statusDot');
        this.statusIcon = document.getElementById('statusIcon');
        this.statusText = document.getElementById('statusText');
        this.pulseRing = document.getElementById('pulseRing');
        this.timer = document.getElementById('timer');
        this.toggleBtn = document.getElementById('toggleBtn');
        this.btnIcon = document.getElementById('btnIcon');
        this.btnText = document.getElementById('btnText');
        this.sessionTime = document.getElementById('sessionTime');
        this.batteryEl = document.getElementById('battery');
        this.connectionStatus = document.getElementById('connectionStatus');
        this.logContainer = document.getElementById('logContainer');
        
        this.init();
    }
    
    async init() {
        // Check Wake Lock API support
        if (!('wakeLock' in navigator)) {
            this.addLog('❌ Wake Lock API not supported', 'error');
            this.showError('Your browser does not support Wake Lock API. Please use Chrome, Edge, or Safari.');
            return;
        }
        
        // Set up event listeners
        this.toggleBtn.addEventListener('click', () => this.toggle());
        
        // Handle visibility changes
        document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
        
        // Initialize battery monitoring
        await this.initBattery();
        
        // Initial log
        this.addLog('✅ Ready to start', 'info');
        
        // Check HTTPS
        if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
            this.showError('Wake Lock requires HTTPS connection');
        }
    }
    
    async initBattery() {
        if ('getBattery' in navigator) {
            try {
                this.batteryManager = await navigator.getBattery();
                this.updateBatteryStatus();
                
                this.batteryManager.addEventListener('levelchange', () => this.updateBatteryStatus());
                this.batteryManager.addEventListener('chargingchange', () => this.updateBatteryStatus());
            } catch (error) {
                console.log('Battery API not available');
                this.batteryEl.textContent = 'N/A';
            }
        } else {
            this.batteryEl.textContent = 'N/A';
        }
    }
    
    updateBatteryStatus() {
        if (!this.batteryManager) return;
        
        const level = Math.floor(this.batteryManager.level * 100);
        const charging = this.batteryManager.charging ? '⚡' : '';
        this.batteryEl.textContent = `${level}%${charging}`;
        
        // Warn on low battery
        if (level < 20 && !this.batteryManager.charging && this.isActive) {
            this.addLog('⚠️ Low battery - consider charging', 'warning');
        }
    }
    
    async toggle() {
        if (this.isActive) {
            await this.stop();
        } else {
            await this.start();
        }
    }
    
    async start() {
        try {
            // Request wake lock
            this.wakeLock = await navigator.wakeLock.request('screen');
            
            // Handle wake lock release
            this.wakeLock.addEventListener('release', () => {
                console.log('Wake lock released');
            });
            
            this.isActive = true;
            this.startTime = Date.now();
            
            // Update UI
            this.updateUI();
            this.startTimer();
            
            // Log
            this.addLog('🟢 Keep Active started', 'success');
            
        } catch (error) {
            console.error('Failed to acquire wake lock:', error);
            this.addLog(`❌ Failed to start: ${error.message}`, 'error');
            this.showError('Failed to activate. Make sure the tab is visible and you have permission.');
        }
    }
    
    async stop() {
        if (this.wakeLock) {
            await this.wakeLock.release();
            this.wakeLock = null;
        }
        
        this.isActive = false;
        this.stopTimer();
        this.updateUI();
        
        this.addLog('⏹️ Keep Active stopped', 'info');
    }
    
    async handleVisibilityChange() {
        if (document.visibilityState === 'visible' && this.isActive && !this.wakeLock) {
            // Re-acquire wake lock when tab becomes visible
            this.addLog('🔄 Tab visible - reacquiring lock', 'info');
            await this.start();
        }
    }
    
    updateUI() {
        if (this.isActive) {
            // Active state
            this.statusDot.classList.add('active');
            this.pulseRing.classList.add('active');
            this.statusIcon.classList.add('active');
            this.statusIcon.textContent = '🟢';
            this.statusText.textContent = 'Keeping Active';
            this.toggleBtn.classList.add('active');
            this.btnIcon.textContent = '⏹️';
            this.btnText.textContent = 'Stop';
            this.connectionStatus.textContent = 'Active';
        } else {
            // Inactive state
            this.statusDot.classList.remove('active');
            this.pulseRing.classList.remove('active');
            this.statusIcon.classList.remove('active');
            this.statusIcon.textContent = '⏸️';
            this.statusText.textContent = 'Ready to Start';
            this.toggleBtn.classList.remove('active');
            this.btnIcon.textContent = '▶️';
            this.btnText.textContent = 'Start Keeping Active';
            this.timer.textContent = '00:00:00';
            this.connectionStatus.textContent = 'Inactive';
        }
    }
    
    startTimer() {
        this.timerInterval = setInterval(() => {
            if (this.startTime) {
                const elapsed = Date.now() - this.startTime;
                const hours = Math.floor(elapsed / 3600000);
                const minutes = Math.floor((elapsed % 3600000) / 60000);
                const seconds = Math.floor((elapsed % 60000) / 1000);
                
                this.timer.textContent = 
                    `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
                
                // Update session time
                if (minutes < 60) {
                    this.sessionTime.textContent = `${minutes}m`;
                } else {
                    this.sessionTime.textContent = `${hours}h ${minutes % 60}m`;
                }
            }
        }, 1000);
    }
    
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.startTime = null;
        this.sessionTime.textContent = '0m';
    }
    
    addLog(message, type = 'info') {
        const time = new Date().toLocaleTimeString();
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.innerHTML = `
            <span class="log-time">${time}</span>
            <span class="log-message">${message}</span>
        `;
        
        this.logContainer.insertBefore(entry, this.logContainer.firstChild);
        
        // Keep only last 20 entries
        while (this.logContainer.children.length > 20) {
            this.logContainer.removeChild(this.logContainer.lastChild);
        }
    }
    
    showError(message) {
        alert(message);
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new GreenDotWeb();
    });
} else {
    new GreenDotWeb();
}