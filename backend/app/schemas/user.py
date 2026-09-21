from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.department import DepartmentResponse


class UserRole(str, Enum):
    student = "student"
    staff = "staff"
    admin = "admin"


# Request Schemas
class UserRegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Full name of user")
    username: str = Field(..., min_length=3, max_length=50, description="Unique username")
    password: str = Field(..., min_length=6, max_length=100, description="User password")
    role: UserRole = Field(default=UserRole.student, description="Role: student, staff, or admin")
    department_id: Optional[int] = Field(default=None, description="Optional associated department ID")


class UserLoginRequest(BaseModel):
    username: str = Field(..., min_length=1, description="Username")
    password: str = Field(..., min_length=1, description="Password")


# Response Schemas (Never exposes password_hash)
class UserResponse(BaseModel):
    id: int
    name: str
    username: str
    role: str
    department_id: Optional[int] = None
    department: Optional[DepartmentResponse] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
