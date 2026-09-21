# Smart Campus Complaint & Issue Management System

A centralized, responsive web platform for submitting, tracking, and resolving student and campus facility complaints.

> **Academic Project**: Final-Year B.E. Computer Science & Engineering  
> **Development Cost**: 100% Free & Open Source (No paid APIs or cloud subscriptions required)  
> **Architecture**: Modular Monolith (FastAPI + React + SQLite/PostgreSQL)

---

## Project Structure

```
smart-campus-complaint-system/
├── frontend/               # React + Vite + Tailwind CSS client application
├── backend/                # FastAPI REST API with SQLAlchemy database abstraction
├── ml/                     # Machine learning models, notebooks & pipelines (future phase)
├── docs/                   # Architectural blueprints & detailed setup documentation
└── README.md               # Project entry point and quickstart instructions
```

---

## Core Technologies

- **Frontend**:
  - React 19
  - Vite 8
  - Tailwind CSS 3
  - Responsive design (Mobile, Tablet, Desktop)
- **Backend**:
  - Python 3
  - FastAPI
  - SQLAlchemy 2.0 (ORM)
  - Pydantic v2 (Data Validation)
  - Uvicorn (ASGI Server)
- **Database**:
  - **Development**: SQLite (Zero configuration local file)
  - **Production Ready**: PostgreSQL (Configurable via `.env` without modifying Python code)

---

## Quick Start Guide

### 1. Start the Backend

Open a terminal:

```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# macOS / Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run FastAPI server
uvicorn app.main:app --reload --port 8000
```

- API Base: [http://localhost:8000](http://localhost:8000)
- Interactive API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health Check: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

---

### 2. Start the Frontend

Open a second terminal:

```bash
cd frontend

# Install packages (if not already done)
npm install

# Start Vite dev server
npm run dev
```

- Web UI: [http://localhost:5173](http://localhost:5173)

---

## Database Flexibility: SQLite to PostgreSQL

The backend uses **SQLAlchemy ORM** to decouple code from the underlying database dialect. 
- During development, it defaults to an SQLite file (`campus_complaints.db`) with 0 configuration.
- To use PostgreSQL later, install `psycopg2-binary` and update the `DATABASE_URL` in `backend/.env`. No backend logic needs to be rewritten.

See [docs/architecture.md](docs/architecture.md) for detailed architectural documentation.
