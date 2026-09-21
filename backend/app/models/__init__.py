from app.core.database import Base
from app.models.department import Department
from app.models.user import User
from app.models.location import Location
from app.models.complaint import Complaint
from app.models.complaint_update import ComplaintUpdate

__all__ = [
    "Base",
    "Department",
    "User",
    "Location",
    "Complaint",
    "ComplaintUpdate",
]
