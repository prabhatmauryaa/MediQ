# MediQueue — Hospital OPD Queue & Clinical Workstation

A complete outpatient department (OPD) queue coordination and clinical EHR workstation.

## Architecture

```
MediQ/
├── frontend/                     # Client Web Application
│   ├── index.html                # Home Landing Page & Doctor Directory
│   ├── login.html                # Patient & Doctor Authentication Portal
│   ├── register.html             # Patient & Doctor Registration
│   ├── dashboard.html            # Patient OPD Dashboard
│   ├── doctor-dashboard.html     # Doctor Clinical Station & Digital Prescription Pad
│   ├── book-appointment.html     # OPD Appointment Booking & Token Generator
│   ├── my-token.html             # Live OPD Queue & Token Tracker
│   ├── settings.html             # Account Preferences & Notification Settings
│   ├── forgot-password.html      # Account Recovery
│   ├── styles.css                # Global Design System (Dark/Light Clinical Theme)
│   └── script.js                 # Frontend Controller & Real-Time API Client
│
├── backend/                      # Complete Backend Server & Internal Database
│   ├── server.js                 # Express REST API Server & Frontend Host
│   ├── database.js               # Internal Relational Database Engine (SQLite + JSON)
│   ├── package.json              # Backend Package Manifest
│   └── data/                     # Runtime database files (created locally; not tracked)
│
├── package.json                  # Root NPM Configuration
└── README.md                     # Documentation
```

---

## Internal Database Engine

MediQueue uses a zero-configuration, self-contained internal database with dual persistence. Runtime files are created in `backend/data/` and are excluded from version control to avoid publishing patient data:
1. **SQLite (`mediqueue.sqlite`)**: High-performance relational database with structured tables (`doctors`, `users`, `tokens`, `audit_logs`).
2. **JSON Mirror (`db.json`)**: Live-synchronized human-readable file for instant inspection, debugging, and portability.

### Database Tables:
* **`doctors`**: Staff ID, name, department, specialization, room, schedule, credentials.
* **`users`**: Patient registration records, demographics, contact info, credentials.
* **`tokens`**: Real-time queue appointments, status (`Waiting`, `In Consultation`, `Done`, `Cancelled`), priority, clinical vitals, and digital prescriptions.
* **`audit_logs`**: Timestamped operational event log for all consultations, bookings, and logins.

---

## RESTful API Endpoints

| Category | Method | Endpoint | Description |
|---|---|---|---|
| **System** | `GET` | `/api/health` | Uptime, database engine, and active queue counts |
| **Auth** | `POST` | `/api/auth/register` | Register new patient or doctor account |
| **Auth** | `POST` | `/api/auth/login` | Universal doctor/patient authentication |
| **Auth** | `POST` | `/api/auth/forgot-password` | Dispatches password reset instructions |
| **Users** | `GET` | `/api/users` | List registered patients (safe view) |
| **Users** | `PATCH` | `/api/users/:email` | Update patient profile details |
| **Doctors** | `GET` | `/api/doctors` | List all doctors (filterable by `?dept=`) |
| **Doctors** | `GET` | `/api/doctors/:id` | Get single doctor information |
| **Doctors** | `POST` | `/api/doctors` | Register new doctor directly |
| **Doctors** | `PATCH` | `/api/doctors/:id/status` | Update OPD status (`active`, `break`, `closed`) |
| **Queue** | `GET` | `/api/tokens` | List queue tokens (filterable by doctor, dept, status) |
| **Queue** | `GET` | `/api/tokens/:code` | Get specific token details & prescription |
| **Queue** | `POST` | `/api/tokens` | Book appointment & issue queue token |
| **Queue** | `POST` | `/api/tokens/walk-in` | Direct emergency walk-in token entry |
| **Queue** | `POST` | `/api/tokens/call-next` | Doctor "Call Next" patient from waiting queue |
| **Queue** | `PATCH` | `/api/tokens/:code` | Update status, vitals, or digital prescription |
| **Queue** | `DELETE` | `/api/tokens/:code` | Cancel / remove token |
| **Prescriptions** | `GET` | `/api/prescriptions` | Retrieve digital prescriptions by token/patient |
| **Analytics** | `GET` | `/api/stats` | Live OPD counts per department |
| **Audit** | `GET` | `/api/audit-logs` | Database transaction audit trail |
| **Database** | `GET` | `/api/database/export` | Export entire database as JSON |
| **Database** | `POST` | `/api/reset-data` | Reset to clean factory seed state |

---

## How to Run

```bash
# From workspace root
npm start
```
Open **`http://localhost:3000`** in your browser.

## Demo Credentials
* **Doctor Workstation**: `DR-004` / `doctor123` (Dr. Rohan Verma)
* **Patient Portal**: `aditi@example.com` / `password123`
