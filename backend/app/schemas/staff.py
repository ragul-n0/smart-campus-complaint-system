from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.department import DepartmentResponse
from app.schemas.location import LocationResponse


class StaffUserSummary(BaseModel):
    id: int
    name: str
    username: str
    role: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class StaffComplaintResponse(BaseModel):
    id: int
    student_id: int
    student: Optional[StaffUserSummary] = None
    title: str
    description: str
    category: str
    priority: str
    location_id: int
    location: Optional[LocationResponse] = None
    department_id: Optional[int] = None
    department: Optional[DepartmentResponse] = None
    assigned_staff_id: Optional[int] = None
    assigned_staff: Optional[StaffUserSummary] = None
    status: str
    image_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class StaffStatusUpdateRequest(BaseModel):
    new_status: str = Field(..., description="Target status: Assigned, In Progress, Resolved, Closed")
    comment: Optional[str] = Field(default=None, max_length=500, description="Status update comment")


class StaffMetricsResponse(BaseModel):
    total: int
    pending: int
    assigned: int
    in_progress: int
    resolved: int
    closed: int
