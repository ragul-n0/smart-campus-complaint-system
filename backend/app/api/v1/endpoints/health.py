from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.database import get_db
from app.core.config import settings

router = APIRouter()


@router.get("/health", summary="Service Health Check")
def health_check(db: Session = Depends(get_db)):
    """
    Verifies that the FastAPI application and database connection are functioning properly.
    """
    db_status = "disconnected"
    try:
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as exc:
        db_status = f"error: {str(exc)}"

    return {
        "status": "online",
        "project": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "database": {
            "status": db_status,
            "type": "sqlite" if settings.DATABASE_URL.startswith("sqlite") else "postgresql",
        },
    }
