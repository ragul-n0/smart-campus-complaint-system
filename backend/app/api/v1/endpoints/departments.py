from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.department import Department
from app.schemas.department import DepartmentResponse

router = APIRouter()


@router.get(
    "",
    response_model=List[DepartmentResponse],
    summary="List all departments",
    description="Returns available campus departments for registration and classification.",
)
@router.get(
    "/",
    response_model=List[DepartmentResponse],
    include_in_schema=False,
)
def list_departments(db: Session = Depends(get_db)):
    return db.query(Department).order_by(Department.name.asc()).all()
