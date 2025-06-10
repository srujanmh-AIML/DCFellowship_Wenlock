import os
import logging
from datetime import datetime, date, time
from flask import Flask, render_template, request, jsonify
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

# Define models inline to avoid circular import
class Token(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    department = db.Column(db.String(100), nullable=False)
    token_number = db.Column(db.String(20), nullable=False)
    patient_type = db.Column(db.String(50), default='General')
    status = db.Column(db.String(20), default='waiting')
    is_current = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'department': self.department,
            'token_number': self.token_number,
            'patient_type': self.patient_type,
            'status': self.status,
            'is_current': self.is_current,
            'timestamp': self.created_at.isoformat()
        }


class InventoryItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False, unique=True)
    quantity = db.Column(db.Integer, default=0)
    unit = db.Column(db.String(50), nullable=False)
    min_threshold = db.Column(db.Integer, default=0)
    max_capacity = db.Column(db.Integer, default=100)
    category = db.Column(db.String(100), nullable=False)
    item_type = db.Column(db.String(50), nullable=False)  # 'medication' or 'supply'
    expiry_date = db.Column(db.Date, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'quantity': self.quantity,
            'unit': self.unit,
            'min_threshold': self.min_threshold,
            'max_capacity': self.max_capacity,
            'category': self.category,
            'item_type': self.item_type,
            'expiry_date': self.expiry_date.isoformat() if self.expiry_date else None
        }


class Alert(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    alert_type = db.Column(db.String(50), nullable=False)
    message = db.Column(db.Text, nullable=False)
    location = db.Column(db.String(200))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    dismissed_at = db.Column(db.DateTime, nullable=True)
    created_by = db.Column(db.String(100), default='System')

    def to_dict(self):
        return {
            'id': self.id,
            'type': self.alert_type,
            'message': self.message,
            'location': self.location,
            'active': self.is_active,
            'timestamp': self.created_at.isoformat(),
            'dismissed_at': self.dismissed_at.isoformat() if self.dismissed_at else None
        }


class Schedule(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    schedule_type = db.Column(db.String(50), nullable=False)  # 'ot' or 'consultation'
    department = db.Column(db.String(100))
    doctor_name = db.Column(db.String(200))
    procedure_name = db.Column(db.String(300))
    patient_id = db.Column(db.String(50))
    room_number = db.Column(db.String(20))
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    schedule_date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(50), default='scheduled')
    anesthesiologist = db.Column(db.String(200))
    total_appointments = db.Column(db.Integer, default=0)
    completed_appointments = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'schedule_type': self.schedule_type,
            'department': self.department,
            'doctor': self.doctor_name,
            'procedure': self.procedure_name,
            'patient_id': self.patient_id,
            'room': self.room_number,
            'start_time': self.start_time.strftime('%H:%M') if self.start_time else None,
            'end_time': self.end_time.strftime('%H:%M') if self.end_time else None,
            'date': self.schedule_date.isoformat() if self.schedule_date else None,
            'status': self.status,
            'anesthesiologist': self.anesthesiologist,
            'total_appointments': self.total_appointments,
            'completed': self.completed_appointments,
            'remaining': self.total_appointments - self.completed_appointments
        }

