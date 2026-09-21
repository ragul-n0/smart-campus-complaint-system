from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.auth.dependencies import get_current_user
from app.models.location import Location
from app.models.user import User
from app.schemas.location import LocationResponse

router = APIRouter()


@router.get("", response_model=List[LocationResponse])
def get_locations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve all registered campus locations.
    Requires authenticated user.
    """
    locations = db.query(Location).order_by(Location.name.asc()).all()
    return locations
