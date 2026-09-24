"""
Smart Campus Analytics Service.

Provides efficient, database-level aggregation and calculation for:
- Campus overview KPIs (totals, resolution rate, closure rate)
- Status, Category, Priority, Department, and Location distributions
- Complaint submission trends over time (daily, weekly, monthly)
- Resolution time metrics (average, fastest, slowest)
- Department and Category performance metrics
- Fully filterable by date range, department, category, priority, status, and location
"""

from collections import defaultdict
from datetime import date, datetime, time
from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.complaint import Complaint
from app.models.department import Department
from app.models.location import Location
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

STANDARD_STATUSES = ["Pending", "Assigned", "In Progress", "Resolved", "Closed"]
STANDARD_PRIORITIES = ["High", "Medium", "Low"]
STANDARD_CATEGORIES = [
    "IT",
    "Electrical",
    "Maintenance",
    "Housekeeping",
    "Security",
    "Plumbing",
    "Furniture",
    "Other",
]


class AnalyticsService:
    @staticmethod
    def apply_filters(
        query,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        department_id: Optional[int] = None,
        category: Optional[str] = None,
        priority: Optional[str] = None,
        status: Optional[str] = None,
        location_id: Optional[int] = None,
    ):
        """
        Applies universal query filters to a Complaint query.
        Dates are inclusive:
        - start_date starts at 00:00:00 of that day
        - end_date covers the entire calendar day (up to 23:59:59.999999)
        """
        if start_date:
            start_dt = datetime.combine(start_date, time.min)
            query = query.filter(Complaint.created_at >= start_dt)
        if end_date:
            end_dt = datetime.combine(end_date, time.max)
            query = query.filter(Complaint.created_at <= end_dt)
        if department_id is not None:
            query = query.filter(Complaint.department_id == department_id)
        if category:
            query = query.filter(Complaint.category == category)
        if priority:
            query = query.filter(Complaint.priority == priority)
        if status:
            query = query.filter(Complaint.status == status)
        if location_id is not None:
            query = query.filter(Complaint.location_id == location_id)
        return query

    @classmethod
    def get_overview_kpis(
        cls,
        db: Session,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        department_id: Optional[int] = None,
        category: Optional[str] = None,
        priority: Optional[str] = None,
        status: Optional[str] = None,
        location_id: Optional[int] = None,
    ) -> OverviewKPI:
        """Computes high-level campus KPI metrics from aggregated database data."""
        # Query status counts
        status_query = cls.apply_filters(
            db.query(Complaint.status, func.count(Complaint.id)),
            start_date=start_date,
            end_date=end_date,
            department_id=department_id,
            category=category,
            priority=priority,
            status=status,
            location_id=location_id,
        ).group_by(Complaint.status)
        status_counts = dict(status_query.all())

        # Query priority counts
        priority_query = cls.apply_filters(
            db.query(Complaint.priority, func.count(Complaint.id)),
            start_date=start_date,
            end_date=end_date,
            department_id=department_id,
            category=category,
            priority=priority,
            status=status,
            location_id=location_id,
        ).group_by(Complaint.priority)
        priority_counts = dict(priority_query.all())

        total = sum(status_counts.values())
        pending = status_counts.get("Pending", 0)
        assigned = status_counts.get("Assigned", 0)
        in_progress = status_counts.get("In Progress", 0)
        resolved = status_counts.get("Resolved", 0)
        closed = status_counts.get("Closed", 0)

        high = priority_counts.get("High", 0)
        medium = priority_counts.get("Medium", 0)
        low = priority_counts.get("Low", 0)

        res_rate = round(((resolved + closed) / total) * 100, 2) if total > 0 else 0.0
        close_rate = round((closed / total) * 100, 2) if total > 0 else 0.0

        return OverviewKPI(
            total_complaints=total,
            pending_complaints=pending,
            assigned_complaints=assigned,
            in_progress_complaints=in_progress,
            resolved_complaints=resolved,
            closed_complaints=closed,
            high_priority_complaints=high,
            medium_priority_complaints=medium,
            low_priority_complaints=low,
            resolution_rate=res_rate,
            closure_rate=close_rate,
        )

    @classmethod
    def get_status_distribution(
        cls,
        db: Session,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        department_id: Optional[int] = None,
        category: Optional[str] = None,
        priority: Optional[str] = None,
        status: Optional[str] = None,
        location_id: Optional[int] = None,
    ) -> List[StatusDistributionItem]:
        """Calculates complaint distribution across lifecycle statuses."""
        query = cls.apply_filters(
            db.query(Complaint.status, func.count(Complaint.id)),
            start_date=start_date,
            end_date=end_date,
            department_id=department_id,
            category=category,
            priority=priority,
            status=status,
            location_id=location_id,
        ).group_by(Complaint.status)
        counts = dict(query.all())
        total = sum(counts.values())

        # Include standard statuses in consistent order
        keys_ordered = list(STANDARD_STATUSES)
        for s in counts.keys():
            if s not in keys_ordered:
                keys_ordered.append(s)

        items: List[StatusDistributionItem] = []
        for s in keys_ordered:
            c = counts.get(s, 0)
            pct = round((c / total) * 100, 2) if total > 0 else 0.0
            items.append(StatusDistributionItem(status=s, count=c, percentage=pct))

        return items

    @classmethod
    def get_category_distribution(
        cls,
        db: Session,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        department_id: Optional[int] = None,
        category: Optional[str] = None,
        priority: Optional[str] = None,
        status: Optional[str] = None,
        location_id: Optional[int] = None,
    ) -> List[CategoryDistributionItem]:
        """Calculates complaint counts and shares by category, sorted descending."""
        query = cls.apply_filters(
            db.query(Complaint.category, func.count(Complaint.id)),
            start_date=start_date,
            end_date=end_date,
            department_id=department_id,
            category=category,
            priority=priority,
            status=status,
            location_id=location_id,
        ).group_by(Complaint.category)
        counts = dict(query.all())
        total = sum(counts.values())

        all_cats = list(STANDARD_CATEGORIES)
        for c in counts.keys():
            if c not in all_cats:
                all_cats.append(c)

        items: List[CategoryDistributionItem] = []
        for cat in all_cats:
            c = counts.get(cat, 0)
            pct = round((c / total) * 100, 2) if total > 0 else 0.0
            items.append(CategoryDistributionItem(category=cat, count=c, percentage=pct))

        # Sort by count descending, then category name
        items.sort(key=lambda x: (-x.count, x.category))
        return items

    @classmethod
    def get_priority_distribution(
        cls,
        db: Session,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        department_id: Optional[int] = None,
        category: Optional[str] = None,
        priority: Optional[str] = None,
        status: Optional[str] = None,
        location_id: Optional[int] = None,
    ) -> List[PriorityDistributionItem]:
        """Calculates complaint counts and shares across priorities (High, Medium, Low)."""
        query = cls.apply_filters(
            db.query(Complaint.priority, func.count(Complaint.id)),
            start_date=start_date,
            end_date=end_date,
            department_id=department_id,
            category=category,
            priority=priority,
            status=status,
            location_id=location_id,
        ).group_by(Complaint.priority)
        counts = dict(query.all())
        total = sum(counts.values())

        items: List[PriorityDistributionItem] = []
        for p in STANDARD_PRIORITIES:
            c = counts.get(p, 0)
            pct = round((c / total) * 100, 2) if total > 0 else 0.0
            items.append(PriorityDistributionItem(priority=p, count=c, percentage=pct))

        for p, c in counts.items():
            if p not in STANDARD_PRIORITIES:
                pct = round((c / total) * 100, 2) if total > 0 else 0.0
                items.append(PriorityDistributionItem(priority=p, count=c, percentage=pct))

        return items

    @classmethod
    def get_department_distribution(
        cls,
        db: Session,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        department_id: Optional[int] = None,
        category: Optional[str] = None,
        priority: Optional[str] = None,
        status: Optional[str] = None,
        location_id: Optional[int] = None,
    ) -> List[DepartmentDistributionItem]:
        """Calculates distribution of complaints across campus departments."""
        dept_rows = db.query(Department).all()
        dept_name_map = {d.id: d.name for d in dept_rows}

        counts_query = cls.apply_filters(
            db.query(Complaint.department_id, func.count(Complaint.id)),
            start_date=start_date,
            end_date=end_date,
            department_id=department_id,
            category=category,
            priority=priority,
            status=status,
            location_id=location_id,
        ).group_by(Complaint.department_id)
        dept_counts = dict(counts_query.all())
        total = sum(dept_counts.values())

        items: List[DepartmentDistributionItem] = []
        target_depts = [d for d in dept_rows if department_id is None or d.id == department_id]
        for d in target_depts:
            c = dept_counts.get(d.id, 0)
            pct = round((c / total) * 100, 2) if total > 0 else 0.0
            items.append(DepartmentDistributionItem(department_id=d.id, department_name=d.name, count=c, percentage=pct))

        # Handle unassigned if present and no department filter was set
        if department_id is None and None in dept_counts and dept_counts[None] > 0:
            c = dept_counts[None]
            pct = round((c / total) * 100, 2) if total > 0 else 0.0
            items.append(DepartmentDistributionItem(department_id=None, department_name="Unassigned", count=c, percentage=pct))

        items.sort(key=lambda x: (-x.count, x.department_name))
        return items

    @classmethod
    def get_location_distribution(
        cls,
        db: Session,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        department_id: Optional[int] = None,
        category: Optional[str] = None,
        priority: Optional[str] = None,
        status: Optional[str] = None,
        location_id: Optional[int] = None,
    ) -> List[LocationDistributionItem]:
        """Calculates distribution of complaints by campus location."""
        loc_rows = db.query(Location).all()
        counts_query = cls.apply_filters(
            db.query(Complaint.location_id, func.count(Complaint.id)),
            start_date=start_date,
            end_date=end_date,
            department_id=department_id,
            category=category,
            priority=priority,
            status=status,
            location_id=location_id,
        ).group_by(Complaint.location_id)
        loc_counts = dict(counts_query.all())
        total = sum(loc_counts.values())

        items: List[LocationDistributionItem] = []
        target_locs = [l for l in loc_rows if location_id is None or l.id == location_id]
        for loc in target_locs:
            c = loc_counts.get(loc.id, 0)
            pct = round((c / total) * 100, 2) if total > 0 else 0.0
            items.append(LocationDistributionItem(location_id=loc.id, location_name=loc.name, complaint_count=c, percentage=pct))

        if location_id is None and None in loc_counts and loc_counts[None] > 0:
            c = loc_counts[None]
            pct = round((c / total) * 100, 2) if total > 0 else 0.0
            items.append(LocationDistributionItem(location_id=None, location_name="Unassigned", complaint_count=c, percentage=pct))

        items.sort(key=lambda x: (-x.complaint_count, x.location_name))
        return items

    @classmethod
    def get_trend(
        cls,
        db: Session,
        interval: str = "daily",
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        department_id: Optional[int] = None,
        category: Optional[str] = None,
        priority: Optional[str] = None,
        status: Optional[str] = None,
        location_id: Optional[int] = None,
    ) -> List[TrendDataPoint]:
        """
        Calculates complaint submission volume over time grouped by:
        - daily (YYYY-MM-DD)
        - weekly (YYYY-Www)
        - monthly (YYYY-MM)
        Based strictly on complaint.created_at.
        """
        dialect = db.bind.dialect.name if db.bind else "sqlite"
        if dialect == "sqlite":
            if interval == "monthly":
                period_expr = func.strftime("%Y-%m", Complaint.created_at)
            elif interval == "weekly":
                period_expr = func.strftime("%Y-W%W", Complaint.created_at)
            else:
                period_expr = func.strftime("%Y-%m-%d", Complaint.created_at)
        elif dialect == "postgresql":
            if interval == "monthly":
                period_expr = func.to_char(Complaint.created_at, "YYYY-MM")
            elif interval == "weekly":
                period_expr = func.to_char(Complaint.created_at, 'IYYY-"W"IW')
            else:
                period_expr = func.to_char(Complaint.created_at, "YYYY-MM-DD")
        else:
            fmt = "%Y-%m-%d" if interval == "daily" else ("%Y-W%W" if interval == "weekly" else "%Y-%m")
            period_expr = func.strftime(fmt, Complaint.created_at)

        query = cls.apply_filters(
            db.query(period_expr.label("period"), func.count(Complaint.id)),
            start_date=start_date,
            end_date=end_date,
            department_id=department_id,
            category=category,
            priority=priority,
            status=status,
            location_id=location_id,
        ).group_by("period").order_by("period")

        results = query.all()
        return [TrendDataPoint(period=str(r[0]), count=int(r[1])) for r in results if r[0] is not None]

    @classmethod
    def get_resolution_analytics(
        cls,
        db: Session,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        department_id: Optional[int] = None,
        category: Optional[str] = None,
        priority: Optional[str] = None,
        status: Optional[str] = None,
        location_id: Optional[int] = None,
    ) -> ResolutionAnalytics:
        """
        Calculates resolution duration metrics (average, fastest, slowest) in hours
        using actual complaint timestamps (resolved_at - created_at).
        Safely ignores missing or negative durations.
        """
        query = cls.apply_filters(
            db.query(Complaint.created_at, Complaint.resolved_at),
            start_date=start_date,
            end_date=end_date,
            department_id=department_id,
            category=category,
            priority=priority,
            status=status,
            location_id=location_id,
        ).filter(Complaint.resolved_at.isnot(None), Complaint.created_at.isnot(None))

        rows = query.all()
        durations: List[float] = []
        for c_time, r_time in rows:
            if c_time and r_time:
                diff_sec = (r_time - c_time).total_seconds()
                if diff_sec >= 0:
                    durations.append(diff_sec / 3600.0)

        if not durations:
            return ResolutionAnalytics(
                average_resolution_hours=0.0,
                resolved_complaints=0,
                fastest_resolution_hours=None,
                slowest_resolution_hours=None,
            )

        avg_hours = round(sum(durations) / len(durations), 2)
        fastest = round(min(durations), 2)
        slowest = round(max(durations), 2)

        return ResolutionAnalytics(
            average_resolution_hours=avg_hours,
            resolved_complaints=len(durations),
            fastest_resolution_hours=fastest,
            slowest_resolution_hours=slowest,
        )

    @classmethod
    def get_department_performance(
        cls,
        db: Session,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        department_id: Optional[int] = None,
        category: Optional[str] = None,
        priority: Optional[str] = None,
        status: Optional[str] = None,
        location_id: Optional[int] = None,
    ) -> List[DepartmentPerformanceItem]:
        """
        Calculates per-department performance:
        - total, pending, assigned, in_progress, resolved, closed counts
        - resolution rate
        - average resolution hours
        """
        dept_rows = db.query(Department).all()
        target_depts = [d for d in dept_rows if department_id is None or d.id == department_id]

        status_query = cls.apply_filters(
            db.query(Complaint.department_id, Complaint.status, func.count(Complaint.id)),
            start_date=start_date,
            end_date=end_date,
            department_id=department_id,
            category=category,
            priority=priority,
            status=status,
            location_id=location_id,
        ).group_by(Complaint.department_id, Complaint.status)
        dept_status_map: Dict[int, Dict[str, int]] = defaultdict(lambda: defaultdict(int))
        for d_id, stat, count in status_query.all():
            if d_id is not None:
                dept_status_map[d_id][stat] = count

        res_query = cls.apply_filters(
            db.query(Complaint.department_id, Complaint.created_at, Complaint.resolved_at),
            start_date=start_date,
            end_date=end_date,
            department_id=department_id,
            category=category,
            priority=priority,
            status=status,
            location_id=location_id,
        ).filter(Complaint.resolved_at.isnot(None), Complaint.created_at.isnot(None))

        dept_durations: Dict[int, List[float]] = defaultdict(list)
        for d_id, c_time, r_time in res_query.all():
            if d_id is not None and c_time and r_time:
                diff_sec = (r_time - c_time).total_seconds()
                if diff_sec >= 0:
                    dept_durations[d_id].append(diff_sec / 3600.0)

        items: List[DepartmentPerformanceItem] = []
        for dept in target_depts:
            s_map = dept_status_map[dept.id]
            total = sum(s_map.values())
            pending = s_map.get("Pending", 0)
            assigned = s_map.get("Assigned", 0)
            in_prog = s_map.get("In Progress", 0)
            resolved = s_map.get("Resolved", 0)
            closed = s_map.get("Closed", 0)
            res_rate = round(((resolved + closed) / total) * 100, 2) if total > 0 else 0.0

            durs = dept_durations.get(dept.id, [])
            avg_hours = round(sum(durs) / len(durs), 2) if durs else 0.0

            items.append(
                DepartmentPerformanceItem(
                    department_id=dept.id,
                    department_name=dept.name,
                    total_complaints=total,
                    pending_complaints=pending,
                    assigned_complaints=assigned,
                    in_progress_complaints=in_prog,
                    resolved_complaints=resolved,
                    closed_complaints=closed,
                    resolution_rate=res_rate,
                    average_resolution_hours=avg_hours,
                )
            )

        items.sort(key=lambda x: (-x.total_complaints, x.department_name))
        return items

    @classmethod
    def get_category_performance(
        cls,
        db: Session,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        department_id: Optional[int] = None,
        category: Optional[str] = None,
        priority: Optional[str] = None,
        status: Optional[str] = None,
        location_id: Optional[int] = None,
    ) -> List[CategoryPerformanceItem]:
        """
        Calculates per-category resolution performance:
        - total, resolved, closed, open complaints
        - resolution rate
        - average resolution hours
        """
        status_query = cls.apply_filters(
            db.query(Complaint.category, Complaint.status, func.count(Complaint.id)),
            start_date=start_date,
            end_date=end_date,
            department_id=department_id,
            category=category,
            priority=priority,
            status=status,
            location_id=location_id,
        ).group_by(Complaint.category, Complaint.status)
        cat_status_map: Dict[str, Dict[str, int]] = defaultdict(lambda: defaultdict(int))
        for cat_name, stat, count in status_query.all():
            cat_status_map[cat_name][stat] = count

        res_query = cls.apply_filters(
            db.query(Complaint.category, Complaint.created_at, Complaint.resolved_at),
            start_date=start_date,
            end_date=end_date,
            department_id=department_id,
            category=category,
            priority=priority,
            status=status,
            location_id=location_id,
        ).filter(Complaint.resolved_at.isnot(None), Complaint.created_at.isnot(None))

        cat_durations: Dict[str, List[float]] = defaultdict(list)
        for cat_name, c_time, r_time in res_query.all():
            if c_time and r_time:
                diff_sec = (r_time - c_time).total_seconds()
                if diff_sec >= 0:
                    cat_durations[cat_name].append(diff_sec / 3600.0)

        all_cats = list(STANDARD_CATEGORIES)
        if category:
            all_cats = [category]
        else:
            for c in cat_status_map.keys():
                if c not in all_cats:
                    all_cats.append(c)

        items: List[CategoryPerformanceItem] = []
        for cat_name in all_cats:
            s_map = cat_status_map[cat_name]
            total = sum(s_map.values())
            resolved = s_map.get("Resolved", 0)
            closed = s_map.get("Closed", 0)
            open_count = total - resolved - closed
            res_rate = round(((resolved + closed) / total) * 100, 2) if total > 0 else 0.0

            durs = cat_durations.get(cat_name, [])
            avg_hours = round(sum(durs) / len(durs), 2) if durs else 0.0

            items.append(
                CategoryPerformanceItem(
                    category=cat_name,
                    total_complaints=total,
                    resolved_complaints=resolved,
                    closed_complaints=closed,
                    open_complaints=open_count,
                    resolution_rate=res_rate,
                    average_resolution_hours=avg_hours,
                )
            )

        items.sort(key=lambda x: (-x.total_complaints, x.category))
        return items

    @classmethod
    def get_combined_analytics(
        cls,
        db: Session,
        interval: str = "daily",
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        department_id: Optional[int] = None,
        category: Optional[str] = None,
        priority: Optional[str] = None,
        status: Optional[str] = None,
        location_id: Optional[int] = None,
    ) -> CombinedAnalyticsSummary:
        """
        Combines all key analytics sections into one unified response for the Admin Analytics dashboard.
        """
        overview = cls.get_overview_kpis(
            db,
            start_date=start_date,
            end_date=end_date,
            department_id=department_id,
            category=category,
            priority=priority,
            status=status,
            location_id=location_id,
        )
        status_dist = cls.get_status_distribution(
            db,
            start_date=start_date,
            end_date=end_date,
            department_id=department_id,
            category=category,
            priority=priority,
            status=status,
            location_id=location_id,
        )
        category_dist = cls.get_category_distribution(
            db,
            start_date=start_date,
            end_date=end_date,
            department_id=department_id,
            category=category,
            priority=priority,
            status=status,
            location_id=location_id,
        )
        priority_dist = cls.get_priority_distribution(
            db,
            start_date=start_date,
            end_date=end_date,
            department_id=department_id,
            category=category,
            priority=priority,
            status=status,
            location_id=location_id,
        )
        department_dist = cls.get_department_distribution(
            db,
            start_date=start_date,
            end_date=end_date,
            department_id=department_id,
            category=category,
            priority=priority,
            status=status,
            location_id=location_id,
        )
        location_dist = cls.get_location_distribution(
            db,
            start_date=start_date,
            end_date=end_date,
            department_id=department_id,
            category=category,
            priority=priority,
            status=status,
            location_id=location_id,
        )
        trend = cls.get_trend(
            db,
            interval=interval,
            start_date=start_date,
            end_date=end_date,
            department_id=department_id,
            category=category,
            priority=priority,
            status=status,
            location_id=location_id,
        )
        resolution = cls.get_resolution_analytics(
            db,
            start_date=start_date,
            end_date=end_date,
            department_id=department_id,
            category=category,
            priority=priority,
            status=status,
            location_id=location_id,
        )
        dept_perf = cls.get_department_performance(
            db,
            start_date=start_date,
            end_date=end_date,
            department_id=department_id,
            category=category,
            priority=priority,
            status=status,
            location_id=location_id,
        )
        cat_perf = cls.get_category_performance(
            db,
            start_date=start_date,
            end_date=end_date,
            department_id=department_id,
            category=category,
            priority=priority,
            status=status,
            location_id=location_id,
        )

        return CombinedAnalyticsSummary(
            overview=overview,
            status_distribution=status_dist,
            category_distribution=category_dist,
            priority_distribution=priority_dist,
            department_distribution=department_dist,
            location_distribution=location_dist,
            trend=trend,
            resolution=resolution,
            department_performance=dept_perf,
            category_performance=cat_perf,
        )


analytics_service = AnalyticsService()
