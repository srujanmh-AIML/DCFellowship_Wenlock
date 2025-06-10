# Wenlock Hospital Display System

This project is a Flask-based Hospital Display System designed to manage and display real-time information for patients and staff at Wenlock Hospital. It provides an intuitive interface for token management, inventory tracking, emergency alerts, and scheduling for operations and consultations, aiming to streamline hospital operations and enhance patient experience.

## Features

* **Real-time Patient Token Display**: Provides clear, large-format displays of current token numbers and queues across various departments, helping patients navigate efficiently.
* **Comprehensive Staff Control Panel**: A dedicated interface for hospital staff to efficiently manage tokens, update inventory levels, create and dismiss emergency alerts, and view daily schedules.
* **Dynamic Inventory Management**: Tracks essential medications and supplies, including quantities, reorder thresholds, and expiry dates, with an easy-to-use update mechanism.
* **Emergency Alert System**: Allows for the creation and management of critical hospital-wide or location-specific alerts, ensuring rapid communication during emergencies.
* **Operation & Consultation Schedules**: Displays up-to-date Operation Theater (OT) and consultation schedules for the current day, aiding both staff and patient awareness.
* **Robust Database Integration**: Utilizes SQLAlchemy as an ORM to interact with a relational database (configured via `DATABASE_URL` environment variable), ensuring reliable data storage and retrieval.

## Project Structure

The project is structured for modularity and clarity:

You've already provided the content in a very well-structured format that is essentially ready for a README.md file! It includes clear headings, subheadings, and bullet points.

I will simply wrap the content you provided in the appropriate Markdown format, ensuring:

Top-level headings use #.
Second-level headings use ##.
Third-level headings use ###.
Lists use * or -.
Code blocks use triple backticks ``` with language highlighting where appropriate (e.g., bash, json).
Bold text uses **.
Italics use *.
Here's the README.md in the exact format you requested:

Markdown

# Wenlock Hospital Display System

This project is a Flask-based Hospital Display System designed to manage and display real-time information for patients and staff at Wenlock Hospital. It provides an intuitive interface for token management, inventory tracking, emergency alerts, and scheduling for operations and consultations, aiming to streamline hospital operations and enhance patient experience.

## Features

* **Real-time Patient Token Display**: Provides clear, large-format displays of current token numbers and queues across various departments, helping patients navigate efficiently.
* **Comprehensive Staff Control Panel**: A dedicated interface for hospital staff to efficiently manage tokens, update inventory levels, create and dismiss emergency alerts, and view daily schedules.
* **Dynamic Inventory Management**: Tracks essential medications and supplies, including quantities, reorder thresholds, and expiry dates, with an easy-to-use update mechanism.
* **Emergency Alert System**: Allows for the creation and management of critical hospital-wide or location-specific alerts, ensuring rapid communication during emergencies.
* **Operation & Consultation Schedules**: Displays up-to-date Operation Theater (OT) and consultation schedules for the current day, aiding both staff and patient awareness.
* **Robust Database Integration**: Utilizes SQLAlchemy as an ORM to interact with a relational database (configured via `DATABASE_URL` environment variable), ensuring reliable data storage and retrieval.

## Project Structure

The project is structured for modularity and clarity:

├── app.py                  # Main Flask application file defining routes, views, and database interaction.

├── main.py                 # Entry point script for running the Flask development server.

├── models.py               # Defines SQLAlchemy database models for Token, InventoryItem, Alert, and Schedule.

├── populate_db.py          # Utility script to initialize and populate the database with sample data.

├── requirements.txt        # Lists Python dependencies required for the project.

├── static/                 # Contains static assets served by the Flask application.

│   ├── css/
│   │   └── style.css       # Global stylesheet providing a unified look and feel.

│   └── js/
│       ├── dashboard.js    # JavaScript for dynamic interactions and data updates on the dashboard.

│       ├── patient.js      # JavaScript for real-time updates and interactive elements on the patient display.


│       └── staff.js        # JavaScript for handling staff panel controls, form submissions, and data refreshes.

├── templates/              # Jinja2 HTML templates for the web interfaces.

│   ├── base.html           # Base template, defining the common layout (header, nav, footer) for all pages.

│   ├── dashboard.html      # HTML for the administrative dashboard overview.

│   ├── patient.html        # HTML for the patient-facing display screen.

│   └── staff.html          # HTML for the staff control and management panel.

└── data/                   # (Historical/Example Data Files - Primarily for reference or older implementations)

├── alerts.json         # Sample JSON data structure for alerts.

├── inventory.json      # Sample JSON data structure for inventory items.

├── schedules.json      # Sample JSON data structure for schedules.

└── tokens.json         # Sample JSON data structure for tokens and queues.

*Note*: While the current application (`app.py`, `models.py`) leverages SQLAlchemy for persistent data storage, the `.json` files in the `data/` directory contain sample data and might represent an older file-based implementation approach or serve as a reference for data structures.

## Setup and Installation

### Prerequisites

* Python 3.8+
* `pip` (Python package installer)
* A relational database system (e.g., PostgreSQL, MySQL, SQLite). SQLite is used by default for simplicity in development.

### Steps

1.  **Clone the repository**:
    ```bash
    git clone <repository_url>
    cd wenlock-hospital-display-system
    ```

2.  **Create a virtual environment** (highly recommended for dependency isolation):
    ```bash
    python3 -m venv venv
    source venv/bin/activate  # On Windows: `venv\Scripts\activate`
    ```

3.  **Install Python dependencies**:
    ```bash
    pip install -r requirements.txt
    ```
    (Ensure `requirements.txt` contains `Flask`, `Flask-SQLAlchemy`, and `Werkzeug`).

4.  **Configure Environment Variables**:
    Set your database connection string and a secret key for session management.
    For local development with SQLite:
    ```bash
    export DATABASE_URL="sqlite:///site.db"
    export SESSION_SECRET="your_very_secret_key_here_replace_this"
    ```
    For a production environment (e.g., PostgreSQL):
    ```bash
    export DATABASE_URL="postgresql://user:password@host:port/database_name"
    export SESSION_SECRET="a_strong_random_string_for_production_security"
    ```
    Remember to replace `your_very_secret_key_here_replace_this` with a strong, random, and unique string.

5.  **Initialize the Database**:
    The application will automatically create the necessary database tables on first run due to `db.create_all()` in `app.py` when within an application context.

6.  **Populate the Database with Sample Data** (Optional but Recommended for testing/demonstration):
    ```bash
    python3 populate_db.py
    ```
    This script will drop existing tables and repopulate them with sample tokens, inventory items, alerts, and schedules, making it easier to test the system.

7.  **Run the Application**:
    ```bash
    python3 main.py
    ```
    The Flask application will start, typically accessible at `http://127.0.0.1:5000/`.

