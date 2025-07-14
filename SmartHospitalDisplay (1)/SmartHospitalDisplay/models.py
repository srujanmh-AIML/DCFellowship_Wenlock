from datetime import datetime
from app import db


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