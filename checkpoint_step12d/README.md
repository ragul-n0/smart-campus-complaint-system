# Smart Campus Complaint & Issue Management System

An intelligent, full-stack, automated campus facility complaint and grievance lifecycle management platform with integrated Machine Learning prediction, role-based workflows, smart analytics, and executive reporting.

> **Academic Project**: Final-Year B.E. Computer Science & Engineering  
> **Cost Model**: 100% Free & Open Source (No paid APIs, subscriptions, or external LLM tokens)  
> **Architecture**: Unified Single-Link Modular Monolith (FastAPI + React 19 + Scikit-Learn + ReportLab + SQLite/PostgreSQL)

---

## 🌟 Key Highlights

- **Student Portal**: Authenticated submission portal with real-time ML category and priority auto-classification, rich descriptions, location tagging, and an immutable visual lifecycle timeline.
- **Staff Operations**: Department-isolated operational queue, complaint self-assignment, stage transitions (Pending → Assigned → In Progress → Resolved → Closed), and mandatory resolution audit remarks.
- **Admin Command Center**: Complete oversight across campus complaints, users, departments, locations, and audit logs.
- **Smart Analytics Engine (Step 12A/B)**: High-performance database aggregation calculating overview KPIs, temporal submission trends (daily/weekly/monthly), status/category/priority/location distributions, and department resolution speed metrics.
- **Smart Campus Insights (Step 12C)**: 100% deterministic, factual campus operational observations dynamically updated based on active filters (no external AI APIs, zero hallucinations).
- **Executive Reporting (Step 12C)**: Instant downloads of 10-section structured CSV reports and publication-ready multi-page PDF documents built with ReportLab.
- **Unified Single-Link Deployment**: FastAPI serves the optimized React SPA production bundle, REST API endpoints, Swagger docs, and ML models under a single web origin.

---

## 🏗️ System Architecture

```
                                  Client Browser
                                (Desktop / Mobile)
                                        │
                                        ▼
                  ┌───────────────────────────────────────────┐
                  │              FastAPI Backend              │
                  │              (Port 8000 / $PORT)          │
                  │                                           │
                  │  ┌──────────────┐      ┌───────────────┐  │
                  │  │  React SPA   │      │   REST API    │  │
                  │  │ (index.html) │      │   (/api/v1)   │  │
                  │  └──────────────┘      └───────────────┘  │
                  │         ▲                      │          │
                  │         │                      ▼          │
                  │  ┌──────────────┐      ┌───────────────┐  │
                  │  │ Static Assets│      │ SQLAlchemy    │  │
                  │  │  (/assets/*) │      │   ORM Layer   │  │
                  │  └──────────────┘      └───────────────┘  │
                  └─────────────┬──────────────────┬──────────┘
                                │                  │
                     ┌──────────▼─────────┐ ┌──────▼──────────┐
                     │ Scikit-Learn ML    │ │ SQLite Database │
                     │ Category & Priority│ │ (campus_        │
                     │ TF-IDF Classifiers │ │  complaints.db) │
                     └────────────────────┘ └─────────────────┘
```

---

## 💻 Technology Stack

| Component | Technologies | Purpose |
| :--- | :--- | :--- |
| **Frontend UI** | React 19, Vite 8, Tailwind CSS, Lucide Icons | Responsive modern SPA with CampusFlow design system |
| **Backend API** | Python 3.11+, FastAPI, Pydantic v2, Uvicorn | High-performance asynchronous REST endpoints & SPA fallback |
| **ORM & DB** | SQLAlchemy 2.0, SQLite (Dev/Demo), PostgreSQL ready | Database abstraction with automatic migration capability |
| **Machine Learning**| Scikit-learn, Joblib, NumPy, TF-IDF Vectorizers | Dual NLP text classification for category & priority |
| **Reporting** | ReportLab 5.0+, Python `csv` | Professional multi-page PDF & RFC 4180 CSV exports |
| **Security** | PyJWT, Passlib, BCrypt, HTTPBearer | Role-Based Access Control (Student, Staff, Admin) |

