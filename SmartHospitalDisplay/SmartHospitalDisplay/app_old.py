import os
import logging
from datetime import datetime, date, time
from flask import Flask, render_template, request, jsonify, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase
from werkzeug.middleware.proxy_fix import ProxyFix

# Configure logging
logging.basicConfig(level=logging.DEBUG)


class Base(DeclarativeBase):
    pass


db = SQLAlchemy(model_class=Base)

# Create Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "hospital-display-system-key")
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

# Configure the database
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL")
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}
# Initialize the app with the extension
db.init_app(app)

# Data file paths
DATA_DIR = 'data'
TOKENS_FILE = os.path.join(DATA_DIR, 'tokens.json')
INVENTORY_FILE = os.path.join(DATA_DIR, 'inventory.json')
ALERTS_FILE = os.path.join(DATA_DIR, 'alerts.json')
SCHEDULES_FILE = os.path.join(DATA_DIR, 'schedules.json')

def ensure_data_files():
    """Ensure all data files exist with initial structure"""
    os.makedirs(DATA_DIR, exist_ok=True)
    
    # Initialize tokens.json
    if not os.path.exists(TOKENS_FILE):
        with open(TOKENS_FILE, 'w') as f:
            json.dump({
                "current_tokens": {},
                "queue": {},
                "last_updated": datetime.now().isoformat()
            }, f, indent=2)
    
    # Initialize inventory.json
    if not os.path.exists(INVENTORY_FILE):
        with open(INVENTORY_FILE, 'w') as f:
            json.dump({
                "medications": {},
                "supplies": {},
                "last_updated": datetime.now().isoformat()
            }, f, indent=2)
    
    # Initialize alerts.json
    if not os.path.exists(ALERTS_FILE):
        with open(ALERTS_FILE, 'w') as f:
            json.dump({
                "active_alerts": [],
                "alert_history": [],
                "last_updated": datetime.now().isoformat()
            }, f, indent=2)
    
    # Initialize schedules.json
    if not os.path.exists(SCHEDULES_FILE):
        with open(SCHEDULES_FILE, 'w') as f:
            json.dump({
                "ot_schedules": {},
                "consultations": {},
                "last_updated": datetime.now().isoformat()
            }, f, indent=2)

def load_json_file(filepath):
    """Load JSON data from file"""
    try:
        with open(filepath, 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}

def save_json_file(filepath, data):
    """Save JSON data to file"""
    try:
        data['last_updated'] = datetime.now().isoformat()
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)
        return True
    except Exception as e:
        logging.error(f"Error saving {filepath}: {e}")
        return False

# Routes
@app.route('/')
def dashboard():
    """Central dashboard with overview and navigation"""
    return render_template('dashboard.html')

@app.route('/patient')
def patient_display():
    """Patient-facing display showing tokens and alerts"""
    return render_template('patient.html')

@app.route('/staff')
def staff_panel():
    """Staff control panel for managing alerts and viewing inventory"""
    return render_template('staff.html')

# API Routes for Tokens
@app.route('/api/tokens', methods=['GET'])
def get_tokens():
    """Get current token information"""
    data = load_json_file(TOKENS_FILE)
    return jsonify(data)

@app.route('/api/tokens', methods=['POST'])
def update_tokens():
    """Update token information"""
    try:
        new_data = request.get_json()
        if save_json_file(TOKENS_FILE, new_data):
            return jsonify({"status": "success", "message": "Tokens updated successfully"})
        else:
            return jsonify({"status": "error", "message": "Failed to update tokens"}), 500
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

# API Routes for Inventory
@app.route('/api/inventory', methods=['GET'])
def get_inventory():
    """Get pharmacy inventory information"""
    data = load_json_file(INVENTORY_FILE)
    return jsonify(data)

@app.route('/api/inventory', methods=['POST'])
def update_inventory():
    """Update inventory information"""
    try:
        new_data = request.get_json()
        if save_json_file(INVENTORY_FILE, new_data):
            return jsonify({"status": "success", "message": "Inventory updated successfully"})
        else:
            return jsonify({"status": "error", "message": "Failed to update inventory"}), 500
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

# API Routes for Alerts
@app.route('/api/alerts', methods=['GET'])
def get_alerts():
    """Get current alerts"""
    data = load_json_file(ALERTS_FILE)
    return jsonify(data)

@app.route('/api/alerts', methods=['POST'])
def create_alert():
    """Create new emergency alert"""
    try:
        alert_data = request.get_json()
        data = load_json_file(ALERTS_FILE)
        
        new_alert = {
            "id": len(data.get("active_alerts", [])) + 1,
            "type": alert_data.get("type", "general"),
            "message": alert_data.get("message", ""),
            "location": alert_data.get("location", ""),
            "timestamp": datetime.now().isoformat(),
            "active": True
        }
        
        if "active_alerts" not in data:
            data["active_alerts"] = []
        
        data["active_alerts"].append(new_alert)
        
        if save_json_file(ALERTS_FILE, data):
            return jsonify({"status": "success", "message": "Alert created successfully", "alert": new_alert})
        else:
            return jsonify({"status": "error", "message": "Failed to create alert"}), 500
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route('/api/alerts/<int:alert_id>', methods=['DELETE'])
def dismiss_alert(alert_id):
    """Dismiss/deactivate an alert"""
    try:
        data = load_json_file(ALERTS_FILE)
        
        for alert in data.get("active_alerts", []):
            if alert["id"] == alert_id:
                alert["active"] = False
                alert["dismissed_at"] = datetime.now().isoformat()
                
                # Move to history
                if "alert_history" not in data:
                    data["alert_history"] = []
                data["alert_history"].append(alert)
                
                # Remove from active alerts
                data["active_alerts"] = [a for a in data["active_alerts"] if a["id"] != alert_id]
                break
        
        if save_json_file(ALERTS_FILE, data):
            return jsonify({"status": "success", "message": "Alert dismissed successfully"})
        else:
            return jsonify({"status": "error", "message": "Failed to dismiss alert"}), 500
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

# API Routes for Schedules
@app.route('/api/schedules', methods=['GET'])
def get_schedules():
    """Get OT and consultation schedules"""
    data = load_json_file(SCHEDULES_FILE)
    return jsonify(data)

@app.route('/api/schedules', methods=['POST'])
def update_schedules():
    """Update schedule information"""
    try:
        new_data = request.get_json()
        if save_json_file(SCHEDULES_FILE, new_data):
            return jsonify({"status": "success", "message": "Schedules updated successfully"})
        else:
            return jsonify({"status": "error", "message": "Failed to update schedules"}), 500
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({"status": "error", "message": "Resource not found"}), 404

@app.errorhandler(500)
def server_error(error):
    return jsonify({"status": "error", "message": "Internal server error"}), 500

if __name__ == '__main__':
    ensure_data_files()
    app.run(host='0.0.0.0', port=5000, debug=True)
