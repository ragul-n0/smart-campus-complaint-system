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

## 3. Local Production-Like Execution (Single-Server Mode)

To simulate production without running two separate servers:

```bash
# 1. Build the React frontend into static production assets
cd frontend
npm run build
cd ..

# 2. Start FastAPI server
cd backend
.\venv\Scripts\activate
uvicorn app.main:app --port 8000
```

- Navigate to [http://localhost:8000](http://localhost:8000). FastAPI directly serves the React SPA, static `/assets`, API endpoints at `/api/v1`, and Swagger docs at `/docs`.

---

## 4. Running the Test Suite

```bash
cd backend
python -m pytest -q

# Machine Learning specific test suite
python -m pytest tests/test_ml.py -q

# Full End-to-End lifecycle simulation
python -m pytest tests/test_e2e_production.py -q

# Frontend lint & build verification
cd ../frontend
npm run lint
npm run build
```

---

## 5. Cloud Deployment (Render)

1. Push your repository to GitHub:
   ```bash
   git push origin main
   ```
2. Log into [Render](https://render.com) and click **New > Blueprint**.
3. Connect your repository. Render automatically reads `render.yaml`, builds the frontend, installs Python packages, and boots Uvicorn with `$PORT`.
4. **Note on Free Tier**: Render's free tier uses an ephemeral filesystem. Any complaints submitted into SQLite are reset upon redeployment or restart. For persistence across deployments, configure a managed PostgreSQL instance in Render and update `DATABASE_URL`.
