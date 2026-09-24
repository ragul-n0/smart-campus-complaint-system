"""
Admin Analytics Endpoints.

Provides administrative reporting, KPIs, distribution breakdowns, temporal trends,
and performance metrics for the Smart Campus Complaint System.
Restricted exclusively to authenticated Admin users.
"""

from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status as http_status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.auth.dependencies import require_roles
from app.models.user import User
from app.schemas.analytics import (
    CategoryDistributionItem,
    CategoryPerformanceItem,
    CombinedAnalyticsSummary,
    DepartmentDistributionItem,
    DepartmentPerformanceItem,
    LocationDistributionItem,
    OverviewKPI,
    PriorityDistributionItem,
    ResolutionAnalytics,
    StatusDistributionItem,
    TrendDataPoint,
)
from app.services.analytics_service import analytics_service

router = APIRouter()

VALID_INTERVALS = ["daily", "weekly", "monthly"]


# =====================================================================
# COMBINED ANALYTICS SUMMARY (Primary endpoint for Admin Analytics Page)
# =====================================================================

@router.get(
    "/overview",
    response_model=CombinedAnalyticsSummary,
    summary="Get Combined Analytics Summary",
    description="Returns comprehensive analytics combining KPIs, status/category/priority/department/location distributions, trend, resolution time, and department/category performance.",
)
@router.get(
    "",
    response_model=CombinedAnalyticsSummary,
    include_in_schema=False,
)
def get_combined_analytics_summary(
    start_date: Optional[date] = Query(None, description="Filter start date (inclusive, YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="Filter end date (inclusive, YYYY-MM-DD)"),
    department_id: Optional[int] = Query(None, description="Filter by department ID"),
    category: Optional[str] = Query(None, description="Filter by complaint category"),
    priority: Optional[str] = Query(None, description="Filter by priority (Low, Medium, High)"),
    status: Optional[str] = Query(None, description="Filter by status (Pending, Assigned, In Progress, Resolved, Closed)"),
    location_id: Optional[int] = Query(None, description="Filter by location ID"),
    interval: str = Query("daily", description="Temporal trend interval: daily, weekly, or monthly"),
    db: Session = Depends(get_db),
    _current_admin: User = Depends(require_roles(["admin"])),
):
    if interval not in VALID_INTERVALS:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid trend interval '{interval}'. Allowed intervals: {VALID_INTERVALS}",
        )
    return analytics_service.get_combined_analytics(
        db=db,
        interval=interval,
        start_date=start_date,
        end_date=end_date,
        department_id=department_id,
        category=category,
        priority=priority,
        status=status,
        location_id=location_id,
    )


# =====================================================================
# SPECIALIZED ANALYTICS ENDPOINTS
# =====================================================================

