#!/usr/bin/env python3
"""
Script to populate the hospital database with sample data
"""
import sys
sys.path.append('.')

from app import app, db, Token, InventoryItem, Alert, Schedule
from datetime import datetime, date, time

def populate_database():
    with app.app_context():
        # Clear existing data
        db.drop_all()
        db.create_all()
        
        print("Populating tokens...")
        # Add current tokens
        current_tokens = [
            Token(department='general', token_number='G015', patient_type='General', status='in_progress', is_current=True),
            Token(department='cardiology', token_number='C008', patient_type='Follow-up', status='in_progress', is_current=True),
            Token(department='orthopedics', token_number='O012', patient_type='Emergency', status='in_progress', is_current=True),
            Token(department='pediatrics', token_number='P006', patient_type='Vaccination', status='in_progress', is_current=True),
        ]
        
        # Add queue tokens
        queue_tokens = [
            Token(department='general', token_number='G016', patient_type='General', status='waiting'),
            Token(department='general', token_number='G017', patient_type='General', status='waiting'),
            Token(department='general', token_number='G018', patient_type='Senior Citizen', status='waiting'),
            Token(department='cardiology', token_number='C009', patient_type='Follow-up', status='waiting'),
            Token(department='cardiology', token_number='C010', patient_type='New Patient', status='waiting'),
            Token(department='orthopedics', token_number='O013', patient_type='Emergency', status='waiting'),
            Token(department='pediatrics', token_number='P007', patient_type='Vaccination', status='waiting'),
            Token(department='pediatrics', token_number='P008', patient_type='General', status='waiting'),
            Token(department='gynecology', token_number='GY003', patient_type='Consultation', status='waiting'),
        ]
        
        for token in current_tokens + queue_tokens:
            db.session.add(token)
        
        print("Populating inventory...")
        # Add inventory items
        medications = [
            InventoryItem(name='Paracetamol 500mg', quantity=250, unit='tablets', min_threshold=100, max_capacity=1000, category='Analgesic', item_type='medication', expiry_date=date(2025, 12, 31)),
            InventoryItem(name='Amoxicillin 250mg', quantity=75, unit='capsules', min_threshold=50, max_capacity=500, category='Antibiotic', item_type='medication', expiry_date=date(2025, 8, 15)),
            InventoryItem(name='Insulin Glargine', quantity=25, unit='vials', min_threshold=30, max_capacity=100, category='Diabetes', item_type='medication', expiry_date=date(2025, 10, 20)),
            InventoryItem(name='Aspirin 75mg', quantity=180, unit='tablets', min_threshold=100, max_capacity=500, category='Cardiovascular', item_type='medication', expiry_date=date(2026, 3, 10)),
            InventoryItem(name='Morphine 10mg', quantity=15, unit='ampoules', min_threshold=20, max_capacity=50, category='Controlled Substance', item_type='medication', expiry_date=date(2025, 7, 30)),
            InventoryItem(name='Omeprazole 20mg', quantity=120, unit='capsules', min_threshold=50, max_capacity=300, category='Gastric', item_type='medication', expiry_date=date(2025, 11, 15)),
        ]
        
        supplies = [
            InventoryItem(name='Surgical Gloves (Medium)', quantity=450, unit='pairs', min_threshold=200, max_capacity=1000, category='PPE', item_type='supply'),
            InventoryItem(name='N95 Masks', quantity=80, unit='pieces', min_threshold=100, max_capacity=500, category='PPE', item_type='supply'),
            InventoryItem(name='Syringes 10ml', quantity=320, unit='pieces', min_threshold=150, max_capacity=800, category='Injection Supplies', item_type='supply'),
            InventoryItem(name='Gauze Bandages', quantity=95, unit='rolls', min_threshold=100, max_capacity=300, category='Wound Care', item_type='supply'),
            InventoryItem(name='IV Cannula 18G', quantity=55, unit='pieces', min_threshold=75, max_capacity=200, category='IV Supplies', item_type='supply'),
            InventoryItem(name='Blood Collection Tubes', quantity=180, unit='pieces', min_threshold=100, max_capacity=500, category='Laboratory', item_type='supply'),
        ]
        
        for item in medications + supplies:
            db.session.add(item)
        
        print("Populating alerts...")
        # Add sample alert
        alerts = [
            Alert(alert_type='general', message='Pharmacy will be closed for lunch break from 1:00 PM to 2:00 PM', location='Pharmacy Department', is_active=True),
        ]
        
        for alert in alerts:
            db.session.add(alert)
        
        print("Populating schedules...")
        # Add sample schedules
        today = date.today()
        
        ot_schedules = [
            Schedule(schedule_type='ot', procedure_name='Appendectomy', doctor_name='Dr. Rajesh Kumar', patient_id='P001234', room_number='OT-1', start_time=time(9, 0), end_time=time(11, 30), schedule_date=today, status='in_progress', anesthesiologist='Dr. Priya Sharma'),
            Schedule(schedule_type='ot', procedure_name='Knee Replacement', doctor_name='Dr. Suresh Reddy', patient_id='P001235', room_number='OT-2', start_time=time(8, 30), end_time=time(12, 0), schedule_date=today, status='completed', anesthesiologist='Dr. Meera Nair'),
            Schedule(schedule_type='ot', procedure_name='Cardiac Bypass', doctor_name='Dr. Anil Gupta', patient_id='P001236', room_number='OT-3', start_time=time(14, 0), end_time=time(18, 0), schedule_date=today, status='scheduled', anesthesiologist='Dr. Ravi Patel'),
            Schedule(schedule_type='ot', procedure_name='Gallbladder Surgery', doctor_name='Dr. Sunita Das', patient_id='P001237', room_number='OT-4', start_time=time(15, 30), end_time=time(17, 0), schedule_date=today, status='scheduled', anesthesiologist='Dr. Vikram Singh'),
        ]
        
        consultations = [
            Schedule(schedule_type='consultation', department='Cardiology', doctor_name='Dr. Ramesh Iyer', start_time=time(9, 0), end_time=time(12, 0), schedule_date=today, status='ongoing', total_appointments=12, completed_appointments=8),
            Schedule(schedule_type='consultation', department='Orthopedics', doctor_name='Dr. Kavitha Menon', start_time=time(10, 0), end_time=time(13, 0), schedule_date=today, status='ongoing', total_appointments=15, completed_appointments=12),
            Schedule(schedule_type='consultation', department='Pediatrics', doctor_name='Dr. Arjun Nair', start_time=time(9, 30), end_time=time(12, 30), schedule_date=today, status='ongoing', total_appointments=10, completed_appointments=6),
            Schedule(schedule_type='consultation', department='General Medicine', doctor_name='Dr. Lakshmi Pillai', start_time=time(14, 0), end_time=time(17, 0), schedule_date=today, status='scheduled', total_appointments=18, completed_appointments=0),
            Schedule(schedule_type='consultation', department='Gynecology', doctor_name='Dr. Deepa Krishnan', start_time=time(15, 0), end_time=time(18, 0), schedule_date=today, status='scheduled', total_appointments=8, completed_appointments=0),
        ]
        
        for schedule in ot_schedules + consultations:
            db.session.add(schedule)
        
        # Commit all changes
        db.session.commit()
        print("Database populated successfully!")

if __name__ == '__main__':
    populate_database()