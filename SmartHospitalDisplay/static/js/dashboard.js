// Wenlock Hospital Smart Display System - Dashboard JavaScript

class HospitalDashboard {
    constructor() {
        this.updateInterval = 30000; // 30 seconds
        this.intervals = [];
        this.init();
    }

    init() {
        this.updateCurrentTime();
        this.loadOverviewData();
        this.startAutoRefresh();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Refresh button
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshAllData());
        }

        // Navigation buttons
        const navButtons = document.querySelectorAll('.nav-link');
        navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (btn.getAttribute('href').startsWith('http')) {
                    return; // Allow normal navigation for external links
                }
                e.preventDefault();
                window.location.href = btn.getAttribute('href');
            });
        });
    }

    updateCurrentTime() {
        const timeElement = document.getElementById('currentTime');
        if (timeElement) {
            const now = new Date();
            const timeString = now.toLocaleString('en-IN', {
                timeZone: 'Asia/Kolkata',
                hour12: true,
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            timeElement.textContent = timeString;
        }
    }

    async loadOverviewData() {
        try {
            await Promise.all([
                this.loadAlerts(),
                this.loadTokenSummary(),
                this.loadInventorySummary(),
                this.loadScheduleSummary()
            ]);
        } catch (error) {
            console.error('Error loading overview data:', error);
            this.showError('Failed to load dashboard data');
        }
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

        if (alerts.length === 0) {
            alertsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-shield-alt"></i>
                    <h3>No Active Alerts</h3>
                    <p>All systems operating normally</p>
                </div>
            `;
            return;
        }

        const alertsHtml = alerts.map(alert => `
            <div class="alert alert-${this.getAlertClass(alert.type)} d-flex justify-content-between align-items-start">
                <div>
                    <strong>${this.getAlertTitle(alert.type)}</strong><br>
                    <span>${alert.message}</span><br>
                    <small class="text-muted">
                        <i class="fas fa-map-marker-alt"></i> ${alert.location} | 
                        <i class="fas fa-clock"></i> ${this.formatTime(alert.timestamp)}
                    </small>
                </div>
                <span class="badge bg-${this.getAlertBadgeColor(alert.type)}">
                    ${alert.type.toUpperCase()}
                </span>
            </div>
        `).join('');

        alertsContainer.innerHTML = alertsHtml;
    }

    async loadTokenSummary() {
        try {
            const response = await fetch('/api/tokens');
            const data = await response.json();
            this.displayTokenSummary(data);
        } catch (error) {
            console.error('Error loading token summary:', error);
            this.displayTokenSummary({});
        }
    }

    displayTokenSummary(data) {
        const tokenSummaryElement = document.getElementById('tokenSummary');
        if (!tokenSummaryElement) return;

        const currentTokens = data.current_tokens || {};
        const queue = data.queue || {};

        const departments = Object.keys(currentTokens);
        
        if (departments.length === 0) {
            tokenSummaryElement.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-ticket-alt"></i>
                    <h3>No Active Tokens</h3>
                    <p>No patients in queue currently</p>
                </div>
            `;
            return;
        }

        const summaryHtml = departments.map(dept => {
            const current = currentTokens[dept] || 'None';
            const waiting = queue[dept] ? queue[dept].length : 0;
            
            return `
                <div class="row mb-3">
                    <div class="col-md-6">
                        <div class="d-flex align-items-center">
                            <span class="department-badge me-2">${dept}</span>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <strong>Current: ${current}</strong>
                    </div>
                    <div class="col-md-3">
                        <span class="text-muted">Waiting: ${waiting}</span>
                    </div>
                </div>
            `;
        }).join('');

        tokenSummaryElement.innerHTML = summaryHtml;
    }

    async loadInventorySummary() {
        try {
            const response = await fetch('/api/inventory');
            const data = await response.json();
            this.displayInventorySummary(data);
        } catch (error) {
            console.error('Error loading inventory summary:', error);
            this.displayInventorySummary({});
        }
    }

    displayInventorySummary(data) {
        const inventorySummaryElement = document.getElementById('inventorySummary');
        if (!inventorySummaryElement) return;

        const medications = data.medications || {};
        const supplies = data.supplies || {};
        
        const allItems = { ...medications, ...supplies };
        const itemNames = Object.keys(allItems);

        if (itemNames.length === 0) {
            inventorySummaryElement.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-boxes"></i>
                    <h3>No Inventory Data</h3>
                    <p>Inventory information not available</p>
                </div>
            `;
            return;
        }

        // Show critical items (low stock)
        const criticalItems = itemNames.filter(name => {
            const item = allItems[name];
            return item.quantity <= item.min_threshold;
        });

        let summaryHtml = '';

        if (criticalItems.length > 0) {
            summaryHtml += '<h6 class="text-danger mb-3"><i class="fas fa-exclamation-triangle"></i> Critical Stock Levels</h6>';
            summaryHtml += criticalItems.map(name => {
                const item = allItems[name];
                return `
                    <div class="inventory-item">
                        <div class="inventory-name">${name}</div>
                        <div class="inventory-stock stock-low">${item.quantity} ${item.unit}</div>
                    </div>
                `;
            }).join('');
        } else {
            summaryHtml = `
                <div class="text-success">
                    <i class="fas fa-check-circle"></i> All inventory levels normal
                </div>
            `;
        }

        summaryHtml += `
            <div class="mt-3">
                <small class="text-muted">
                    Total Items: ${itemNames.length} | 
                    Last Updated: ${this.formatTime(data.last_updated)}
                </small>
            </div>
        `;

        inventorySummaryElement.innerHTML = summaryHtml;
    }

    async loadScheduleSummary() {
        try {
            const response = await fetch('/api/schedules');
            const data = await response.json();
            this.displayScheduleSummary(data);
        } catch (error) {
            console.error('Error loading schedule summary:', error);
            this.displayScheduleSummary({});
        }
    }

    displayScheduleSummary(data) {
        const scheduleSummaryElement = document.getElementById('scheduleSummary');
        if (!scheduleSummaryElement) return;

        const otSchedules = data.ot_schedules || {};
        const consultations = data.consultations || {};

        const today = new Date().toISOString().split('T')[0];
        const todayOT = Object.keys(otSchedules).filter(key => key.includes(today)).length;
        const todayConsultations = Object.keys(consultations).filter(key => key.includes(today)).length;

        const summaryHtml = `
            <div class="row">
                <div class="col-md-6">
                    <div class="text-center">
                        <h4 class="text-primary">${todayOT}</h4>
                        <small class="text-muted">OT Procedures Today</small>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="text-center">
                        <h4 class="text-info">${todayConsultations}</h4>
                        <small class="text-muted">Consultations Today</small>
                    </div>
                </div>
            </div>
            <div class="mt-3">
                <small class="text-muted">
                    Last Updated: ${this.formatTime(data.last_updated)}
                </small>
            </div>
        `;

        scheduleSummaryElement.innerHTML = summaryHtml;
    }

    startAutoRefresh() {
        // Update time every second
        this.intervals.push(setInterval(() => this.updateCurrentTime(), 1000));
        
        // Update data every 30 seconds
        this.intervals.push(setInterval(() => this.loadOverviewData(), this.updateInterval));
    }

    async refreshAllData() {
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.innerHTML = '<span class="spinner"></span> Refreshing...';
            refreshBtn.disabled = true;
        }

        try {
            await this.loadOverviewData();
        } finally {
            if (refreshBtn) {
                refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
                refreshBtn.disabled = false;
            }
        }
    }

    getAlertClass(type) {
        const alertClasses = {
            'code_blue': 'code-blue',
            'code_red': 'code-red',
            'general': 'general',
            'emergency': 'code-red'
        };
        return alertClasses[type] || 'general';
    }

    getAlertTitle(type) {
        const alertTitles = {
            'code_blue': 'CODE BLUE',
            'code_red': 'CODE RED',
            'general': 'GENERAL ALERT',
            'emergency': 'EMERGENCY'
        };
        return alertTitles[type] || 'ALERT';
    }

    getAlertBadgeColor(type) {
        const badgeColors = {
            'code_blue': 'primary',
            'code_red': 'danger',
            'general': 'warning',
            'emergency': 'danger'
        };
        return badgeColors[type] || 'secondary';
    }

    formatTime(timestamp) {
        if (!timestamp) return 'N/A';
        const date = new Date(timestamp);
        return date.toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            hour12: true,
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    showError(message) {
        console.error(message);
        // Could implement toast notifications here
    }

    destroy() {
        this.intervals.forEach(interval => clearInterval(interval));
        this.intervals = [];
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.hospitalDashboard = new HospitalDashboard();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.hospitalDashboard) {
        window.hospitalDashboard.destroy();
    }
});