## API Endpoints

The system exposes a set of RESTful API endpoints for data retrieval and manipulation:

### Tokens
* `GET /api/tokens`: Retrieves current token information, including active tokens for each department and tokens in the queue.
* `POST /api/tokens`: Adds a new token to a department's queue or updates existing token information.
    * **Request Body (example for adding a new token)**:
        ```json
        {
            "department": "general",
            "token_number": "G019",
            "patient_type": "General"
        }
        ```
* `POST /api/tokens/advance/<department>`: Advances the queue to the next token for the specified department.

### Inventory
* `GET /api/inventory`: Fetches the current pharmacy inventory, categorized into medications and supplies.
* `POST /api/inventory`: Updates the quantity of a specific inventory item.
    * **Request Body**:
        ```json
        {
            "item_name": "Paracetamol 500mg",
            "quantity": 200,
            "operation": "set" // Valid operations: "set", "add", or "subtract"
        }
        ```

### Alerts
* `GET /api/alerts`: Retrieves all active alerts and a history of previously dismissed alerts.
* `POST /api/alerts`: Creates a new emergency or general alert.
    * **Request Body**:
        ```json
        {
            "type": "emergency",
            "message": "Fire alarm detected in Block B, please evacuate.",
            "location": "Block B",
            "created_by": "Security"
        }
        ```
* `DELETE /api/alerts/<int:alert_id>`: Deactivates (dismisses) an alert by its ID.

### Schedules
* `GET /api/schedules`: Provides today's Operation Theater (OT) and consultation schedules.
* `POST /api/schedules`: Placeholder for updating schedule information (requires detailed implementation based on specific scheduling needs).

## Website Design (UI/UX)

The Wenlock Hospital Display System is designed with a focus on clarity, accessibility, and ease of use for both patients and staff. It employs a modern, clean aesthetic with a responsive layout, leveraging Bootstrap for structural components and custom CSS for branding and fine-tuned styling.