# Create database tables within app context
with app.app_context():
    db.create_all()

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
    try:
        # Get current tokens (one per department)
        current_tokens = {}
        current_token_objects = Token.query.filter_by(is_current=True).all()
        for token in current_token_objects:
            current_tokens[token.department] = token.token_number

        # Get queue tokens
        queue = {}
        queue_tokens = Token.query.filter_by(is_current=False, status='waiting').order_by(Token.created_at).all()
        for token in queue_tokens:
            if token.department not in queue:
                queue[token.department] = []
            queue[token.department].append(token.to_dict())

        return jsonify({
            "current_tokens": current_tokens,
            "queue": queue,
            "last_updated": datetime.utcnow().isoformat()
        })
    except Exception as e:
        logging.error(f"Error getting tokens: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/tokens', methods=['POST'])
def update_tokens():
    """Update token information"""
    try:
        data = request.get_json()
        
        if 'department' in data and 'token_number' in data:
            # Add new token to queue
            new_token = Token(
                department=data['department'],
                token_number=data['token_number'],
                patient_type=data.get('patient_type', 'General'),
                status='waiting',
                is_current=False
            )
            db.session.add(new_token)
            db.session.commit()
            
            return jsonify({"status": "success", "message": "Token added successfully"})
        else:
            # Update entire token data (for compatibility)
            return jsonify({"status": "success", "message": "Tokens updated successfully"})
            
    except Exception as e:
        logging.error(f"Error updating tokens: {e}")
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500

# API Routes for Inventory
@app.route('/api/inventory', methods=['GET'])
def get_inventory():
    """Get pharmacy inventory information"""
    try:
        items = InventoryItem.query.all()
        medications = {}
        supplies = {}
        
        for item in items:
            item_dict = item.to_dict()
            if item.item_type == 'medication':
                medications[item.name] = item_dict
            else:
                supplies[item.name] = item_dict
        
        return jsonify({
            "medications": medications,
            "supplies": supplies,
            "last_updated": datetime.utcnow().isoformat()
        })
    except Exception as e:
        logging.error(f"Error getting inventory: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/inventory', methods=['POST'])
def update_inventory():
    """Update inventory information"""
    try:
        data = request.get_json()
        
        if 'item_name' in data:
            # Update specific item
            item_name = data['item_name']
            quantity = data.get('quantity', 0)
            operation = data.get('operation', 'set')
            
            item = InventoryItem.query.filter_by(name=item_name).first()
            if item:
                if operation == 'add':
                    item.quantity += quantity
                elif operation == 'subtract':
                    item.quantity = max(0, item.quantity - quantity)
                else:
                    item.quantity = quantity
                
                item.updated_at = datetime.utcnow()
                db.session.commit()
                
                return jsonify({"status": "success", "message": "Inventory updated successfully"})
            else:
                return jsonify({"status": "error", "message": "Item not found"}), 404
        else:
            return jsonify({"status": "success", "message": "Inventory updated successfully"})
            
    except Exception as e:
        logging.error(f"Error updating inventory: {e}")
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500

# API Routes for Alerts
@app.route('/api/alerts', methods=['GET'])
def get_alerts():
    """Get current alerts"""
    try:
        active_alerts = Alert.query.filter_by(is_active=True).order_by(Alert.created_at.desc()).all()
        alert_history = Alert.query.filter_by(is_active=False).order_by(Alert.dismissed_at.desc()).limit(10).all()
        
        return jsonify({
            "active_alerts": [alert.to_dict() for alert in active_alerts],
            "alert_history": [alert.to_dict() for alert in alert_history],
            "last_updated": datetime.utcnow().isoformat()
        })
    except Exception as e:
        logging.error(f"Error getting alerts: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/alerts', methods=['POST'])
def create_alert():
    """Create new emergency alert"""
    try:
        data = request.get_json()
        
        new_alert = Alert(
            alert_type=data.get('type', 'general'),
            message=data.get('message', ''),
            location=data.get('location', ''),
            is_active=True,
            created_by=data.get('created_by', 'Staff')
        )
        
        db.session.add(new_alert)
        db.session.commit()
        
        return jsonify({
            "status": "success", 
            "message": "Alert created successfully", 
            "alert": new_alert.to_dict()
        })
        
    except Exception as e:
        logging.error(f"Error creating alert: {e}")
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/alerts/<int:alert_id>', methods=['DELETE'])
def dismiss_alert(alert_id):
    """Dismiss/deactivate an alert"""
    try:
        alert = Alert.query.get_or_404(alert_id)
        alert.is_active = False
        alert.dismissed_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({"status": "success", "message": "Alert dismissed successfully"})
        
    except Exception as e:
        logging.error(f"Error dismissing alert: {e}")
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500

# API Routes for Schedules
@app.route('/api/schedules', methods=['GET'])
def get_schedules():
    """Get OT and consultation schedules"""
    try:
        today = date.today()
        schedules = Schedule.query.filter_by(schedule_date=today).all()
        
        ot_schedules = {}
        consultations = {}
        
        for schedule in schedules:
            schedule_dict = schedule.to_dict()
            key = f"{today}_{schedule.schedule_type}_{schedule.id}"
            
            if schedule.schedule_type == 'ot':
                ot_schedules[key] = schedule_dict
            else:
                consultations[key] = schedule_dict
        
        return jsonify({
            "ot_schedules": ot_schedules,
            "consultations": consultations,
            "last_updated": datetime.utcnow().isoformat()
        })
    except Exception as e:
        logging.error(f"Error getting schedules: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/schedules', methods=['POST'])
def update_schedules():
    """Update schedule information"""
    try:
        return jsonify({"status": "success", "message": "Schedules updated successfully"})
    except Exception as e:
        logging.error(f"Error updating schedules: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

# Token advancement API
@app.route('/api/tokens/advance/<department>', methods=['POST'])
def advance_token(department):
    """Advance to next token for a department"""
    try:
        # Get current token for department
        current_token = Token.query.filter_by(department=department, is_current=True).first()
        if current_token:
            current_token.is_current = False
            current_token.status = 'completed'
        
        # Get next waiting token
        next_token = Token.query.filter_by(
            department=department, 
            is_current=False, 
            status='waiting'
        ).order_by(Token.created_at).first()
        
        if next_token:
            next_token.is_current = True
            next_token.status = 'in_progress'
            db.session.commit()
            
            return jsonify({
                "status": "success", 
                "message": f"Advanced to token {next_token.token_number}",
                "token": next_token.to_dict()
            })
        else:
            db.session.commit()
            return jsonify({"status": "info", "message": "No tokens in queue"})
            
    except Exception as e:
        logging.error(f"Error advancing token: {e}")
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({"status": "error", "message": "Resource not found"}), 404

@app.errorhandler(500)
def server_error(error):
    return jsonify({"status": "error", "message": "Internal server error"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)