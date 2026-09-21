# Setup & Execution Guide

This guide walks through starting and running both the Frontend and Backend from scratch on Windows, macOS, or Linux.

---

## Prerequisites
- **Node.js** (v18 or higher recommended)
- **Python** (v3.10 or higher recommended)
- **Git**

---

## 1. Backend Setup

Open a terminal at the project root:

```bash
cd backend
```

### Step 1.1: Create a Python Virtual Environment
```bash
# On Windows:
python -m venv venv

# On macOS / Linux:
python3 -m venv venv
```

### Step 1.2: Activate the Virtual Environment
```bash
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# If you get a script execution policy error on PowerShell, run:
# Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
# Or use Command Prompt (cmd):
# .\venv\Scripts\activate.bat

# On macOS / Linux:
source venv/bin/activate
```

### Step 1.3: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 1.4: Run the Backend Server
```bash
uvicorn app.main:app --reload --port 8000
```

The backend server will start at `http://localhost:8000`.

---

## 2. Frontend Setup

Open a new, separate terminal window at the project root:

```bash
cd frontend
```

### Step 2.1: Install Node Dependencies
*(Already completed during initialization, but run if needed)*
```bash
npm install
```

### Step 2.2: Start the Vite Development Server
```bash
npm run dev
```

The frontend will be accessible at: `http://localhost:5173`.

---

## 3. Verification

1. **Verify Backend Directly**:
   - Open `http://localhost:8000` in your web browser. You will see:
     ```json
     {
       "message": "Welcome to the Smart Campus Complaint & Issue Management System API",
       "status": "online",
       "docs": "/docs",
       "health_check": "/api/v1/health"
     }
     ```
   - Open `http://localhost:8000/docs` to view the interactive Swagger OpenAPI documentation.
   - Open `http://localhost:8000/api/v1/health` to confirm the SQLite database connection is active.

2. **Verify Frontend**:
   - Open `http://localhost:5173` in your browser.
   - You will see the project welcome card and the live status indicators for both Frontend and Backend.
   - Click the **"Ping Backend API"** button. The Backend Status indicator will show **"Connected"** with the active database type (SQLite).