### Overall Design Philosophy
* **Clarity and Readability**: Information is presented with ample whitespace, legible fonts, and high contrast to ensure ease of reading, especially important for public patient displays.
* **Intuitive Navigation**: A clear navigation bar allows users to switch between the main interfaces effortlessly.
* **Color Palette**: A professional and calming color scheme (primary blue for hospital branding, with green for success, red for danger/alerts, and other muted tones) is used to convey information effectively.
* **Responsiveness**: The layout adapts gracefully to various screen sizes, from large display monitors to smaller staff tablets.
* **Real-time Updates**: Extensive use of JavaScript ensures that critical information, like token numbers and alerts, updates in real-time without requiring page reloads.

### Web Interfaces

#### 1. Dashboard (`/`)
* **Purpose**: A centralized overview for hospital administration and staff, providing key metrics and system status at a glance.
* **Layout**: Features a prominent header with hospital branding and current time. The main content area is organized into cards displaying:
    * **System Status**: Number of display screens, online screens, and pending alerts.
    * **Department Status**: Visual indicators (e.g., green for available, red for busy) for key departments like General, Cardiology, Orthopedics, and Pediatrics.
    * **Recent Alerts**: A scrollable list of active alerts.
    * **Today's Schedule**: Summaries of OT and consultation schedules.
* **Interactivity**: A "Refresh" button allows manual data refresh, though the page auto-updates periodically via `dashboard.js`.

#### 2. Patient Display (`/patient`)
* **Purpose**: Designed for large screens in waiting areas, providing essential information to patients in a highly visible and accessible format.
* **Layout**: Emphasizes large, clear text and numbers.
    * **Welcome Header**: A distinct blue header welcomes patients and provides general instructions.
    * **Emergency Alerts**: A highly prominent, scrolling alert banner (red for critical, yellow for general) is positioned at the top to immediately capture attention for urgent messages. Visual cues and optional audio alerts are used.
    * **Current Token Display**: Large, dynamic cards show the "Now Serving" token for each department, making it easy for patients to identify their turn.
    * **Queue Information**: A clear list of "Tokens in Queue" for each department, giving patients an idea of their wait time.
    * **Departmental Information**: Icons and small descriptions for various hospital departments.
* **Interactivity**: The display automatically refreshes every 15 seconds (`patient.js`) to ensure real-time updates. Alert sounds are integrated for critical announcements.

#### 3. Staff Panel (`/staff`)
* **Purpose**: A control-centric interface for hospital staff to manage daily operations and system parameters.
* **Layout**: Divided into distinct sections for various management tasks:
    * **Message Container**: Provides real-time feedback (success, error, info messages) for actions performed.
    * **Emergency Alert Controls**:
        * **Quick Alert Buttons**: Large, color-coded buttons for common emergency scenarios (e.g., "CODE RED", "CODE BLUE") allowing one-click alert activation.
        * **Custom Alert Form**: A form to create detailed, custom alerts with type, message, and location.
        * **Active Alerts List**: Shows currently active alerts with an option to dismiss them.
    * **Token Management**: Allows staff to input new tokens, advance queues for different departments, and view current token states.
    * **Inventory Update**: A form to select an inventory item and update its quantity, ensuring stock levels are current.
    * **System Statistics**: Displays operational metrics like daily patients, average wait time, OT utilization, and system uptime.
* **Interactivity**: All forms are designed for quick data entry. Actions (like advancing tokens or dismissing alerts) provide immediate visual feedback. The panel also auto-refreshes every 10 seconds (`staff.js`) to keep data current.

## Error Handling

The application includes basic error handling for common HTTP errors:

* `404 Not Found`: Returns a JSON response indicating that the requested resource was not found.
* `500 Internal Server Error`: Returns a JSON response for server-side errors, providing a general error message to the user.

## Development

### Running in Debug Mode

To enable Flask's debug mode (which provides automatic code reloading and a debugger in your browser), set the `FLASK_DEBUG` environment variable to `1` (or `True`):

```bash
export FLASK_DEBUG=1
python3 main.py

Screenshots of the demo website is given below :

![Screenshot 2025-06-10 203644](https://github.com/user-attachments/assets/c2aaaf27-b260-460a-9400-605b0d78a69b)


