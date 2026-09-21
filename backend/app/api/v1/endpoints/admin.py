from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from app.core.database import get_db
from app.auth.dependencies import require_roles
from app.models.user import User
from app.models.department import Department
from app.models.location import Location
from app.models.complaint import Complaint
from app.models.complaint_update import ComplaintUpdate
from app.schemas.admin import (
    AdminMetricsResponse,
    DepartmentStatItem,
    ResolutionStatsResponse,
    AdminUserResponse,
    StaffDepartmentUpdateRequest,
    UserRoleUpdateRequest,
    DepartmentCreateRequest,
    DepartmentUpdateRequest,
    DepartmentAdminResponse,
    LocationCreateRequest,
    LocationUpdateRequest,
    LocationAdminResponse,
    AdminComplaintResponse,
    AdminComplaintDetailResponse,
    AdminAssignStaffRequest,
    AdminPriorityUpdateRequest,
    AdminDepartmentUpdateRequest,
    AdminStatusUpdateRequest,
)

router = APIRouter()

ALLOWED_ROLES = ["student", "staff", "admin"]
ALLOWED_PRIORITIES = ["Low", "Medium", "High"]
ALLOWED_STATUSES = ["Pending", "Assigned", "In Progress", "Resolved", "Closed"]


# =====================================================================
# 1. METRICS & ANALYTICS
# =====================================================================

@router.get("/metrics", response_model=AdminMetricsResponse)
def get_admin_metrics(
    db: Session = Depends(get_db),
    _current_admin: User = Depends(require_roles(["admin"])),
):
    """
    Campus-wide metrics: complaint counts, status breakdown, priority counts,
    registered users by role, locations, departments, and temporal activity.
    """
    total_complaints = db.query(Complaint).count()
    pending = db.query(Complaint).filter(Complaint.status == "Pending").count()
    assigned = db.query(Complaint).filter(Complaint.status == "Assigned").count()
    in_progress = db.query(Complaint).filter(Complaint.status == "In Progress").count()
    resolved = db.query(Complaint).filter(Complaint.status == "Resolved").count()
    closed = db.query(Complaint).filter(Complaint.status == "Closed").count()

    low_priority = db.query(Complaint).filter(Complaint.priority == "Low").count()
    medium_priority = db.query(Complaint).filter(Complaint.priority == "Medium").count()
    high_priority = db.query(Complaint).filter(Complaint.priority == "High").count()

    students = db.query(User).filter(User.role == "student").count()
    staff = db.query(User).filter(User.role == "staff").count()
    admins = db.query(User).filter(User.role == "admin").count()

    departments_count = db.query(Department).count()
    locations_count = db.query(Location).count()

    # Time boundaries (UTC)
    now = datetime.now(timezone.utc)
    today_start = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)
    month_start = datetime(now.year, now.month, 1, tzinfo=timezone.utc)

    complaints_today = db.query(Complaint).filter(Complaint.created_at >= today_start).count()
    complaints_this_month = db.query(Complaint).filter(Complaint.created_at >= month_start).count()
    resolved_this_month = (
        db.query(Complaint)
        .filter(Complaint.resolved_at.isnot(None), Complaint.resolved_at >= month_start)
        .count()
    )

    return AdminMetricsResponse(
        total_complaints=total_complaints,
        pending_complaints=pending,
        assigned_complaints=assigned,
        in_progress_complaints=in_progress,
        resolved_complaints=resolved,
        closed_complaints=closed,
        low_priority=low_priority,
        medium_priority=medium_priority,
        high_priority=high_priority,
        total_students=students,
        total_staff=staff,
        total_admins=admins,
        total_departments=departments_count,
        total_locations=locations_count,
        complaints_today=complaints_today,
        complaints_this_month=complaints_this_month,
        resolved_this_month=resolved_this_month,
    )


