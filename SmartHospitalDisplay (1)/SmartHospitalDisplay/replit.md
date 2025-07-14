# Wenlock Hospital Smart Display System

## Overview

The Wenlock Hospital Smart Display System is a web-based application designed to manage and display real-time information for a hospital environment. It provides multiple interfaces for different user types (patients, staff, and administrators) to view and manage token queues, inventory, alerts, and schedules.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Template Engine**: Jinja2 templates with Bootstrap 5 for responsive design
- **JavaScript**: Vanilla JavaScript with class-based architecture for each module
- **CSS**: Custom CSS with CSS variables for theming and responsive design
- **Real-time Updates**: AJAX-based polling for live data updates

### Backend Architecture
- **Framework**: Flask web framework with SQLAlchemy ORM
- **Database**: PostgreSQL (configured via environment variable)
- **Models**: SQLAlchemy models for Token, InventoryItem, Alert, and Schedule entities
- **API**: RESTful endpoints for data exchange between frontend and backend

### Data Storage Solutions
- **Primary Database**: PostgreSQL for persistent data storage
- **Fallback Storage**: JSON files in the `/data` directory for temporary or backup storage
- **Session Management**: Flask sessions with configurable secret key

### Authentication and Authorization
- **Current State**: No authentication system implemented
- **Session Management**: Basic Flask session configuration present
- **Access Control**: No role-based access control currently implemented

## Key Components

### 1. Token Management System
- **Purpose**: Manages patient queue tokens across different departments
- **Features**: Current token display, queue management, patient type categorization
- **Database Model**: Token model with department, token_number, patient_type, status fields

### 2. Inventory Management
- **Purpose**: Tracks medical supplies and medications
- **Features**: Quantity tracking, expiry date monitoring, threshold alerts
- **Database Model**: InventoryItem model with categorization and capacity management

### 3. Alert System
- **Purpose**: Broadcasts emergency and general alerts hospital-wide
- **Features**: Multiple alert types (code red, code blue, general), location-specific alerts
- **Storage**: JSON-based storage with active/inactive status tracking

### 4. Schedule Management
- **Purpose**: Manages operation theater schedules and consultations
- **Features**: OT booking, surgeon assignments, procedure tracking
- **Storage**: JSON-based storage with time slot management

### 5. Display Interfaces
- **Patient Display**: Public-facing interface showing current tokens and queues
- **Staff Panel**: Administrative interface for managing tokens, alerts, and inventory
- **Dashboard**: Overview interface showing system status and metrics

## Data Flow

1. **Token Flow**: Staff creates/updates tokens → Database storage → Real-time display on patient screens
2. **Alert Flow**: Staff triggers alerts → JSON storage → Immediate broadcast to all displays
3. **Inventory Flow**: Staff updates inventory → Database storage → Threshold monitoring → Alert generation
4. **Schedule Flow**: Staff manages schedules → JSON storage → Display on relevant screens

## External Dependencies

### Frontend Dependencies
- **Bootstrap 5**: UI framework for responsive design
- **Font Awesome**: Icon library for consistent iconography
- **jQuery**: JavaScript library for DOM manipulation (implied by usage patterns)

### Backend Dependencies
- **Flask**: Web framework
- **SQLAlchemy**: ORM for database operations
- **Werkzeug**: WSGI utilities and middleware
- **PostgreSQL**: Database system (via environment configuration)

### Development Dependencies
- **Python 3.x**: Runtime environment
- **pip**: Package management

## Deployment Strategy

### Environment Configuration
- **Database**: Configured via `DATABASE_URL` environment variable
- **Sessions**: Configurable via `SESSION_SECRET` environment variable
- **Proxy Support**: Werkzeug ProxyFix middleware for reverse proxy deployments

### Database Setup
- **Migration Strategy**: Manual database creation via `populate_db.py` script
- **Schema Management**: SQLAlchemy models define database schema
- **Sample Data**: Populated via dedicated script with realistic hospital data

### Application Structure
- **Entry Point**: `main.py` runs the Flask application
- **Configuration**: Environment-based configuration for database and sessions
- **Static Assets**: CSS and JavaScript files served from `/static` directory
- **Templates**: Jinja2 templates in `/templates` directory

### Production Considerations
- **Database Connection**: Connection pooling and ping configuration for reliability
- **Logging**: Basic logging configuration for debugging
- **Security**: Basic security measures (session secrets, proxy headers)
- **Performance**: Auto-refresh intervals configured for real-time updates

The system is designed to be deployed in a hospital environment with multiple display screens showing different interfaces based on location and user requirements. The architecture supports real-time updates and can handle multiple concurrent users across different departments.