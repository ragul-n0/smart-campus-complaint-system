import os
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.core.init_db import init_db
from app.api.v1.router import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Automatically create missing tables and seed default departments on startup
    init_db()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="REST API for Smart Campus Complaint & Issue Management System",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Set up CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API V1 routes (takes priority over SPA fallback)
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/api", tags=["Root"])
def read_api_root():
    """
    API meta information and Swagger links.
    """
    return {
        "message": "Welcome to the Smart Campus Complaint & Issue Management System API",
        "status": "online",
        "docs": "/docs",
        "health_check": f"{settings.API_V1_STR}/health",
    }


def get_frontend_dist_dir() -> Path:
    """Resolves the frontend/dist directory across local execution and production containers."""
    env_dir = os.environ.get("FRONTEND_DIST_DIR")
    if env_dir:
        p = Path(env_dir)
        if p.exists():
            return p.resolve()

    # 1. Running from workspace root
    p_root = Path("frontend/dist")
    if p_root.exists() and (p_root / "index.html").exists():
        return p_root.resolve()

    # 2. Relative to main.py (__file__ -> backend/app/main.py -> ../../frontend/dist)
    p_rel = Path(__file__).resolve().parents[2] / "frontend" / "dist"
    if p_rel.exists() and (p_rel / "index.html").exists():
        return p_rel.resolve()

    # 3. Running from backend directory
    p_parent = Path("../frontend/dist")
    if p_parent.exists() and (p_parent / "index.html").exists():
        return p_parent.resolve()

    return p_rel


frontend_dist = get_frontend_dist_dir()
assets_dir = frontend_dist / "assets"
if assets_dir.exists() and assets_dir.is_dir():
    app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")


@app.get("/", include_in_schema=False)
async def serve_root():
    """Serves the React application index.html at root, or API status if build is missing."""
    index_file = frontend_dist / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))
    return {
        "message": "Welcome to the Smart Campus Complaint & Issue Management System API",
        "status": "online",
        "docs": "/docs",
        "health_check": f"{settings.API_V1_STR}/health",
    }


@app.exception_handler(StarletteHTTPException)
async def spa_fallback_exception_handler(request: Request, exc: StarletteHTTPException):
    """
    Client-side SPA fallback handler:
    Intercepts 404s for browser routes (/login, /student, /admin, etc.) and serves index.html.
    Preserves strict JSON 404 for missing /api endpoints or Swagger docs.
    """
    if exc.status_code == 404 and request.method == "GET":
        path = request.url.path

        # Never mask API or Docs routes with HTML
        if (
            path.startswith("/api")
            or path.startswith("/docs")
            or path.startswith("/redoc")
            or path.startswith("/openapi.json")
        ):
            return JSONResponse(status_code=404, content={"detail": exc.detail or "Not Found"})

        # Check for static file in frontend_dist (e.g. /favicon.svg, /icons.svg)
        clean_path = path.lstrip("/")
        file_path = frontend_dist / clean_path
        if file_path.is_file() and file_path.exists():
            return FileResponse(str(file_path))

        # Client route fallback: return index.html for React Router
        index_file = frontend_dist / "index.html"
        if index_file.exists():
            return FileResponse(str(index_file))

    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