@router.get("/department-stats", response_model=List[DepartmentStatItem])
def get_department_stats(
    db: Session = Depends(get_db),
    _current_admin: User = Depends(require_roles(["admin"])),
):
    """
    Department-level complaint statistics for all departments.
    """
    departments = db.query(Department).order_by(Department.name.asc()).all()
    stats: List[DepartmentStatItem] = []

    for dept in departments:
        base_query = db.query(Complaint).filter(Complaint.department_id == dept.id)
        total = base_query.count()
        pending = base_query.filter(Complaint.status == "Pending").count()
        assigned = base_query.filter(Complaint.status == "Assigned").count()
        in_progress = base_query.filter(Complaint.status == "In Progress").count()
        resolved = base_query.filter(Complaint.status == "Resolved").count()
        closed = base_query.filter(Complaint.status == "Closed").count()

        stats.append(
            DepartmentStatItem(
                department_id=dept.id,
                department_name=dept.name,
                total_complaints=total,
                pending=pending,
                assigned=assigned,
                in_progress=in_progress,
                resolved=resolved,
                closed=closed,
            )
        )

    return stats


@router.get("/resolution-stats", response_model=ResolutionStatsResponse)
def get_resolution_stats(
    db: Session = Depends(get_db),
    _current_admin: User = Depends(require_roles(["admin"])),
):
    """
    Calculates resolution performance metrics using actual timestamps (created_at -> resolved_at).
    Handles zero resolved complaints gracefully without error.
    """
    resolved_complaints = (
        db.query(Complaint)
        .filter(Complaint.resolved_at.isnot(None), Complaint.created_at.isnot(None))
        .all()
    )

    total_resolved = db.query(Complaint).filter(Complaint.status == "Resolved").count()
    total_closed = db.query(Complaint).filter(Complaint.status == "Closed").count()

    if not resolved_complaints:
        return ResolutionStatsResponse(
            avg_resolution_hours=0.0,
            fastest_resolution_hours=None,
            slowest_resolution_hours=None,
            total_resolved=total_resolved,
            total_closed=total_closed,
        )

    durations_hours = []
    for c in resolved_complaints:
        # Normalize timezones if needed
        c_time = c.created_at
        r_time = c.resolved_at
        if c_time and r_time:
            # Calculate duration in hours
            diff = (r_time - c_time).total_seconds() / 3600.0
            if diff >= 0:
                durations_hours.append(diff)

    if not durations_hours:
        return ResolutionStatsResponse(
            avg_resolution_hours=0.0,
            fastest_resolution_hours=None,
            slowest_resolution_hours=None,
            total_resolved=total_resolved,
            total_closed=total_closed,
        )

    avg_hours = sum(durations_hours) / len(durations_hours)
    fastest = min(durations_hours)
    slowest = max(durations_hours)

    return ResolutionStatsResponse(
        avg_resolution_hours=round(avg_hours, 2),
        fastest_resolution_hours=round(fastest, 2),
        slowest_resolution_hours=round(slowest, 2),
        total_resolved=total_resolved,
        total_closed=total_closed,
    )


# =====================================================================
# 2. USER MANAGEMENT
# =====================================================================

@router.get("/users", response_model=List[AdminUserResponse])
def list_users(
    role_filter: Optional[str] = Query(None, alias="role"),
    department_id: Optional[int] = Query(None, alias="department_id"),
    search: Optional[str] = Query(None, alias="search"),
    db: Session = Depends(get_db),
    _current_admin: User = Depends(require_roles(["admin"])),
):
    """
    List campus users with role, department, and text filters.
    Never exposes passwords, hashes, or auth tokens.
    """
    query = db.query(User)

    if role_filter and role_filter != "All":
        query = query.filter(User.role == role_filter)

    if department_id:
        query = query.filter(User.department_id == department_id)

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                User.name.ilike(term),
                User.username.ilike(term),
            )
        )

    users = query.order_by(User.created_at.desc()).all()
    return users


