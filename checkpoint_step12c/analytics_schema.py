from datetime import date
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class OverviewKPI(BaseModel):
    total_complaints: int = Field(0, description="Total number of complaints matching filters")
    pending_complaints: int = Field(0, description="Number of complaints in Pending status")
    assigned_complaints: int = Field(0, description="Number of complaints in Assigned status")
    in_progress_complaints: int = Field(0, description="Number of complaints in In Progress status")
    resolved_complaints: int = Field(0, description="Number of complaints in Resolved status")
    closed_complaints: int = Field(0, description="Number of complaints in Closed status")
    high_priority_complaints: int = Field(0, description="Number of High priority complaints")
    medium_priority_complaints: int = Field(0, description="Number of Medium priority complaints")
    low_priority_complaints: int = Field(0, description="Number of Low priority complaints")
    resolution_rate: float = Field(0.0, description="Percentage of complaints resolved or closed: ((resolved + closed) / total) * 100")
    closure_rate: float = Field(0.0, description="Percentage of complaints closed: (closed / total) * 100")

    model_config = ConfigDict(from_attributes=True)


class StatusDistributionItem(BaseModel):
    status: str = Field(..., description="Complaint status name")
    count: int = Field(0, description="Number of complaints with this status")
    percentage: float = Field(0.0, description="Percentage share of this status")

    model_config = ConfigDict(from_attributes=True)


class CategoryDistributionItem(BaseModel):
    category: str = Field(..., description="Complaint category name")
    count: int = Field(0, description="Number of complaints in this category")
    percentage: float = Field(0.0, description="Percentage share of this category")

    model_config = ConfigDict(from_attributes=True)


class PriorityDistributionItem(BaseModel):
    priority: str = Field(..., description="Complaint priority level")
    count: int = Field(0, description="Number of complaints with this priority")
    percentage: float = Field(0.0, description="Percentage share of this priority")

    model_config = ConfigDict(from_attributes=True)


class DepartmentDistributionItem(BaseModel):
    department_id: Optional[int] = Field(None, description="Department ID, or null for unassigned")
    department_name: str = Field(..., description="Department name")
    count: int = Field(0, description="Number of complaints in this department")
    percentage: float = Field(0.0, description="Percentage share of this department")

    model_config = ConfigDict(from_attributes=True)


class LocationDistributionItem(BaseModel):
    location_id: Optional[int] = Field(None, description="Location ID, or null for unassigned")
    location_name: str = Field(..., description="Location name")
    complaint_count: int = Field(0, description="Number of complaints at this location")
    percentage: float = Field(0.0, description="Percentage share of this location")

    model_config = ConfigDict(from_attributes=True)


class TrendDataPoint(BaseModel):
    period: str = Field(..., description="Period label (e.g. YYYY-MM-DD for daily, YYYY-Www for weekly, YYYY-MM for monthly)")
    count: int = Field(0, description="Number of complaints submitted in this period")

    model_config = ConfigDict(from_attributes=True)


class ResolutionAnalytics(BaseModel):
    average_resolution_hours: float = Field(0.0, description="Average time to resolution in hours")
    resolved_complaints: int = Field(0, description="Total count of complaints with valid resolution timestamps")
    fastest_resolution_hours: Optional[float] = Field(None, description="Fastest resolution duration in hours")
    slowest_resolution_hours: Optional[float] = Field(None, description="Slowest resolution duration in hours")

    model_config = ConfigDict(from_attributes=True)


class DepartmentPerformanceItem(BaseModel):
    department_id: int = Field(..., description="Department ID")
    department_name: str = Field(..., description="Department name")
    total_complaints: int = Field(0, description="Total complaints routed to this department")
    pending_complaints: int = Field(0, description="Pending complaints")
    assigned_complaints: int = Field(0, description="Assigned complaints")
    in_progress_complaints: int = Field(0, description="In Progress complaints")
    resolved_complaints: int = Field(0, description="Resolved complaints")
    closed_complaints: int = Field(0, description="Closed complaints")
    resolution_rate: float = Field(0.0, description="Resolution rate: ((resolved + closed) / total) * 100")
    average_resolution_hours: float = Field(0.0, description="Average resolution time in hours")

    model_config = ConfigDict(from_attributes=True)


class CategoryPerformanceItem(BaseModel):
    category: str = Field(..., description="Complaint category")
    total_complaints: int = Field(0, description="Total complaints in this category")
    resolved_complaints: int = Field(0, description="Resolved complaints")
    closed_complaints: int = Field(0, description="Closed complaints")
    open_complaints: int = Field(0, description="Active/open complaints (pending + assigned + in_progress)")
    resolution_rate: float = Field(0.0, description="Resolution rate: ((resolved + closed) / total) * 100")
    average_resolution_hours: float = Field(0.0, description="Average resolution time in hours")

    model_config = ConfigDict(from_attributes=True)


class SmartInsightItem(BaseModel):
    id: str = Field(..., description="Unique key for the insight")
    category: str = Field(..., description="Category group: overview, observation, workload, trend")
    title: str = Field(..., description="Concise insight title")
    description: str = Field(..., description="Deterministic factual insight text")
    type: str = Field("info", description="Severity or style hint: info, warning, success, neutral")
    metric: Optional[str] = Field(None, description="Key highlight metric if applicable")

    model_config = ConfigDict(from_attributes=True)


class CombinedAnalyticsSummary(BaseModel):
    overview: OverviewKPI = Field(..., description="Overview KPI metrics")
    status_distribution: List[StatusDistributionItem] = Field(default_factory=list, description="Distribution by status")
    category_distribution: List[CategoryDistributionItem] = Field(default_factory=list, description="Distribution by category")
    priority_distribution: List[PriorityDistributionItem] = Field(default_factory=list, description="Distribution by priority")
    department_distribution: List[DepartmentDistributionItem] = Field(default_factory=list, description="Distribution by department")
    location_distribution: List[LocationDistributionItem] = Field(default_factory=list, description="Distribution by location")
    trend: List[TrendDataPoint] = Field(default_factory=list, description="Complaints submission trend over time")
    resolution: ResolutionAnalytics = Field(..., description="Resolution time statistics")
    department_performance: List[DepartmentPerformanceItem] = Field(default_factory=list, description="Department-level resolution performance")
    category_performance: List[CategoryPerformanceItem] = Field(default_factory=list, description="Category-level resolution performance")
    insights: List[SmartInsightItem] = Field(default_factory=list, description="Deterministic smart campus insights")

    model_config = ConfigDict(from_attributes=True)
