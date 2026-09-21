from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.department import DepartmentResponse
from app.schemas.location import LocationResponse
from app.schemas.complaint import ComplaintHistoryResponse


class UserSummary(BaseModel):
    id: int
    name: str
    username: str
    role: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# Metrics Schemas
class AdminMetricsResponse(BaseModel):
    total_complaints: int
    pending_complaints: int
    assigned_complaints: int
    in_progress_complaints: int
    resolved_complaints: int
    closed_complaints: int

    low_priority: int
    medium_priority: int
    high_priority: int

    total_students: int
    total_staff: int
    total_admins: int

    total_departments: int
    total_locations: int

    complaints_today: int
    complaints_this_month: int
    resolved_this_month: int


class DepartmentStatItem(BaseModel):
    department_id: int
    department_name: str
    total_complaints: int
    pending: int
    assigned: int
    in_progress: int
    resolved: int
    closed: int


class ResolutionStatsResponse(BaseModel):
    avg_resolution_hours: float
    fastest_resolution_hours: Optional[float] = None
    slowest_resolution_hours: Optional[float] = None
    total_resolved: int
    total_closed: int


# User Management Schemas
class AdminUserResponse(BaseModel):
    id: int
    name: str
    username: str
    role: str
    department_id: Optional[int] = None
    department: Optional[DepartmentResponse] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class StaffDepartmentUpdateRequest(BaseModel):
    department_id: int = Field(..., description="Target department ID to assign to the staff member")


class UserRoleUpdateRequest(BaseModel):
    role: str = Field(..., description="Target role: student, staff, or admin")


# Department Management Schemas
class DepartmentCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Department name")
    description: Optional[str] = Field(default=None, max_length=255, description="Department description")


class DepartmentUpdateRequest(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    description: Optional[str] = Field(default=None, max_length=255)


class DepartmentAdminResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    created_at: datetime
    complaint_count: int = 0
    staff_count: int = 0

    model_config = ConfigDict(from_attributes=True)


# Location Management Schemas
class LocationCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Location name")
    description: Optional[str] = Field(default=None, max_length=255, description="Location description")


class LocationUpdateRequest(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    description: Optional[str] = Field(default=None, max_length=255)


class LocationAdminResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    created_at: datetime
    complaint_count: int = 0

    model_config = ConfigDict(from_attributes=True)


# Complaint Management Schemas
class AdminComplaintResponse(BaseModel):
    id: int
    student_id: int
    student: Optional[UserSummary] = None
    title: str
    description: str
    category: str
    priority: str
    location_id: int
    location: Optional[LocationResponse] = None
    department_id: Optional[int] = None
    department: Optional[DepartmentResponse] = None
    assigned_staff_id: Optional[int] = None
    assigned_staff: Optional[UserSummary] = None
    status: str
    image_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class AdminComplaintDetailResponse(AdminComplaintResponse):
    updates: List[ComplaintHistoryResponse] = []


class AdminAssignStaffRequest(BaseModel):
    staff_id: int = Field(..., description="ID of the staff member to assign")


class AdminPriorityUpdateRequest(BaseModel):
    priority: str = Field(..., description="Urgency priority level: Low, Medium, or High")


class AdminDepartmentUpdateRequest(BaseModel):
    department_id: int = Field(..., description="Target department ID to route the complaint")


class AdminStatusUpdateRequest(BaseModel):
    new_status: str = Field(..., description="Target status: Pending, Assigned, In Progress, Resolved, Closed")
    comment: Optional[str] = Field(default=None, max_length=500, description="Action comment")