@router.put("/users/{user_id}/department", response_model=AdminUserResponse)
def update_staff_department(
    user_id: int,
    payload: StaffDepartmentUpdateRequest,
    db: Session = Depends(get_db),
    _current_admin: User = Depends(require_roles(["admin"])),
):
    """
    Assign or update a staff member's department.
    Enforces staff role and validates department existence.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} was not found.",
        )

    if user.role != "staff":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User '{user.username}' is a '{user.role}'. Department assignment is only allowed for staff members.",
        )

    dept = db.query(Department).filter(Department.id == payload.department_id).first()
    if not dept:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Department with ID {payload.department_id} does not exist.",
        )

    user.department_id = payload.department_id
    db.commit()
    db.refresh(user)
    return user


@router.put("/users/{user_id}/role", response_model=AdminUserResponse)
def update_user_role(
    user_id: int,
    payload: UserRoleUpdateRequest,
    db: Session = Depends(get_db),
    _current_admin: User = Depends(require_roles(["admin"])),
):
    """
    Safely update a user's role (student, staff, admin).
    Prevents demoting or removing the final administrator.
    """
    if payload.role not in ALLOWED_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role '{payload.role}'. Allowed roles: {ALLOWED_ROLES}",
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} was not found.",
        )

    # Protect against removing the only administrator
    if user.role == "admin" and payload.role != "admin":
        admin_count = db.query(User).filter(User.role == "admin").count()
        if admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Action denied: Cannot remove the only remaining administrator in the system.",
            )

    user.role = payload.role
    db.commit()
    db.refresh(user)
    return user


# =====================================================================
# 3. DEPARTMENT MANAGEMENT
# =====================================================================

@router.get("/departments", response_model=List[DepartmentAdminResponse])
def list_admin_departments(
    db: Session = Depends(get_db),
    _current_admin: User = Depends(require_roles(["admin"])),
):
    """
    List all departments with complaint count and assigned staff count.
    """
    depts = db.query(Department).order_by(Department.name.asc()).all()
    response = []
    for d in depts:
        complaint_count = db.query(Complaint).filter(Complaint.department_id == d.id).count()
        staff_count = db.query(User).filter(User.department_id == d.id, User.role == "staff").count()
        response.append(
            DepartmentAdminResponse(
                id=d.id,
                name=d.name,
                description=d.description,
                created_at=d.created_at,
                complaint_count=complaint_count,
                staff_count=staff_count,
            )
        )
    return response


@router.post("/departments", response_model=DepartmentAdminResponse, status_code=status.HTTP_201_CREATED)
def create_department(
    payload: DepartmentCreateRequest,
    db: Session = Depends(get_db),
    _current_admin: User = Depends(require_roles(["admin"])),
):
    """
    Create a new campus department.
    Rejects empty or duplicate department names.
    """
    clean_name = payload.name.strip()
    if not clean_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Department name cannot be empty.",
        )

    existing = db.query(Department).filter(func.lower(Department.name) == clean_name.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Department with name '{clean_name}' already exists.",
        )

    dept = Department(
        name=clean_name,
        description=payload.description.strip() if payload.description else None,
    )
    db.add(dept)
    db.commit()
    db.refresh(dept)

    return DepartmentAdminResponse(
        id=dept.id,
        name=dept.name,
        description=dept.description,
        created_at=dept.created_at,
        complaint_count=0,
        staff_count=0,
    )


@router.put("/departments/{department_id}", response_model=DepartmentAdminResponse)
def update_department(
    department_id: int,
    payload: DepartmentUpdateRequest,
    db: Session = Depends(get_db),
    _current_admin: User = Depends(require_roles(["admin"])),
):
    """
    Update department details. Rejects duplicate names.
    """
    dept = db.query(Department).filter(Department.id == department_id).first()
    if not dept:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Department with ID {department_id} does not exist.",
        )

    if payload.name is not None:
        clean_name = payload.name.strip()
        if not clean_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Department name cannot be empty.",
            )
        duplicate = (
            db.query(Department)
            .filter(func.lower(Department.name) == clean_name.lower(), Department.id != department_id)
            .first()
        )
        if duplicate:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Department with name '{clean_name}' already exists.",
            )
        dept.name = clean_name

    if payload.description is not None:
        dept.description = payload.description.strip() if payload.description else None

    db.commit()
    db.refresh(dept)

    complaint_count = db.query(Complaint).filter(Complaint.department_id == dept.id).count()
    staff_count = db.query(User).filter(User.department_id == dept.id, User.role == "staff").count()

    return DepartmentAdminResponse(
        id=dept.id,
        name=dept.name,
        description=dept.description,
        created_at=dept.created_at,
        complaint_count=complaint_count,
        staff_count=staff_count,
    )


@router.delete("/departments/{department_id}")
def delete_department(
    department_id: int,
    db: Session = Depends(get_db),
    _current_admin: User = Depends(require_roles(["admin"])),
):
    """
    Safely delete a department.
    Prevents deletion if the department is referenced by any users or complaints.
    """
    dept = db.query(Department).filter(Department.id == department_id).first()
    if not dept:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Department with ID {department_id} does not exist.",
        )

    complaints_count = db.query(Complaint).filter(Complaint.department_id == department_id).count()
    users_count = db.query(User).filter(User.department_id == department_id).count()

    if complaints_count > 0 or users_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Cannot delete department '{dept.name}'. "
                f"It is currently associated with {complaints_count} complaint(s) and {users_count} user(s). "
                "Reassign them before deleting."
            ),
        )

    db.delete(dept)
    db.commit()
    return {"message": f"Department '{dept.name}' deleted successfully.", "department_id": department_id}


# =====================================================================
# 4. LOCATION MANAGEMENT
# =====================================================================

@router.get("/locations", response_model=List[LocationAdminResponse])
def list_admin_locations(
    db: Session = Depends(get_db),
    _current_admin: User = Depends(require_roles(["admin"])),
):
    """
    List all campus locations with complaint count.
    """
    locations = db.query(Location).order_by(Location.name.asc()).all()
    response = []
    for loc in locations:
        complaint_count = db.query(Complaint).filter(Complaint.location_id == loc.id).count()
        response.append(
            LocationAdminResponse(
                id=loc.id,
                name=loc.name,
                description=loc.description,
                created_at=loc.created_at,
                complaint_count=complaint_count,
            )
        )
    return response


@router.post("/locations", response_model=LocationAdminResponse, status_code=status.HTTP_201_CREATED)
def create_location(
    payload: LocationCreateRequest,
    db: Session = Depends(get_db),
    _current_admin: User = Depends(require_roles(["admin"])),
):
    """
    Create a new campus location. Prevents duplicates and empty names.
    """
    clean_name = payload.name.strip()
    if not clean_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Location name cannot be empty.",
        )

    existing = db.query(Location).filter(func.lower(Location.name) == clean_name.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Location with name '{clean_name}' already exists.",
        )

    loc = Location(
        name=clean_name,
        description=payload.description.strip() if payload.description else None,
    )
    db.add(loc)
    db.commit()
    db.refresh(loc)

    return LocationAdminResponse(
        id=loc.id,
        name=loc.name,
        description=loc.description,
        created_at=loc.created_at,
        complaint_count=0,
    )


@router.put("/locations/{location_id}", response_model=LocationAdminResponse)
def update_location(
    location_id: int,
    payload: LocationUpdateRequest,
    db: Session = Depends(get_db),
    _current_admin: User = Depends(require_roles(["admin"])),
):
    """
    Update location details. Prevents duplicate names.
    """
    loc = db.query(Location).filter(Location.id == location_id).first()
    if not loc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Location with ID {location_id} does not exist.",
        )

    if payload.name is not None:
        clean_name = payload.name.strip()
        if not clean_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Location name cannot be empty.",
            )
        duplicate = (
            db.query(Location)
            .filter(func.lower(Location.name) == clean_name.lower(), Location.id != location_id)
            .first()
        )
        if duplicate:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Location with name '{clean_name}' already exists.",
            )
        loc.name = clean_name

    if payload.description is not None:
        loc.description = payload.description.strip() if payload.description else None

    db.commit()
    db.refresh(loc)

    complaint_count = db.query(Complaint).filter(Complaint.location_id == loc.id).count()

    return LocationAdminResponse(
        id=loc.id,
        name=loc.name,
        description=loc.description,
        created_at=loc.created_at,
        complaint_count=complaint_count,
    )


@router.delete("/locations/{location_id}")
def delete_location(
    location_id: int,
    db: Session = Depends(get_db),
    _current_admin: User = Depends(require_roles(["admin"])),
):
    """
    Safely delete a campus location.
    Prevents deletion if any complaints reference this location.
    """
    loc = db.query(Location).filter(Location.id == location_id).first()
    if not loc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Location with ID {location_id} does not exist.",
        )

    complaints_count = db.query(Complaint).filter(Complaint.location_id == location_id).count()
    if complaints_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Cannot delete location '{loc.name}'. "
                f"It is referenced by {complaints_count} complaint(s)."
            ),
        )

    db.delete(loc)
    db.commit()
    return {"message": f"Location '{loc.name}' deleted successfully.", "location_id": location_id}


# =====================================================================
# 5. ALL COMPLAINTS & OVERSIGHT
# =====================================================================

@router.get("/complaints", response_model=List[AdminComplaintResponse])
def list_admin_complaints(
    status_filter: Optional[str] = Query(None, alias="status"),
    priority_filter: Optional[str] = Query(None, alias="priority"),
    category_filter: Optional[str] = Query(None, alias="category"),
    department_id: Optional[int] = Query(None, alias="department_id"),
    location_id: Optional[int] = Query(None, alias="location_id"),
    search: Optional[str] = Query(None, alias="search"),
    db: Session = Depends(get_db),
    _current_admin: User = Depends(require_roles(["admin"])),
):
    """
    Campus-wide complaint view across all departments and locations.
    Supports comprehensive filtering and keyword search.
    """
    query = db.query(Complaint).join(Complaint.student)

    if status_filter and status_filter != "All":
        query = query.filter(Complaint.status == status_filter)

    if priority_filter and priority_filter != "All":
        query = query.filter(Complaint.priority == priority_filter)

    if category_filter and category_filter != "All":
        query = query.filter(Complaint.category == category_filter)

    if department_id:
        query = query.filter(Complaint.department_id == department_id)

    if location_id:
        query = query.filter(Complaint.location_id == location_id)

    if search and search.strip():
        term = f"%{search.strip()}%"
        search_conditions = [
            Complaint.title.ilike(term),
            Complaint.description.ilike(term),
            User.name.ilike(term),
            User.username.ilike(term),
        ]
        if search.strip().isdigit():
            search_conditions.append(Complaint.id == int(search.strip()))
        query = query.filter(or_(*search_conditions))

    complaints = query.order_by(Complaint.created_at.desc()).all()
    return complaints


@router.get("/complaints/{complaint_id}", response_model=AdminComplaintDetailResponse)
def get_admin_complaint_details(
    complaint_id: int,
    db: Session = Depends(get_db),
    _current_admin: User = Depends(require_roles(["admin"])),
):
    """
    Retrieve full complaint details including student, location, department,
    assigned staff, and historical timeline updates.
    """
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Complaint with ID {complaint_id} was not found.",
        )
    return complaint


# =====================================================================
# 6. ADMIN COMPLAINT ACTIONS
# =====================================================================

@router.put("/complaints/{complaint_id}/assign", response_model=AdminComplaintResponse)
def admin_assign_complaint(
    complaint_id: int,
    payload: AdminAssignStaffRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_roles(["admin"])),
):
    """
    Admin assigns a complaint to a staff member.
    The staff member must belong to the complaint's assigned department.
    """
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Complaint with ID {complaint_id} was not found.",
        )

    staff = db.query(User).filter(User.id == payload.staff_id).first()
    if not staff:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Staff member with ID {payload.staff_id} was not found.",
        )

    if staff.role != "staff":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User '{staff.name}' is a '{staff.role}', not a staff member.",
        )

    if complaint.department_id is not None and staff.department_id != complaint.department_id:
        dept_name = complaint.department.name if complaint.department else f"ID {complaint.department_id}"
        staff_dept_name = staff.department.name if staff.department else "None"
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Department mismatch: Staff '{staff.name}' belongs to '{staff_dept_name}', "
                f"but complaint belongs to '{dept_name}'."
            ),
        )

    old_status = complaint.status
    complaint.assigned_staff_id = staff.id

    if complaint.status == "Pending":
        complaint.status = "Assigned"

    history_log = ComplaintUpdate(
        complaint_id=complaint.id,
        updated_by=current_admin.id,
        old_status=old_status,
        new_status=complaint.status,
        comment=f"Complaint assigned to staff member {staff.name} by Administrator",
    )
    db.add(history_log)
    db.commit()
    db.refresh(complaint)

    return complaint


@router.put("/complaints/{complaint_id}/priority", response_model=AdminComplaintResponse)
def admin_update_priority(
    complaint_id: int,
    payload: AdminPriorityUpdateRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_roles(["admin"])),
):
    """
    Admin updates complaint priority (Low, Medium, High).
    Records an entry in the complaint audit history.
    """
    if payload.priority not in ALLOWED_PRIORITIES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid priority '{payload.priority}'. Allowed: {ALLOWED_PRIORITIES}",
        )

    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Complaint with ID {complaint_id} was not found.",
        )

    old_priority = complaint.priority
    complaint.priority = payload.priority

    history_log = ComplaintUpdate(
        complaint_id=complaint.id,
        updated_by=current_admin.id,
        old_status=complaint.status,
        new_status=complaint.status,
        comment=f"Priority changed from {old_priority} to {payload.priority} by Administrator",
    )
    db.add(history_log)
    db.commit()
    db.refresh(complaint)

    return complaint


@router.put("/complaints/{complaint_id}/department", response_model=AdminComplaintResponse)
def admin_update_department(
    complaint_id: int,
    payload: AdminDepartmentUpdateRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_roles(["admin"])),
):
    """
    Admin reroutes a complaint to another department.
    If the currently assigned staff does not belong to the new department,
    their assignment is safely cleared and status set back to Pending if currently Assigned.
    """
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Complaint with ID {complaint_id} was not found.",
        )

    new_dept = db.query(Department).filter(Department.id == payload.department_id).first()
    if not new_dept:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Department with ID {payload.department_id} does not exist.",
        )

    old_dept_name = complaint.department.name if complaint.department else "None"
    cleared_assignment = False

    if complaint.assigned_staff_id:
        assigned_staff = db.query(User).filter(User.id == complaint.assigned_staff_id).first()
        if assigned_staff and assigned_staff.department_id != new_dept.id:
            complaint.assigned_staff_id = None
            cleared_assignment = True
            if complaint.status == "Assigned":
                complaint.status = "Pending"

    complaint.department_id = new_dept.id

    comment = f"Department reassigned from {old_dept_name} to {new_dept.name} by Administrator"
    if cleared_assignment:
        comment += " (Previous staff assignment cleared due to department change)"

    history_log = ComplaintUpdate(
        complaint_id=complaint.id,
        updated_by=current_admin.id,
        old_status=complaint.status,
        new_status=complaint.status,
        comment=comment,
    )
    db.add(history_log)
    db.commit()
    db.refresh(complaint)

    return complaint


@router.put("/complaints/{complaint_id}/status", response_model=AdminComplaintResponse)
def admin_update_status(
    complaint_id: int,
    payload: AdminStatusUpdateRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_roles(["admin"])),
):
    """
    Admin administrative status update with audit history recording.
    Sets resolved_at timestamp when transitioning to Resolved.
    """
    if payload.new_status not in ALLOWED_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status '{payload.new_status}'. Allowed: {ALLOWED_STATUSES}",
        )

    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Complaint with ID {complaint_id} was not found.",
        )

    old_status = complaint.status
    complaint.status = payload.new_status

    if payload.new_status == "Resolved" and not complaint.resolved_at:
        complaint.resolved_at = func.now()

    comment_text = (
        payload.comment.strip()
        if payload.comment and payload.comment.strip()
        else f"Status updated to {payload.new_status} by Administrator"
    )

    history_log = ComplaintUpdate(
        complaint_id=complaint.id,
        updated_by=current_admin.id,
        old_status=old_status,
        new_status=payload.new_status,
        comment=comment_text,
    )
    db.add(history_log)
    db.commit()
    db.refresh(complaint)

    return complaint
