// Wenlock Hospital Smart Display System - Staff Panel JavaScript

class StaffPanel {
    constructor() {
        this.updateInterval = 10000; // 10 seconds for staff panel
        this.intervals = [];
        this.init();
    }

    init() {
        this.loadStaffData();
        this.startAutoRefresh();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Alert creation form
        const alertForm = document.getElementById('alertForm');
        if (alertForm) {
            alertForm.addEventListener('submit', (e) => this.handleAlertCreation(e));
        }

        // Quick alert buttons
        const quickAlertButtons = document.querySelectorAll('.quick-alert-btn');
        quickAlertButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleQuickAlert(e));
        });

        // Refresh button
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshAllData());
        }

        // Token management
        const tokenForm = document.getElementById('tokenForm');
        if (tokenForm) {
            tokenForm.addEventListener('submit', (e) => this.handleTokenUpdate(e));
        }

        // Inventory update form
        const inventoryForm = document.getElementById('inventoryForm');
        if (inventoryForm) {
            inventoryForm.addEventListener('submit', (e) => this.handleInventoryUpdate(e));
        }
    }

    async loadStaffData() {
        try {
            await Promise.all([
                this.loadActiveAlerts(),
                this.loadInventoryStatus(),
                this.loadTokenStatus(),
                this.loadScheduleStatus()
            ]);
        } catch (error) {
            console.error('Error loading staff data:', error);
            this.showError('Failed to load staff panel data');
        }
    }

    async loadActiveAlerts() {
        try {
            const response = await fetch('/api/alerts');
            const data = await response.json();
            this.displayActiveAlerts(data.active_alerts || []);
        } catch (error) {
            console.error('Error loading alerts:', error);
            this.displayActiveAlerts([]);
        }
    }

    displayActiveAlerts(alerts) {
        const alertsContainer = document.getElementById('activeAlertsContainer');
        if (!alertsContainer) return;

        if (alerts.length === 0) {
            alertsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-shield-alt"></i>
                    <h3>No Active Alerts</h3>
                    <p>All systems normal</p>
                </div>
            `;
            return;
        }

        const alertsHtml = alerts.map(alert => `
            <div class="card mb-3">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="flex-grow-1">
                            <h6 class="card-title">
                                <span class="badge bg-${this.getAlertBadgeColor(alert.type)} me-2">
                                    ${alert.type.toUpperCase()}
                                </span>
                                ${alert.message}
                            </h6>
                            <p class="card-text">
                                <small class="text-muted">
                                    <i class="fas fa-map-marker-alt"></i> ${alert.location || 'Not specified'} | 
                                    <i class="fas fa-clock"></i> ${this.formatTime(alert.timestamp)}
                                </small>
                            </p>
                        </div>
                        <button class="btn btn-sm btn-outline-danger" onclick="staffPanel.dismissAlert(${alert.id})">
                            <i class="fas fa-times"></i> Dismiss
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        alertsContainer.innerHTML = alertsHtml;
    }

    async dismissAlert(alertId) {
        try {
            const response = await fetch(`/api/alerts/${alertId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                this.showSuccess('Alert dismissed successfully');
                await this.loadActiveAlerts();
            } else {
                this.showError('Failed to dismiss alert');
            }
        } catch (error) {
            console.error('Error dismissing alert:', error);
            this.showError('Error dismissing alert');
        }
    }

    async handleAlertCreation(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const alertData = {
            type: formData.get('alertType'),
            message: formData.get('alertMessage'),
            location: formData.get('alertLocation')
        };

        try {
            const response = await fetch('/api/alerts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(alertData)
            });

            if (response.ok) {
                this.showSuccess('Alert created successfully');
                e.target.reset();
                await this.loadActiveAlerts();
            } else {
                this.showError('Failed to create alert');
            }
        } catch (error) {
            console.error('Error creating alert:', error);
            this.showError('Error creating alert');
        }
    }

    async handleQuickAlert(e) {
        const alertType = e.target.dataset.alertType;
        const alertMessage = e.target.dataset.alertMessage;
        
        const alertData = {
            type: alertType,
            message: alertMessage,
            location: 'Hospital Wide'
        };

        try {
            const response = await fetch('/api/alerts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(alertData)
            });

            if (response.ok) {
                this.showSuccess(`${alertType.toUpperCase()} alert activated`);
                await this.loadActiveAlerts();
            } else {
                this.showError('Failed to create quick alert');
            }
        } catch (error) {
            console.error('Error creating quick alert:', error);
            this.showError('Error creating quick alert');
        }
    }

    async loadInventoryStatus() {
        try {
            const response = await fetch('/api/inventory');
            const data = await response.json();
            this.displayInventoryStatus(data);
        } catch (error) {
            console.error('Error loading inventory status:', error);
            this.displayInventoryStatus({});
        }
    }

    displayInventoryStatus(data) {
        const inventoryContainer = document.getElementById('inventoryStatusContainer');
        if (!inventoryContainer) return;

        const medications = data.medications || {};
        const supplies = data.supplies || {};
        const allItems = { ...medications, ...supplies };
        
        const itemNames = Object.keys(allItems);

        if (itemNames.length === 0) {
            inventoryContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-boxes"></i>
                    <h3>No Inventory Data</h3>
                    <p>Add inventory items to track stock levels</p>
                </div>
            `;
            return;
        }

        // Categorize items by stock level
        const criticalItems = [];
        const lowItems = [];
        const normalItems = [];

        itemNames.forEach(name => {
            const item = allItems[name];
            const stockRatio = item.quantity / item.max_capacity;
            
            if (item.quantity <= item.min_threshold) {
                criticalItems.push({ name, ...item });
            } else if (stockRatio < 0.3) {
                lowItems.push({ name, ...item });
            } else {
                normalItems.push({ name, ...item });
            }
        });

        let inventoryHtml = '';

        // Critical items
        if (criticalItems.length > 0) {
            inventoryHtml += `
                <div class="mb-4">
                    <h6 class="text-danger mb-3"><i class="fas fa-exclamation-triangle"></i> Critical Stock (${criticalItems.length})</h6>
                    ${criticalItems.map(item => this.renderInventoryItem(item, 'critical')).join('')}
                </div>
            `;
        }

        // Low items
        if (lowItems.length > 0) {
            inventoryHtml += `
                <div class="mb-4">
                    <h6 class="text-warning mb-3"><i class="fas fa-exclamation-circle"></i> Low Stock (${lowItems.length})</h6>
                    ${lowItems.map(item => this.renderInventoryItem(item, 'low')).join('')}
                </div>
            `;
        }

        // Normal items (show first 10)
        if (normalItems.length > 0) {
            inventoryHtml += `
                <div class="mb-4">
                    <h6 class="text-success mb-3"><i class="fas fa-check-circle"></i> Normal Stock (${normalItems.length})</h6>
                    ${normalItems.slice(0, 10).map(item => this.renderInventoryItem(item, 'normal')).join('')}
                    ${normalItems.length > 10 ? `<small class="text-muted">... and ${normalItems.length - 10} more items</small>` : ''}
                </div>
            `;
        }

        inventoryContainer.innerHTML = inventoryHtml;
    }

    renderInventoryItem(item, level) {
        const levelClass = level === 'critical' ? 'stock-low' : level === 'low' ? 'stock-medium' : 'stock-high';
        const percentage = Math.round((item.quantity / item.max_capacity) * 100);
        
        return `
            <div class="inventory-item">
                <div>
                    <div class="inventory-name">${item.name}</div>
                    <small class="text-muted">${item.category || 'General'}</small>
                </div>
                <div class="text-end">
                    <div class="inventory-stock ${levelClass}">${item.quantity} ${item.unit}</div>
                    <div class="progress mt-1" style="height: 4px; width: 80px;">
                        <div class="progress-bar bg-${level === 'critical' ? 'danger' : level === 'low' ? 'warning' : 'success'}" 
                             style="width: ${percentage}%"></div>
                    </div>
                </div>
            </div>
        `;
    }

    async handleTokenUpdate(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const department = formData.get('department');
        const tokenNumber = formData.get('tokenNumber');

        try {
            // Get current token data
            const response = await fetch('/api/tokens');
            const data = await response.json();
            
            // Initialize department if it doesn't exist
            if (!data.current_tokens) data.current_tokens = {};
            if (!data.queue) data.queue = {};
            if (!data.queue[department]) data.queue[department] = [];

            // Add token to queue
            const newToken = {
                token_number: tokenNumber,
                patient_type: 'General',
                status: 'waiting',
                timestamp: new Date().toISOString()
            };

            data.queue[department].push(newToken);

            // Save updated tokens
            const updateResponse = await fetch('/api/tokens', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (updateResponse.ok) {
                this.showSuccess(`Token ${tokenNumber} added to ${department} queue`);
                e.target.reset();
                await this.loadTokenStatus();
            } else {
                this.showError('Failed to add token');
            }
        } catch (error) {
            console.error('Error adding token:', error);
            this.showError('Error adding token');
        }
    }

    async handleInventoryUpdate(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const itemName = formData.get('itemName');
        const quantity = parseInt(formData.get('quantity'));
        const operation = formData.get('operation');

        try {
            // Get current inventory
            const response = await fetch('/api/inventory');
            const data = await response.json();
            
            // Find and update the item
            const allItems = { ...data.medications, ...data.supplies };
            if (allItems[itemName]) {
                if (operation === 'add') {
                    allItems[itemName].quantity += quantity;
                } else if (operation === 'subtract') {
                    allItems[itemName].quantity = Math.max(0, allItems[itemName].quantity - quantity);
                } else {
                    allItems[itemName].quantity = quantity;
                }

                // Update the appropriate category
                if (data.medications[itemName]) {
                    data.medications[itemName] = allItems[itemName];
                } else {
                    data.supplies[itemName] = allItems[itemName];
                }

                // Save updated inventory
                const updateResponse = await fetch('/api/inventory', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                if (updateResponse.ok) {
                    this.showSuccess('Inventory updated successfully');
                    e.target.reset();
                    await this.loadInventoryStatus();
                } else {
                    this.showError('Failed to update inventory');
                }
            } else {
                this.showError('Item not found in inventory');
            }
        } catch (error) {
            console.error('Error updating inventory:', error);
            this.showError('Error updating inventory');
        }
    }

    async loadTokenStatus() {
        try {
            const response = await fetch('/api/tokens');
            const data = await response.json();
            this.displayTokenStatus(data);
        } catch (error) {
            console.error('Error loading token status:', error);
            this.displayTokenStatus({});
        }
    }

    displayTokenStatus(data) {
        const tokenStatusContainer = document.getElementById('tokenStatusContainer');
        if (!tokenStatusContainer) return;

        const currentTokens = data.current_tokens || {};
        const queue = data.queue || {};
        
        const departments = new Set([...Object.keys(currentTokens), ...Object.keys(queue)]);

        if (departments.size === 0) {
            tokenStatusContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-ticket-alt"></i>
                    <h3>No Token Data</h3>
                    <p>Token information will appear here</p>
                </div>
            `;
            return;
        }

        const statusHtml = Array.from(departments).map(dept => {
            const current = currentTokens[dept] || 'None';
            const queueLength = queue[dept] ? queue[dept].length : 0;
            
            return `
                <tr>
                    <td>${this.formatDepartmentName(dept)}</td>
                    <td>
                        <span class="badge bg-primary">${current}</span>
                    </td>
                    <td>${queueLength}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" onclick="staffPanel.advanceToken('${dept}')">
                            <i class="fas fa-forward"></i> Next
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        tokenStatusContainer.innerHTML = `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>Department</th>
                            <th>Current Token</th>
                            <th>Queue Length</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${statusHtml}
                    </tbody>
                </table>
            </div>
        `;
    }

    async advanceToken(department) {
        try {
            const response = await fetch(`/api/tokens/advance/${department}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();
            
            if (response.ok) {
                if (result.status === 'success') {
                    this.showSuccess(result.message);
                } else if (result.status === 'info') {
                    this.showInfo(result.message);
                }
                await this.loadTokenStatus();
            } else {
                this.showError(result.message || 'Failed to advance token');
            }
        } catch (error) {
            console.error('Error advancing token:', error);
            this.showError('Error advancing token');
        }
    }

    async loadScheduleStatus() {
        try {
            const response = await fetch('/api/schedules');
            const data = await response.json();
            this.displayScheduleStatus(data);
        } catch (error) {
            console.error('Error loading schedule status:', error);
            this.displayScheduleStatus({});
        }
    }

    displayScheduleStatus(data) {
        const scheduleStatusContainer = document.getElementById('scheduleStatusContainer');
        if (!scheduleStatusContainer) return;

        const otSchedules = data.ot_schedules || {};
        const consultations = data.consultations || {};

        const today = new Date().toISOString().split('T')[0];
        const todayOT = Object.entries(otSchedules).filter(([key]) => key.includes(today));
        const todayConsultations = Object.entries(consultations).filter(([key]) => key.includes(today));

        let scheduleHtml = `
            <div class="row mb-4">
                <div class="col-md-6">
                    <div class="card bg-primary text-white">
                        <div class="card-body text-center">
                            <h3>${todayOT.length}</h3>
                            <p class="mb-0">OT Procedures Today</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card bg-info text-white">
                        <div class="card-body text-center">
                            <h3>${todayConsultations.length}</h3>
                            <p class="mb-0">Consultations Today</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        if (todayOT.length > 0) {
            scheduleHtml += `
                <h6 class="mb-3">Today's OT Schedule</h6>
                <div class="table-responsive mb-4">
                    <table class="table table-sm">
                        <thead>
                            <tr>
                                <th>Time</th>
                                <th>Procedure</th>
                                <th>Surgeon</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${todayOT.map(([key, schedule]) => `
                                <tr>
                                    <td>${schedule.start_time}-${schedule.end_time}</td>
                                    <td>${schedule.procedure}</td>
                                    <td>${schedule.surgeon}</td>
                                    <td>
                                        <span class="badge bg-${this.getScheduleStatusColor(schedule.status)}">
                                            ${this.formatStatus(schedule.status)}
                                        </span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }

        if (todayConsultations.length > 0) {
            scheduleHtml += `
                <h6 class="mb-3">Today's Consultations</h6>
                <div class="table-responsive">
                    <table class="table table-sm">
                        <thead>
                            <tr>
                                <th>Department</th>
                                <th>Doctor</th>
                                <th>Time Slot</th>
                                <th>Progress</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${todayConsultations.map(([key, consultation]) => `
                                <tr>
                                    <td>${consultation.department}</td>
                                    <td>${consultation.doctor}</td>
                                    <td>${consultation.time_slot}</td>
                                    <td>${consultation.completed}/${consultation.total_appointments}</td>
                                    <td>
                                        <span class="badge bg-${this.getScheduleStatusColor(consultation.status)}">
                                            ${this.formatStatus(consultation.status)}
                                        </span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }

        if (todayOT.length === 0 && todayConsultations.length === 0) {
            scheduleHtml += `
                <div class="empty-state">
                    <i class="fas fa-calendar"></i>
                    <h3>No Schedules Today</h3>
                    <p>No OT procedures or consultations scheduled</p>
                </div>
            `;
        }

        scheduleStatusContainer.innerHTML = scheduleHtml;
    }

    startAutoRefresh() {
        // Update data every 10 seconds
        this.intervals.push(setInterval(() => this.loadStaffData(), this.updateInterval));
    }

    async refreshAllData() {
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.innerHTML = '<span class="spinner"></span> Refreshing...';
            refreshBtn.disabled = true;
        }

        try {
            await this.loadStaffData();
        } finally {
            if (refreshBtn) {
                refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
                refreshBtn.disabled = false;
            }
        }
    }

    // Utility methods
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

    getAlertBadgeColor(type) {
        const badgeColors = {
            'code_blue': 'primary',
            'code_red': 'danger',
            'general': 'warning',
            'emergency': 'danger',
            'maintenance': 'info'
        };
        return badgeColors[type] || 'secondary';
    }

    getScheduleStatusColor(status) {
        const statusColors = {
            'scheduled': 'primary',
            'in_progress': 'warning',
            'ongoing': 'warning',
            'completed': 'success',
            'cancelled': 'danger'
        };
        return statusColors[status] || 'secondary';
    }

    formatStatus(status) {
        const statusMap = {
            'scheduled': 'Scheduled',
            'in_progress': 'In Progress',
            'ongoing': 'Ongoing',
            'completed': 'Completed',
            'cancelled': 'Cancelled',
            'waiting': 'Waiting',
            'called': 'Called'
        };
        return statusMap[status] || status.charAt(0).toUpperCase() + status.slice(1);
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

    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    showError(message) {
        this.showMessage(message, 'danger');
    }

    showInfo(message) {
        this.showMessage(message, 'info');
    }

    showMessage(message, type) {
        const messageContainer = document.getElementById('messageContainer');
        if (messageContainer) {
            const alertHtml = `
                <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                    ${message}
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            `;
            messageContainer.innerHTML = alertHtml;
            
            setTimeout(() => {
                const alert = messageContainer.querySelector('.alert');
                if (alert) {
                    alert.remove();
                }
            }, 5000);
        }
    }

    destroy() {
        this.intervals.forEach(interval => clearInterval(interval));
        this.intervals = [];
    }
}

// Initialize staff panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.staffPanel = new StaffPanel();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.staffPanel) {
        window.staffPanel.destroy();
    }
});
