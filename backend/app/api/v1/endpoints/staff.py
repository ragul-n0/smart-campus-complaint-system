from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from app.core.database import get_db
from app.auth.dependencies import require_roles
from app.models.user import User
from app.models.complaint import Complaint
from app.models.complaint_update import ComplaintUpdate
from app.schemas.staff import (
    StaffComplaintResponse,
    StaffStatusUpdateRequest,
    StaffMetricsResponse,
)

router = APIRouter()

# Strict allowed status transitions
VALID_TRANSITIONS = {
    "Pending": ["Assigned"],
    "Assigned": ["In Progress"],
    "In Progress": ["Resolved"],
    "Resolved": ["Closed"],
    "Closed": [],
}


def _verify_staff_department(staff: User) -> int:
    """Ensure staff member is assigned to a department."""
    if staff.department_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Staff account is not assigned to any campus department.",
        )
    return staff.department_id


@router.get("/metrics", response_model=StaffMetricsResponse)
def get_staff_metrics(
    db: Session = Depends(get_db),
    current_staff: User = Depends(require_roles(["staff"])),
):
    """
    Get live metric counts for complaints assigned to the staff member's department.
    """
    dept_id = _verify_staff_department(current_staff)

    base_query = db.query(Complaint).filter(Complaint.department_id == dept_id)
    total = base_query.count()
    pending = base_query.filter(Complaint.status == "Pending").count()
    assigned = base_query.filter(Complaint.status == "Assigned").count()
    in_progress = base_query.filter(Complaint.status == "In Progress").count()
    resolved = base_query.filter(Complaint.status == "Resolved").count()
    closed = base_query.filter(Complaint.status == "Closed").count()

    return StaffMetricsResponse(
        total=total,
        pending=pending,
        assigned=assigned,
        in_progress=in_progress,
        resolved=resolved,
        closed=closed,
    )


@router.get("/complaints", response_model=List[StaffComplaintResponse])
def list_department_complaints(
    status_filter: Optional[str] = Query(None, alias="status"),
    category_filter: Optional[str] = Query(None, alias="category"),
    priority_filter: Optional[str] = Query(None, alias="priority"),
    search: Optional[str] = Query(None, alias="search"),
    db: Session = Depends(get_db),
    current_staff: User = Depends(require_roles(["staff"])),
):
    """
    List complaints belonging to the authenticated staff member's department.
    Never returns complaints from other departments.
    """
    dept_id = _verify_staff_department(current_staff)

    query = (
        db.query(Complaint)
        .join(Complaint.student)
        .filter(Complaint.department_id == dept_id)
    )

    # Status filter
    if status_filter and status_filter != "All":
        query = query.filter(Complaint.status == status_filter)

    # Category filter
    if category_filter and category_filter != "All":
        query = query.filter(Complaint.category == category_filter)

    # Priority filter
    if priority_filter and priority_filter != "All":
        query = query.filter(Complaint.priority == priority_filter)

    # Keyword search
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


@router.get("/complaints/{complaint_id}", response_model=StaffComplaintResponse)
def get_department_complaint_details(
    complaint_id: int,
    db: Session = Depends(get_db),
    current_staff: User = Depends(require_roles(["staff"])),
):
    """
    Retrieve full details for a complaint belonging to the staff member's department.
    Rejects complaints belonging to another department with 403 Forbidden.
    """
    dept_id = _verify_staff_department(current_staff)

    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Complaint with ID {complaint_id} was not found.",
        )

    # Strict department isolation
    if complaint.department_id != dept_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: You cannot view complaints outside your department.",
        )

    return complaint


@router.put("/complaints/{complaint_id}/assign", response_model=StaffComplaintResponse)
def assign_complaint_to_self(
    complaint_id: int,
    db: Session = Depends(get_db),
    current_staff: User = Depends(require_roles(["staff"])),
):
    """
    Staff member assigns the complaint to themselves.
    Changes status: Pending -> Assigned.
    Records a ComplaintUpdate history log entry.
    """
    dept_id = _verify_staff_department(current_staff)

    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Complaint with ID {complaint_id} was not found.",
        )

    if complaint.department_id != dept_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: You cannot assign complaints outside your department.",
        )

    old_status = complaint.status
    complaint.assigned_staff_id = current_staff.id

    # If pending, update status to Assigned
    if complaint.status == "Pending":
        complaint.status = "Assigned"

    history_log = ComplaintUpdate(
        complaint_id=complaint.id,
        updated_by=current_staff.id,
        old_status=old_status,
        new_status=complaint.status,
        comment=f"Complaint assigned to staff member {current_staff.name}",
    )
    db.add(history_log)
    db.commit()
    db.refresh(complaint)

    return complaint


@router.put("/complaints/{complaint_id}/status", response_model=StaffComplaintResponse)
def update_complaint_status(
    complaint_id: int,
    payload: StaffStatusUpdateRequest,
    db: Session = Depends(get_db),
    current_staff: User = Depends(require_roles(["staff"])),
):
    """
    Update complaint status following strict transition rules:
    Pending -> Assigned -> In Progress -> Resolved -> Closed.
    Requires non-empty resolution comment when transitioning to 'Resolved'.
    """
    dept_id = _verify_staff_department(current_staff)

    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Complaint with ID {complaint_id} was not found.",
        )

    if complaint.department_id != dept_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: You cannot update complaints outside your department.",
        )

    # Validate transition
    allowed = VALID_TRANSITIONS.get(complaint.status, [])
    if payload.new_status not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status transition from '{complaint.status}' to '{payload.new_status}'. Allowed next statuses: {allowed}.",
        )

    # Resolution comment requirement
    if payload.new_status == "Resolved":
        if not payload.comment or not payload.comment.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A resolution comment is required when marking a complaint as Resolved.",
            )
        complaint.resolved_at = func.now()

    # If unassigned, assign to current staff member
    if complaint.assigned_staff_id is None:
        complaint.assigned_staff_id = current_staff.id

    old_status = complaint.status
    complaint.status = payload.new_status

    # Audit history
    comment_text = (
        payload.comment.strip()
        if payload.comment and payload.comment.strip()
        else f"Status changed to {payload.new_status}"
    )
    history_log = ComplaintUpdate(
        complaint_id=complaint.id,
        updated_by=current_staff.id,
        old_status=old_status,
        new_status=payload.new_status,
        comment=comment_text,
    )
    db.add(history_log)
    db.commit()
    db.refresh(complaint)

    return complaint
