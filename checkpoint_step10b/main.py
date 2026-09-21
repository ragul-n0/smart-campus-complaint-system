from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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

# Mount API V1 routes
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Root"])
def read_root():
    """
    Root endpoint offering basic API meta information and Swagger links.
    """
    return {
        "message": "Welcome to the Smart Campus Complaint & Issue Management System API",
        "status": "online",
        "docs": "/docs",
        "health_check": f"{settings.API_V1_STR}/health",
    }
