// Wenlock Hospital Smart Display System - Patient Display JavaScript

class PatientDisplay {
    constructor() {
        this.updateInterval = 15000; // 15 seconds for patient display
        this.intervals = [];
        this.alertSound = null;
        this.init();
    }

    init() {
        this.loadPatientData();
        this.startAutoRefresh();
        this.setupAlertSound();
    }

    setupAlertSound() {
        // Create audio context for alert sounds (if needed)
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Audio context not supported');
        }
    }

    async loadPatientData() {
        try {
            await Promise.all([
                this.loadCurrentTokens(),
                this.loadQueue(),
                this.loadAlerts()
            ]);
        } catch (error) {
            console.error('Error loading patient data:', error);
            this.showError('Unable to load current information');
        }
    }

    async loadCurrentTokens() {
        try {
            const response = await fetch('/api/tokens');
            const data = await response.json();
            this.displayCurrentTokens(data.current_tokens || {});
        } catch (error) {
            console.error('Error loading current tokens:', error);
            this.displayCurrentTokens({});
        }
    }

    displayCurrentTokens(currentTokens) {
        const currentTokensContainer = document.getElementById('currentTokensContainer');
        if (!currentTokensContainer) return;

        const departments = Object.keys(currentTokens);
        
        if (departments.length === 0) {
            currentTokensContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clock"></i>
                    <h3>No Active Consultations</h3>
                    <p>Please wait for announcements</p>
                </div>
            `;
            return;
        }

        const tokensHtml = departments.map(dept => {
            const tokenNumber = currentTokens[dept];
            return `
                <div class="col-md-6 col-lg-4 mb-4">
                    <div class="token-display">
                        <div class="token-number">${tokenNumber}</div>
                        <div class="token-label">${this.formatDepartmentName(dept)}</div>
                        <div class="mt-2">
                            <span class="status-indicator status-available"></span>
                            <small>Now Serving</small>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        currentTokensContainer.innerHTML = `<div class="row">${tokensHtml}</div>`;
    }

    async loadQueue() {
        try {
            const response = await fetch('/api/tokens');
            const data = await response.json();
            this.displayQueue(data.queue || {});
        } catch (error) {
            console.error('Error loading queue:', error);
            this.displayQueue({});
        }
    }

    displayQueue(queue) {
        const queueContainer = document.getElementById('queueContainer');
        if (!queueContainer) return;

        const departments = Object.keys(queue);
        
        if (departments.length === 0) {
            queueContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users"></i>
                    <h3>No Queue Information</h3>
                    <p>Queue information will appear here</p>
                </div>
            `;
            return;
        }

        const queueHtml = departments.map(dept => {
            const queueList = queue[dept] || [];
            const queueItems = queueList.slice(0, 10).map(item => `
                <div class="queue-item">
                    <div>
                        <div class="queue-number">${item.token_number}</div>
                        <small class="text-muted">${item.patient_type || 'General'}</small>
                    </div>
                    <div class="queue-status ${item.status || 'waiting'}">${this.formatStatus(item.status || 'waiting')}</div>
                </div>
            `).join('');

            return `
                <div class="col-md-6 mb-4">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">
                                <i class="fas fa-stethoscope me-2"></i>
                                ${this.formatDepartmentName(dept)}
                            </h5>
                        </div>
                        <div class="card-body">
                            ${queueItems || '<p class="text-muted">No patients in queue</p>'}
                            ${queueList.length > 10 ? `<small class="text-muted">... and ${queueList.length - 10} more</small>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        queueContainer.innerHTML = `<div class="row">${queueHtml}</div>`;
    }

    async loadAlerts() {
        try {
            const response = await fetch('/api/alerts');
            const data = await response.json();
            this.displayAlerts(data.active_alerts || []);
        } catch (error) {
            console.error('Error loading alerts:', error);
            this.displayAlerts([]);
        }
    }

    displayAlerts(alerts) {
        const alertsContainer = document.getElementById('alertsContainer');
        if (!alertsContainer) return;

        // Filter alerts relevant to patients
        const patientAlerts = alerts.filter(alert => 
            alert.type !== 'staff_only' && alert.active
        );

        if (patientAlerts.length === 0) {
            alertsContainer.innerHTML = '';
            return;
        }

        const alertsHtml = patientAlerts.map(alert => {
            const alertClass = this.getAlertClass(alert.type);
            const alertIcon = this.getAlertIcon(alert.type);
            
            return `
                <div class="alert alert-${alertClass} alert-dismissible" role="alert">
                    <div class="d-flex align-items-start">
                        <i class="${alertIcon} me-3 mt-1"></i>
                        <div class="flex-grow-1">
                            <strong>${this.getAlertTitle(alert.type)}</strong>
                            <div>${alert.message}</div>
                            ${alert.location ? `<small class="text-muted mt-1 d-block"><i class="fas fa-map-marker-alt"></i> ${alert.location}</small>` : ''}
                        </div>
                        <small class="text-muted ms-3">${this.formatTime(alert.timestamp)}</small>
                    </div>
                </div>
            `;
        }).join('');

        alertsContainer.innerHTML = alertsHtml;

        // Play alert sound for critical alerts
        const criticalAlerts = patientAlerts.filter(alert => 
            alert.type === 'code_red' || alert.type === 'emergency'
        );
        
        if (criticalAlerts.length > 0) {
            this.playAlertSound();
        }
    }

    playAlertSound() {
        // Simple beep sound using Web Audio API
        if (this.audioContext) {
            try {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
                
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.5);
            } catch (e) {
                console.log('Unable to play alert sound:', e);
            }
        }
    }

    startAutoRefresh() {
        // Update data every 15 seconds
        this.intervals.push(setInterval(() => this.loadPatientData(), this.updateInterval));
        
        // Update time display every second
        this.intervals.push(setInterval(() => this.updateTimeDisplay(), 1000));
    }

    updateTimeDisplay() {
        const timeElement = document.getElementById('currentTime');
        if (timeElement) {
            const now = new Date();
            const timeString = now.toLocaleString('en-IN', {
                timeZone: 'Asia/Kolkata',
                hour12: true,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            timeElement.textContent = timeString;
        }
    }

    formatDepartmentName(dept) {
        const departmentNames = {
            'general': 'General Medicine',
            'cardiology': 'Cardiology',
            'orthopedics': 'Orthopedics',
            'pediatrics': 'Pediatrics',
            'gynecology': 'Gynecology',
            'surgery': 'Surgery',
            'ent': 'ENT',
            'dermatology': 'Dermatology',
            'ophthalmology': 'Ophthalmology',
            'psychiatry': 'Psychiatry'
        };
        return departmentNames[dept.toLowerCase()] || dept.charAt(0).toUpperCase() + dept.slice(1);
    }

    formatStatus(status) {
        const statusMap = {
            'waiting': 'Waiting',
            'in-progress': 'In Progress',
            'completed': 'Completed',
            'called': 'Called'
        };
        return statusMap[status] || status.charAt(0).toUpperCase() + status.slice(1);
    }

    getAlertClass(type) {
        const alertClasses = {
            'code_blue': 'code-blue',
            'code_red': 'code-red',
            'general': 'warning',
            'emergency': 'code-red',
            'maintenance': 'info'
        };
        return alertClasses[type] || 'info';
    }

    getAlertIcon(type) {
        const alertIcons = {
            'code_blue': 'fas fa-heartbeat',
            'code_red': 'fas fa-fire',
            'general': 'fas fa-info-circle',
            'emergency': 'fas fa-exclamation-triangle',
            'maintenance': 'fas fa-wrench'
        };
        return alertIcons[type] || 'fas fa-bell';
    }

    getAlertTitle(type) {
        const alertTitles = {
            'code_blue': 'MEDICAL EMERGENCY',
            'code_red': 'FIRE EMERGENCY',
            'general': 'HOSPITAL NOTICE',
            'emergency': 'EMERGENCY ALERT',
            'maintenance': 'MAINTENANCE NOTICE'
        };
        return alertTitles[type] || 'NOTICE';
    }

    formatTime(timestamp) {
        if (!timestamp) return 'N/A';
        const date = new Date(timestamp);
        return date.toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            hour12: true,
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    showError(message) {
        const errorContainer = document.getElementById('errorContainer');
        if (errorContainer) {
            errorContainer.innerHTML = `
                <div class="alert alert-danger" role="alert">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    ${message}
                </div>
            `;
            setTimeout(() => {
                errorContainer.innerHTML = '';
            }, 5000);
        }
    }

    destroy() {
        this.intervals.forEach(interval => clearInterval(interval));
        this.intervals = [];
        
        if (this.audioContext) {
            this.audioContext.close();
        }
    }
}

// Initialize patient display when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.patientDisplay = new PatientDisplay();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.patientDisplay) {
        window.patientDisplay.destroy();
    }
});