---

## 🔄 Complaint Lifecycle State Machine

Complaints strictly follow a 5-stage transition pipeline with tamper-proof historical logging:

```
    [ Pending ]
         │ (Staff self-assigns)
         ▼
    [ Assigned ]
         │ (Staff begins investigation)
         ▼
   [ In Progress ]
         │ (Staff resolves issue + mandatory remarks)
         ▼
    [ Resolved ]
         │ (Staff verifies & finalizes)
         ▼
     [ Closed ] ───▶ (Terminal state: Immutable)
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.10+
- Node.js 18+
- Git

### 1. Unified Single-Server Mode (Recommended Production Simulation)

Build the frontend once and let FastAPI serve everything on a single port:

```bash
# 1. Build Frontend
cd frontend
npm install
npm run build
cd ..

# 2. Setup Backend & Run
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\Activate.ps1
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --port 8000
```

- **Web Application**: [http://localhost:8000](http://localhost:8000)
- **Interactive Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check**: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

### 2. Dual-Server Development Mode (With Hot Reloading)

```bash
# Terminal 1: Backend
cd backend
.\venv\Scripts\activate
uvicorn app.main:app --reload --port 8000

# Terminal 2: Frontend (Vite)
cd frontend
npm run dev
```

- **Frontend with HMR**: [http://localhost:5173](http://localhost:5173)

---

## 🧪 Testing & Quality Assurance

Run the complete regression test suite:

```bash
# Backend test suite (119 tests)
cd backend
python -m pytest -q

# Machine Learning specific tests
python -m pytest tests/test_ml.py -q

# End-to-end user workflow test
python -m pytest tests/test_e2e_production.py -q

# Frontend lint & build
cd ../frontend
npm run lint
npm run build
```

---

## ☁️ Cloud Deployment (Render)

This repository includes turnkey deployment configuration for Render:
- `render.yaml`: Blueprint configuring Python 3.11, frontend build, pip dependencies, and start command.
- `Procfile`: Command binding to dynamic `$PORT` and listening on `0.0.0.0`.

### Deployment Steps:
1. Push repository to GitHub.
2. In Render Dashboard, click **New > Blueprint** and select this repository.
3. Render automatically executes:
   `cd frontend && npm install && npm run build && cd ../backend && pip install -r requirements.txt`
   and starts:
   `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### ⚠️ Deployment Limitation Note (Ephemeral Storage)
Render's free tier provides an ephemeral container filesystem. While SQLite (`campus_complaints.db`) functions seamlessly for demonstration, data is reset whenever the free container spins down or redeploys. For permanent data retention in production, update `DATABASE_URL` to a managed PostgreSQL database in `backend/.env`.

---

## 📁 Repository Structure

```
smart-campus-complaint-system/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/  # Auth, Complaints, Staff, Admin, Analytics
│   │   ├── core/              # Config, Database, Init DB
│   │   ├── models/            # SQLAlchemy DB models
│   │   ├── schemas/           # Pydantic validation schemas
│   │   └── services/          # Analytics, ML predictor, PDF/CSV report services
│   ├── tests/                 # Full Pytest test suite (119 passing tests)
│   └── requirements.txt       # Production Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/        # CampusFlow UI & Analytics components
│   │   ├── pages/             # Student, Staff, Admin views
│   │   └── services/          # API integration services
│   ├── package.json
│   └── vite.config.js
├── ml/
│   └── models/                # Step 8C trained category & priority joblib models
├── docs/                      # Architectural specifications & walkthroughs
├── render.yaml                # Render cloud deployment blueprint
├── Procfile                   # Cloud process execution command
└── README.md
```

---

## 🎓 Academic Credit & License

Developed as a Final-Year Engineering Project for Bachelor of Engineering (B.E.) in Computer Science & Engineering.  
Distributed under the MIT Open Source License.