@router.get(
    "/kpis",
    response_model=OverviewKPI,
    summary="Get Overview KPIs",
    description="Returns high-level KPI counts, resolution rate, and closure rate with optional filters.",
)
def get_kpis(
    start_date: Optional[date] = Query(None, description="Filter start date (inclusive, YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="Filter end date (inclusive, YYYY-MM-DD)"),
    department_id: Optional[int] = Query(None, description="Filter by department ID"),
    category: Optional[str] = Query(None, description="Filter by category"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    status: Optional[str] = Query(None, description="Filter by status"),
    location_id: Optional[int] = Query(None, description="Filter by location ID"),
    db: Session = Depends(get_db),
    _current_admin: User = Depends(require_roles(["admin"])),
):
    return analytics_service.get_overview_kpis(
        db=db,
        start_date=start_date,
        end_date=end_date,
        department_id=department_id,
        category=category,
        priority=priority,
        status=status,
        location_id=location_id,
    )


@router.get(
    "/status",
    response_model=List[StatusDistributionItem],
    summary="Get Status Distribution",
    description="Returns complaint distribution across all lifecycle statuses.",
)
def get_status_distribution(
    start_date: Optional[date] = Query(None, description="Filter start date (inclusive, YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="Filter end date (inclusive, YYYY-MM-DD)"),
    department_id: Optional[int] = Query(None, description="Filter by department ID"),
    category: Optional[str] = Query(None, description="Filter by category"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    status: Optional[str] = Query(None, description="Filter by status"),
    location_id: Optional[int] = Query(None, description="Filter by location ID"),
    db: Session = Depends(get_db),
    _current_admin: User = Depends(require_roles(["admin"])),
):
    return analytics_service.get_status_distribution(
        db=db,
        start_date=start_date,
        end_date=end_date,
        department_id=department_id,
        category=category,
        priority=priority,
        status=status,
        location_id=location_id,
    )


@router.get(
    "/categories",
    response_model=List[CategoryDistributionItem],
    summary="Get Category Distribution",
    description="Returns complaint counts and percentage shares across categories, sorted descending.",
)
def get_category_distribution(
    start_date: Optional[date] = Query(None, description="Filter start date (inclusive, YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="Filter end date (inclusive, YYYY-MM-DD)"),
    department_id: Optional[int] = Query(None, description="Filter by department ID"),
    category: Optional[str] = Query(None, description="Filter by category"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    status: Optional[str] = Query(None, description="Filter by status"),
    location_id: Optional[int] = Query(None, description="Filter by location ID"),
    db: Session = Depends(get_db),
    _current_admin: User = Depends(require_roles(["admin"])),
):
    return analytics_service.get_category_distribution(
        db=db,
        start_date=start_date,
        end_date=end_date,
        department_id=department_id,
        category=category,
        priority=priority,
        status=status,
        location_id=location_id,
    )


@router.get(
    "/priorities",
    response_model=List[PriorityDistributionItem],
    summary="Get Priority Distribution",
    description="Returns complaint counts and percentages across priorities (High, Medium, Low).",
)
def get_priority_distribution(
    start_date: Optional[date] = Query(None, description="Filter start date (inclusive, YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="Filter end date (inclusive, YYYY-MM-DD)"),
    department_id: Optional[int] = Query(None, description="Filter by department ID"),
    category: Optional[str] = Query(None, description="Filter by category"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    status: Optional[str] = Query(None, description="Filter by status"),
    location_id: Optional[int] = Query(None, description="Filter by location ID"),
    db: Session = Depends(get_db),
    _current_admin: User = Depends(require_roles(["admin"])),
):
    return analytics_service.get_priority_distribution(
        db=db,
        start_date=start_date,
        end_date=end_date,
        department_id=department_id,
        category=category,
        priority=priority,
        status=status,
        location_id=location_id,
    )


@router.get(
    "/departments",
    response_model=List[DepartmentDistributionItem],
    summary="Get Department Distribution",
    description="Returns complaint distribution across all campus departments.",
)
def get_department_distribution(
    start_date: Optional[date] = Query(None, description="Filter start date (inclusive, YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="Filter end date (inclusive, YYYY-MM-DD)"),
    department_id: Optional[int] = Query(None, description="Filter by department ID"),
    category: Optional[str] = Query(None, description="Filter by category"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    status: Optional[str] = Query(None, description="Filter by status"),
    location_id: Optional[int] = Query(None, description="Filter by location ID"),
    db: Session = Depends(get_db),
    _current_admin: User = Depends(require_roles(["admin"])),
):
    return analytics_service.get_department_distribution(
        db=db,
        start_date=start_date,
        end_date=end_date,
        department_id=department_id,
        category=category,
        priority=priority,
        status=status,
        location_id=location_id,
    )


@router.get(
    "/locations",
    response_model=List[LocationDistributionItem],
    summary="Get Location Distribution",
    description="Returns complaint distribution across campus locations.",
)
def get_location_distribution(
    start_date: Optional[date] = Query(None, description="Filter start date (inclusive, YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="Filter end date (inclusive, YYYY-MM-DD)"),
    department_id: Optional[int] = Query(None, description="Filter by department ID"),
    category: Optional[str] = Query(None, description="Filter by category"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    status: Optional[str] = Query(None, description="Filter by status"),
    location_id: Optional[int] = Query(None, description="Filter by location ID"),
    db: Session = Depends(get_db),
    _current_admin: User = Depends(require_roles(["admin"])),
):
    return analytics_service.get_location_distribution(
        db=db,
        start_date=start_date,
        end_date=end_date,
        department_id=department_id,
        category=category,
        priority=priority,
        status=status,
        location_id=location_id,
    )


@router.get(
    "/trends",
    response_model=List[TrendDataPoint],
    summary="Get Complaint Trends",
    description="Returns temporal submission trends grouped by daily, weekly, or monthly intervals based on created_at.",
)
def get_complaint_trends(
    interval: str = Query("daily", description="Aggregation interval: daily, weekly, or monthly"),
    start_date: Optional[date] = Query(None, description="Filter start date (inclusive, YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="Filter end date (inclusive, YYYY-MM-DD)"),
    department_id: Optional[int] = Query(None, description="Filter by department ID"),
    category: Optional[str] = Query(None, description="Filter by category"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    status: Optional[str] = Query(None, description="Filter by status"),
    location_id: Optional[int] = Query(None, description="Filter by location ID"),
    db: Session = Depends(get_db),
    _current_admin: User = Depends(require_roles(["admin"])),
):
    if interval not in VALID_INTERVALS:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid trend interval '{interval}'. Allowed intervals: {VALID_INTERVALS}",
        )
    return analytics_service.get_trend(
        db=db,
        interval=interval,
        start_date=start_date,
        end_date=end_date,
        department_id=department_id,
        category=category,
        priority=priority,
        status=status,
        location_id=location_id,
    )


@router.get(
    "/resolution",
    response_model=ResolutionAnalytics,
    summary="Get Resolution Time Analytics",
    description="Calculates average, fastest, and slowest resolution duration in hours using resolved_at - created_at.",
)
def get_resolution_analytics(
    start_date: Optional[date] = Query(None, description="Filter start date (inclusive, YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="Filter end date (inclusive, YYYY-MM-DD)"),
    department_id: Optional[int] = Query(None, description="Filter by department ID"),
    category: Optional[str] = Query(None, description="Filter by category"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    status: Optional[str] = Query(None, description="Filter by status"),
    location_id: Optional[int] = Query(None, description="Filter by location ID"),
    db: Session = Depends(get_db),
    _current_admin: User = Depends(require_roles(["admin"])),
):
    return analytics_service.get_resolution_analytics(
        db=db,
        start_date=start_date,
        end_date=end_date,
        department_id=department_id,
        category=category,
        priority=priority,
        status=status,
        location_id=location_id,
    )


@router.get(
    "/department-performance",
    response_model=List[DepartmentPerformanceItem],
    summary="Get Department Performance",
    description="Returns per-department operational breakdown: status counts, resolution rate, and average resolution time.",
)
def get_department_performance(
    start_date: Optional[date] = Query(None, description="Filter start date (inclusive, YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="Filter end date (inclusive, YYYY-MM-DD)"),
    department_id: Optional[int] = Query(None, description="Filter by department ID"),
    category: Optional[str] = Query(None, description="Filter by category"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    status: Optional[str] = Query(None, description="Filter by status"),
    location_id: Optional[int] = Query(None, description="Filter by location ID"),
    db: Session = Depends(get_db),
    _current_admin: User = Depends(require_roles(["admin"])),
):
    return analytics_service.get_department_performance(
        db=db,
        start_date=start_date,
        end_date=end_date,
        department_id=department_id,
        category=category,
        priority=priority,
        status=status,
        location_id=location_id,
    )


@router.get(
    "/category-performance",
    response_model=List[CategoryPerformanceItem],
    summary="Get Category Performance",
    description="Returns per-category resolution performance: total, resolved, closed, open complaints, resolution rate, and average resolution hours.",
)
def get_category_performance(
    start_date: Optional[date] = Query(None, description="Filter start date (inclusive, YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="Filter end date (inclusive, YYYY-MM-DD)"),
    department_id: Optional[int] = Query(None, description="Filter by department ID"),
    category: Optional[str] = Query(None, description="Filter by category"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    status: Optional[str] = Query(None, description="Filter by status"),
    location_id: Optional[int] = Query(None, description="Filter by location ID"),
    db: Session = Depends(get_db),
    _current_admin: User = Depends(require_roles(["admin"])),
):
    return analytics_service.get_category_performance(
        db=db,
        start_date=start_date,
        end_date=end_date,
        department_id=department_id,
        category=category,
        priority=priority,
        status=status,
        location_id=location_id,
    )
