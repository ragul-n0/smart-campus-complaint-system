# System Architecture

## Overview
The **Smart Campus Complaint & Issue Management System** is structured as a clean, modular monolith designed specifically for a final-year B.E. Computer Science project. It emphasizes:
- **Zero Cost**: Built entirely using open-source, community-driven technologies with no paid APIs, no cloud subscription requirements, and free local development.
- **Maintainability for a Solo Developer**: Clean division of concerns without complex distributed services, Kubernetes, or microservice overhead.
- **Progressive Enhancement**: Modular layers that allow seamless transition from local prototyping (SQLite) to production-ready relational databases (PostgreSQL).

---

## High-Level Architecture

```
+-------------------------------------------------------------+
|                      Client Browser                         |
|  (Desktop / Tablet / Mobile - Responsive Tailwind UI)       |
+-------------------------------------------------------------+
                              |
                     HTTP / JSON (REST)
                              |
                              v
+-------------------------------------------------------------+
|                     FastAPI Backend                         |
|                                                             |
|  [CORS Middleware]                                          |
|         |                                                   |
|  [API Router: /api/v1]                                      |
|    ├── Health check (/health)                               |
|    ├── Authentication (/auth/register, /login, /me)         |
|    ├── Departments (/departments)                           |
|    └── (Future: Complaints, Analytics, Feedback)            |
|         |                                                   |
|  [Dependency Injection: get_db]                             |
|         |                                                   |
|  [SQLAlchemy ORM Engine & Session]                          |
+-------------------------------------------------------------+
                              |
                   Database Abstraction Layer
                              |
       +----------------------+----------------------+
       |                                             |
       v                                             v
[Local Dev: SQLite]                      [Future: PostgreSQL]
(Single file: campus_complaints.db)      (Local / Free Cloud DB)
```

---

## Technology Stack

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend** | React 19 + Vite + Tailwind CSS | Instant Hot Module Replacement (HMR), utility-first styling, fully responsive without heavy UI libraries. |
| **Backend** | Python 3.14 + FastAPI + Pydantic v2 | High performance, automatic OpenAPI / Swagger documentation, strict type validation. |
| **ORM** | SQLAlchemy 2.0 | Standard Python database abstraction layer decoupling business logic from underlying SQL engine. |
| **Database** | SQLite (Dev) / PostgreSQL (Target) | Zero-configuration file database for development; easy `.env` switch to PostgreSQL for evaluation/production. |
| **ML (Future)**| scikit-learn + pandas + NLP | Open-source, CPU-friendly machine learning for automated category classification and priority scoring. |

---

## Database Migration Strategy (SQLite to PostgreSQL)

One of the project requirements is ensuring the database can transition from SQLite to PostgreSQL without refactoring or rewriting code.

### How this is achieved:
1. **SQLAlchemy Engine Abstraction**:
   In `backend/app/core/database.py`, database connections are created dynamically from `settings.DATABASE_URL`.
2. **Conditional Dialect Config**:
   ```python
   connect_args = {}
   if settings.DATABASE_URL.startswith("sqlite"):
       connect_args = {"check_same_thread": False}
   
   engine = create_engine(settings.DATABASE_URL, connect_args=connect_args)
   ```
3. **Switching is a 1-Line Change**:
   To switch to PostgreSQL later:
   - In `backend/requirements.txt`, install a PostgreSQL driver:
     ```bash
     pip install psycopg2-binary
     ```
   - In `backend/.env`, change:
     ```env
     # SQLite (current)
     # DATABASE_URL=sqlite:///./campus_complaints.db

     # PostgreSQL (switch to this)
     DATABASE_URL=postgresql://username:password@localhost:5432/campus_complaints_db
     ```
   **No endpoint, model, or controller code needs to be modified.**

---

## Folder Organization

```
smart-campus-complaint-system/
├── frontend/               # React + Vite client
│   ├── public/             # Static public assets
│   ├── src/
│   │   ├── assets/         # Images, icons, logos
│   │   ├── components/     # Reusable React components (Navbar, Modal, etc.)
│   │   ├── pages/          # Full page views
│   │   ├── services/       # Central API client (fetch / axios abstraction)
│   │   ├── App.jsx         # Root component
│   │   ├── index.css       # Tailwind directives & base styles
│   │   └── main.jsx        # Entry point mounting React DOM
│   ├── tailwind.config.js  # Tailwind CSS configuration
│   ├── postcss.config.js   # PostCSS configuration
│   ├── vite.config.js      # Vite build configuration
│   └── package.json        # Dependencies & scripts
│
├── backend/                # FastAPI REST API server
│   ├── app/
│   │   ├── api/v1/         # Versioned route controllers & routers
│   │   │   ├── endpoints/  # Specific route handlers (health, etc.)
│   │   │   └── router.py   # Aggregates sub-routers into /api/v1
│   │   ├── core/           # Configuration, security, and database session
│   │   │   ├── config.py   # Pydantic BaseSettings loading from .env
│   │   │   └── database.py # SQLAlchemy engine, Base, and session dependency
│   │   ├── models/         # SQLAlchemy database models
│   │   ├── schemas/        # Pydantic validation schemas
│   │   └── main.py         # App factory, CORS setup, and route mounting
│   ├── .env.example        # Environment variables template
│   └── requirements.txt    # Python dependencies
│
├── ml/                     # Machine learning pipelines & experiments
│   ├── data/               # Raw and processed datasets
│   ├── models/             # Exported model weights/binaries
│   ├── notebooks/          # Jupyter exploration notebooks
│   ├── src/                # Reusable training & inference code
│   └── requirements.txt    # ML dependencies (scikit-learn, etc.)
│
├── docs/                   # System documentation & setup manuals
└── README.md               # Project root overview
```
