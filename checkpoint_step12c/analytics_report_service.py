"""
Smart Campus Analytics Report & Insights Service.

Provides:
1. Deterministic, factual Smart Campus Insights from aggregated analytics.
2. Structured RFC 4180 CSV report generation with comprehensive sections.
3. Administrative PDF report generation using ReportLab with clean styling and pagination.
"""

import csv
import io
from datetime import datetime, timezone
from typing import Dict, List, Optional

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    HRFlowable,
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from app.schemas.analytics import (
    CombinedAnalyticsSummary,
    SmartInsightItem,
)


class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas to dynamically compute and draw total page count
    along with running header and footer on every page.
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count: int):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))

        # Running header on subsequent pages (page 2+)
        if self._pageNumber > 1:
            self.drawString(
                54,
                755,
                "Smart Campus Complaint & Issue Management System — Analytics Report",
            )
            self.setStrokeColor(colors.HexColor("#E2E8F0"))
            self.setLineWidth(0.75)
            self.line(54, 747, 558, 747)

        # Running footer on all pages
        self.setStrokeColor(colors.HexColor("#E2E8F0"))
        self.setLineWidth(0.75)
        self.line(54, 45, 558, 45)

        self.drawString(54, 32, "Confidential — For Internal Campus Administration Only")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 32, page_str)

        self.restoreState()


class AnalyticsReportService:
    @classmethod
    def generate_smart_insights(
        cls,
        summary: CombinedAnalyticsSummary,
    ) -> List[SmartInsightItem]:
        """
        Calculates deterministic, 100% factual observations from database analytics.
        Strictly observes actual data, avoids predictions or API keys.
        Returns empty fallback messages when data is insufficient.
        """
        insights: List[SmartInsightItem] = []
        ov = summary.overview
        total = ov.total_complaints
        open_count = ov.pending_complaints + ov.assigned_complaints + ov.in_progress_complaints

        # -----------------------------------------------------------------
        # 1. CAMPUS OVERVIEW INSIGHTS
        # -----------------------------------------------------------------
        # 1.1 Total Complaints
        if total > 0:
            insights.append(
                SmartInsightItem(
                    id="overview_total",
                    category="overview",
                    title="Total Complaints",
                    description=f"{total} complaint{'s' if total != 1 else ''} recorded matching the active filters.",
                    type="info",
                    metric=str(total),
                )
            )
        else:
            insights.append(
                SmartInsightItem(
                    id="overview_total",
                    category="overview",
                    title="Total Complaints",
                    description="No complaints found matching the selected filter criteria.",
                    type="neutral",
                    metric="0",
                )
            )

        # 1.2 Open Workload
        if total > 0:
            open_pct = (open_count / total * 100.0) if total > 0 else 0.0
            desc = (
                f"{open_count} complaint{'s' if open_count != 1 else ''} ({open_pct:.1f}% of total) "
                f"currently pending, assigned, or in progress."
            )
            insights.append(
                SmartInsightItem(
                    id="overview_open",
                    category="overview",
                    title="Open Complaints",
                    description=desc,
                    type="warning" if open_count > 0 else "success",
                    metric=str(open_count),
                )
            )
        else:
            insights.append(
                SmartInsightItem(
                    id="overview_open",
                    category="overview",
                    title="Open Complaints",
                    description="No sufficient data for this insight.",
                    type="neutral",
                    metric="0",
                )
            )

        # 1.3 High Priority
        if total > 0:
            high_count = ov.high_priority_complaints
            high_pct = (high_count / total * 100.0) if total > 0 else 0.0
            if high_count > 0:
                desc = f"{high_count} complaint{'s' if high_count != 1 else ''} ({high_pct:.1f}% of total) marked as High priority requiring urgent attention."
                itype = "warning"
            else:
                desc = "No high-priority complaints in the selected scope."
                itype = "success"
            insights.append(
                SmartInsightItem(
                    id="overview_high_priority",
                    category="overview",
                    title="High Priority",
                    description=desc,
                    type=itype,
                    metric=str(high_count),
                )
            )
        else:
            insights.append(
                SmartInsightItem(
                    id="overview_high_priority",
                    category="overview",
                    title="High Priority",
                    description="No sufficient data for this insight.",
                    type="neutral",
                    metric="0",
                )
            )

        # 1.4 Resolution Rate
        if total > 0:
            res_rate = ov.resolution_rate
            closed_rate = ov.closure_rate
            completed = ov.resolved_complaints + ov.closed_complaints
            desc = (
                f"Resolution rate is {res_rate:.1f}% ({completed} resolved or closed). "
                f"Closure rate is {closed_rate:.1f}%."
            )
            itype = "success" if res_rate >= 75.0 else ("warning" if res_rate < 50.0 else "info")
            insights.append(
                SmartInsightItem(
                    id="overview_resolution_rate",
                    category="overview",
                    title="Resolution Rate",
                    description=desc,
                    type=itype,
                    metric=f"{res_rate:.1f}%",
                )
            )
        else:
            insights.append(
                SmartInsightItem(
                    id="overview_resolution_rate",
                    category="overview",
                    title="Resolution Rate",
                    description="No sufficient data for this insight.",
                    type="neutral",
                    metric="N/A",
                )
            )

        # -----------------------------------------------------------------
        # 2. KEY OBSERVATIONS
        # -----------------------------------------------------------------
        # 2.1 Top Complaint Category
        active_cats = [c for c in summary.category_distribution if c.count > 0]
        if active_cats:
            top_cat = max(active_cats, key=lambda c: c.count)
            desc = (
                f"'{top_cat.category}' is the highest complaint category with {top_cat.count} "
                f"complaint{'s' if top_cat.count != 1 else ''} ({top_cat.percentage:.1f}% share)."
            )
            insights.append(
                SmartInsightItem(
                    id="top_category",
                    category="observation",
                    title="Top Complaint Category",
                    description=desc,
                    type="info",
                    metric=top_cat.category,
                )
            )
        else:
            insights.append(
                SmartInsightItem(
                    id="top_category",
                    category="observation",
                    title="Top Complaint Category",
                    description="No sufficient data for this insight.",
                    type="neutral",
                    metric="No data available",
                )
            )

        # 2.2 Most Affected Department
        active_depts = [d for d in summary.department_distribution if d.count > 0]
        if active_depts:
            top_dept = max(active_depts, key=lambda d: d.count)
            desc = (
                f"'{top_dept.department_name}' has the highest complaint volume with {top_dept.count} "
                f"complaint{'s' if top_dept.count != 1 else ''} ({top_dept.percentage:.1f}% share)."
            )
            insights.append(
                SmartInsightItem(
                    id="top_department",
                    category="observation",
                    title="Most Affected Department",
                    description=desc,
                    type="info",
                    metric=top_dept.department_name,
                )
            )
        else:
            insights.append(
                SmartInsightItem(
                    id="top_department",
                    category="observation",
                    title="Most Affected Department",
                    description="No sufficient data for this insight.",
                    type="neutral",
                    metric="No data available",
                )
            )

        # 2.3 Most Affected Location
        active_locs = [l for l in summary.location_distribution if l.complaint_count > 0]
        if active_locs:
            top_loc = max(active_locs, key=lambda l: l.complaint_count)
            desc = (
                f"'{top_loc.location_name}' accounts for the most complaints with {top_loc.complaint_count} "
                f"complaint{'s' if top_loc.complaint_count != 1 else ''} ({top_loc.percentage:.1f}% share)."
            )
            insights.append(
                SmartInsightItem(
                    id="top_location",
                    category="observation",
                    title="Most Affected Location",
                    description=desc,
                    type="info",
                    metric=top_loc.location_name,
                )
            )
        else:
            insights.append(
                SmartInsightItem(
                    id="top_location",
                    category="observation",
                    title="Most Affected Location",
                    description="No sufficient data for this insight.",
                    type="neutral",
                    metric="No data available",
                )
            )

        # 2.4 Average Resolution Time
        res = summary.resolution
        if res.resolved_complaints > 0:
            extra = []
            if res.fastest_resolution_hours is not None:
                extra.append(f"Fastest: {res.fastest_resolution_hours:.1f}h")
            if res.slowest_resolution_hours is not None:
                extra.append(f"Slowest: {res.slowest_resolution_hours:.1f}h")
            extra_str = f" ({', '.join(extra)})" if extra else ""
            desc = (
                f"Average resolution time is {res.average_resolution_hours:.1f} hours "
                f"across {res.resolved_complaints} resolved complaint{'s' if res.resolved_complaints != 1 else ''}{extra_str}."
            )
            insights.append(
                SmartInsightItem(
                    id="avg_resolution_time",
                    category="observation",
                    title="Average Resolution Time",
                    description=desc,
                    type="info",
                    metric=f"{res.average_resolution_hours:.1f}h",
                )
            )
        else:
            insights.append(
                SmartInsightItem(
                    id="avg_resolution_time",
                    category="observation",
                    title="Average Resolution Time",
                    description="No sufficient data for this insight.",
                    type="neutral",
                    metric="N/A",
                )
            )

        # -----------------------------------------------------------------
        # 3. WORKLOAD OBSERVATION
        # -----------------------------------------------------------------
        # Category with highest open workload
        cats_with_open = [c for c in summary.category_performance if c.open_complaints > 0]
        depts_with_open = [
            d
            for d in summary.department_performance
            if (d.pending_complaints + d.assigned_complaints + d.in_progress_complaints) > 0
        ]

        if cats_with_open or depts_with_open:
            top_cat_open = max(cats_with_open, key=lambda c: c.open_complaints) if cats_with_open else None
            top_dept_open = (
                max(
                    depts_with_open,
                    key=lambda d: (d.pending_complaints + d.assigned_complaints + d.in_progress_complaints),
                )
                if depts_with_open
                else None
            )

            parts = []
            highlight_metric = ""
            if top_cat_open:
                parts.append(
                    f"Category '{top_cat_open.category}' has the highest category backlog with {top_cat_open.open_complaints} open issue{'s' if top_cat_open.open_complaints != 1 else ''}"
                )
                highlight_metric = f"{top_cat_open.category} ({top_cat_open.open_complaints} open)"
            if top_dept_open:
                d_open = (
                    top_dept_open.pending_complaints
                    + top_dept_open.assigned_complaints
                    + top_dept_open.in_progress_complaints
                )
                parts.append(
                    f"Department '{top_dept_open.department_name}' has {d_open} active complaint{'s' if d_open != 1 else ''} pending or in progress"
                )
                if not highlight_metric:
                    highlight_metric = f"{top_dept_open.department_name} ({d_open} open)"

            desc = ". ".join(parts) + "."
            insights.append(
                SmartInsightItem(
                    id="workload_highest_open",
                    category="workload",
                    title="Highest Unresolved Workload",
                    description=desc,
                    type="warning",
                    metric=highlight_metric,
                )
            )
        elif total > 0:
            insights.append(
                SmartInsightItem(
                    id="workload_highest_open",
                    category="workload",
                    title="Highest Unresolved Workload",
                    description="All complaints in the selected dataset are resolved or closed. Zero open backlog.",
                    type="success",
                    metric="0 open",
                )
            )
        else:
            insights.append(
                SmartInsightItem(
                    id="workload_highest_open",
                    category="workload",
                    title="Highest Unresolved Workload",
                    description="No sufficient data for this insight.",
                    type="neutral",
                    metric="No data available",
                )
            )

        # -----------------------------------------------------------------
        # 4. TREND OBSERVATION
        # -----------------------------------------------------------------
        trend_pts = [p for p in summary.trend if p.count > 0]
        if trend_pts:
            peak = max(trend_pts, key=lambda p: p.count)
            desc = f"Submission volume peaked during period {peak.period} with {peak.count} complaint{'s' if peak.count != 1 else ''}."
            insights.append(
                SmartInsightItem(
                    id="trend_peak",
                    category="trend",
                    title="Complaint Volume Peak",
                    description=desc,
                    type="info",
                    metric=f"{peak.count} ({peak.period})",
                )
            )
        else:
            insights.append(
                SmartInsightItem(
                    id="trend_peak",
                    category="trend",
                    title="Complaint Volume Peak",
                    description="No sufficient data for this insight.",
                    type="neutral",
                    metric="No data available",
                )
            )

        return insights

    @classmethod
    def generate_csv_report(
        cls,
        summary: CombinedAnalyticsSummary,
        filters: Dict[str, Optional[str]],
    ) -> str:
        """
        Builds a structured RFC 4180 CSV export with 10 explicit sections.
        """
        output = io.StringIO()
        writer = csv.writer(output, lineterminator="\r\n")

        now_utc = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

        # -----------------------------------------------------------------
        # SECTION 1: REPORT INFORMATION & APPLIED FILTERS
        # -----------------------------------------------------------------
        writer.writerow(["# SMART CAMPUS COMPLAINT & ISSUE MANAGEMENT SYSTEM - ANALYTICS REPORT"])
        writer.writerow(["Generated At", now_utc])
        writer.writerow(["Report Scope", "Campus Administrative Analytics Export"])
        writer.writerow([])
        writer.writerow(["# APPLIED FILTERS"])
        writer.writerow(["Filter Name", "Selected Value"])
        writer.writerow(["Start Date", filters.get("start_date") or "All Dates"])
        writer.writerow(["End Date", filters.get("end_date") or "All Dates"])
        writer.writerow(["Department ID", filters.get("department_id") or "All Departments"])
        writer.writerow(["Category", filters.get("category") or "All Categories"])
        writer.writerow(["Priority", filters.get("priority") or "All Priorities"])
        writer.writerow(["Status", filters.get("status") or "All Statuses"])
        writer.writerow(["Location ID", filters.get("location_id") or "All Locations"])
        writer.writerow(["Trend Interval", filters.get("interval") or "daily"])
        writer.writerow([])

        # -----------------------------------------------------------------
        # SECTION 2: EXECUTIVE SUMMARY / OVERVIEW KPIS
        # -----------------------------------------------------------------
        ov = summary.overview
        writer.writerow(["# 1. OVERVIEW KPIS"])
        writer.writerow(["Metric", "Value"])
        writer.writerow(["Total Complaints", ov.total_complaints])
        writer.writerow(["Pending Complaints", ov.pending_complaints])
        writer.writerow(["Assigned Complaints", ov.assigned_complaints])
        writer.writerow(["In Progress Complaints", ov.in_progress_complaints])
        writer.writerow(["Resolved Complaints", ov.resolved_complaints])
        writer.writerow(["Closed Complaints", ov.closed_complaints])
        writer.writerow(["High Priority Complaints", ov.high_priority_complaints])
        writer.writerow(["Medium Priority Complaints", ov.medium_priority_complaints])
        writer.writerow(["Low Priority Complaints", ov.low_priority_complaints])
        writer.writerow(["Resolution Rate (%)", f"{ov.resolution_rate:.2f}%"])
        writer.writerow(["Closure Rate (%)", f"{ov.closure_rate:.2f}%"])
        writer.writerow([])

        # -----------------------------------------------------------------
        # SECTION 3: SMART CAMPUS INSIGHTS
        # -----------------------------------------------------------------
        writer.writerow(["# 2. SMART CAMPUS INSIGHTS"])
        writer.writerow(["Category", "Title", "Metric", "Factual Observation"])
        insights = summary.insights or cls.generate_smart_insights(summary)
        for ins in insights:
            writer.writerow([ins.category, ins.title, ins.metric or "N/A", ins.description])
        writer.writerow([])

        # -----------------------------------------------------------------
        # SECTION 4: STATUS DISTRIBUTION
        # -----------------------------------------------------------------
        writer.writerow(["# 3. STATUS DISTRIBUTION"])
        writer.writerow(["Status", "Count", "Percentage (%)"])
        if summary.status_distribution:
            for s in summary.status_distribution:
                writer.writerow([s.status, s.count, f"{s.percentage:.2f}%"])
        else:
            writer.writerow(["No data available", 0, "0.00%"])
        writer.writerow([])

        # -----------------------------------------------------------------
        # SECTION 5: CATEGORY DISTRIBUTION
        # -----------------------------------------------------------------
        writer.writerow(["# 4. CATEGORY DISTRIBUTION"])
        writer.writerow(["Category", "Count", "Percentage (%)"])
        if summary.category_distribution:
            for c in summary.category_distribution:
                writer.writerow([c.category, c.count, f"{c.percentage:.2f}%"])
        else:
            writer.writerow(["No data available", 0, "0.00%"])
        writer.writerow([])

        # -----------------------------------------------------------------
        # SECTION 6: PRIORITY DISTRIBUTION
        # -----------------------------------------------------------------
        writer.writerow(["# 5. PRIORITY DISTRIBUTION"])
        writer.writerow(["Priority", "Count", "Percentage (%)"])
        if summary.priority_distribution:
            for p in summary.priority_distribution:
                writer.writerow([p.priority, p.count, f"{p.percentage:.2f}%"])
        else:
            writer.writerow(["No data available", 0, "0.00%"])
        writer.writerow([])

        # -----------------------------------------------------------------
        # SECTION 7: DEPARTMENT PERFORMANCE
        # -----------------------------------------------------------------
        writer.writerow(["# 6. DEPARTMENT PERFORMANCE"])
        writer.writerow([
            "Department ID",
            "Department Name",
            "Total",
            "Pending",
            "Assigned",
            "In Progress",
            "Resolved",
            "Closed",
            "Resolution Rate (%)",
            "Avg Resolution Time (Hours)",
        ])
        if summary.department_performance:
            for d in summary.department_performance:
                writer.writerow([
                    d.department_id,
                    d.department_name,
                    d.total_complaints,
                    d.pending_complaints,
                    d.assigned_complaints,
                    d.in_progress_complaints,
                    d.resolved_complaints,
                    d.closed_complaints,
                    f"{d.resolution_rate:.2f}%",
                    f"{d.average_resolution_hours:.2f}",
                ])
        else:
            writer.writerow(["N/A", "No data available", 0, 0, 0, 0, 0, 0, "0.00%", "0.00"])
        writer.writerow([])

        # -----------------------------------------------------------------
        # SECTION 8: CATEGORY PERFORMANCE
        # -----------------------------------------------------------------
        writer.writerow(["# 7. CATEGORY PERFORMANCE"])
        writer.writerow([
            "Category",
            "Total Complaints",
            "Resolved",
            "Closed",
            "Open Workload",
            "Resolution Rate (%)",
            "Avg Resolution Time (Hours)",
        ])
        if summary.category_performance:
            for cp in summary.category_performance:
                writer.writerow([
                    cp.category,
                    cp.total_complaints,
                    cp.resolved_complaints,
                    cp.closed_complaints,
                    cp.open_complaints,
                    f"{cp.resolution_rate:.2f}%",
                    f"{cp.average_resolution_hours:.2f}",
                ])
        else:
            writer.writerow(["No data available", 0, 0, 0, 0, "0.00%", "0.00"])
        writer.writerow([])

        # -----------------------------------------------------------------
        # SECTION 9: LOCATION DISTRIBUTION
        # -----------------------------------------------------------------
        writer.writerow(["# 8. LOCATION DISTRIBUTION"])
        writer.writerow(["Location ID", "Location Name", "Complaint Count", "Percentage (%)"])
        if summary.location_distribution:
            for loc in summary.location_distribution:
                writer.writerow([
                    loc.location_id if loc.location_id is not None else "N/A",
                    loc.location_name,
                    loc.complaint_count,
                    f"{loc.percentage:.2f}%",
                ])
        else:
            writer.writerow(["N/A", "No data available", 0, "0.00%"])
        writer.writerow([])

        # -----------------------------------------------------------------
        # SECTION 10: RESOLUTION PERFORMANCE
        # -----------------------------------------------------------------
        res = summary.resolution
        writer.writerow(["# 9. RESOLUTION PERFORMANCE"])
        writer.writerow(["Metric", "Value"])
        writer.writerow(["Resolved Complaints Count", res.resolved_complaints])
        writer.writerow(["Average Resolution Time (Hours)", f"{res.average_resolution_hours:.2f}"])
        writer.writerow([
            "Fastest Resolution Time (Hours)",
            f"{res.fastest_resolution_hours:.2f}" if res.fastest_resolution_hours is not None else "N/A",
        ])
        writer.writerow([
            "Slowest Resolution Time (Hours)",
            f"{res.slowest_resolution_hours:.2f}" if res.slowest_resolution_hours is not None else "N/A",
        ])
        writer.writerow([])

        # -----------------------------------------------------------------
        # SECTION 11: SUBMISSION TREND
        # -----------------------------------------------------------------
        interval_label = filters.get("interval") or "daily"
        writer.writerow([f"# 10. SUBMISSION TREND ({interval_label.upper()})"])
        writer.writerow(["Period", "Complaint Count"])
        if summary.trend:
            for t in summary.trend:
                writer.writerow([t.period, t.count])
        else:
            writer.writerow(["No data available", 0])

        return output.getvalue()

    @classmethod
    def generate_pdf_report(
        cls,
        summary: CombinedAnalyticsSummary,
        filters: Dict[str, Optional[str]],
    ) -> bytes:
        """
        Builds a comprehensive, professional administrative PDF report.
        Respects filters, includes executive summary, smart insights,
        distribution tables, performance tables, and printable pagination.
        """
        buffer = io.BytesIO()

        # Document setup: 0.5-inch margins (36 pt) for clean printable space
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            leftMargin=36,
            rightMargin=36,
            topMargin=36,
            bottomMargin=50,
        )

        styles = getSampleStyleSheet()

        # Custom typography styles
        title_style = ParagraphStyle(
            "DocTitle",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=16,
            leading=20,
            textColor=colors.HexColor("#0F172A"),
        )
        subtitle_style = ParagraphStyle(
            "DocSubtitle",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=10,
            leading=14,
            textColor=colors.HexColor("#475569"),
        )
        section_heading = ParagraphStyle(
            "SectionHeading",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=11,
            leading=15,
            textColor=colors.HexColor("#1E3A8A"),
            spaceBefore=10,
            spaceAfter=5,
        )
        body_style = ParagraphStyle(
            "TableBody",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=8,
            leading=11,
            textColor=colors.HexColor("#334155"),
        )
        body_bold = ParagraphStyle(
            "TableBodyBold",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=11,
            textColor=colors.HexColor("#0F172A"),
        )
        body_center = ParagraphStyle(
            "TableBodyCenter",
            parent=body_style,
            alignment=1,
        )
        th_style = ParagraphStyle(
            "TableHeader",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=10,
            textColor=colors.white,
            alignment=0,
        )
        th_center = ParagraphStyle(
            "TableHeaderCenter",
            parent=th_style,
            alignment=1,
        )
        insight_title = ParagraphStyle(
            "InsightTitle",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8.5,
            leading=11,
            textColor=colors.HexColor("#1E293B"),
        )
        insight_desc = ParagraphStyle(
            "InsightDesc",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=8,
            leading=10.5,
            textColor=colors.HexColor("#475569"),
        )
        kpi_num_style = ParagraphStyle(
            "KpiNum",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=13,
            leading=15,
            alignment=1,
            textColor=colors.HexColor("#1E3A8A"),
        )
        kpi_label_style = ParagraphStyle(
            "KpiLabel",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=7.5,
            leading=9,
            alignment=1,
            textColor=colors.HexColor("#64748B"),
        )

        story = []

        now_str = datetime.now(timezone.utc).strftime("%B %d, %Y at %H:%M UTC")

        # =====================================================================
        # HEADER BLOCK
        # =====================================================================
        header_table_data = [
            [
                Paragraph("Smart Campus Complaint &amp; Issue Management System", title_style),
                Paragraph(f"<b>Generated:</b> {now_str}<br/><b>Scope:</b> Admin Analytics", subtitle_style),
            ],
            [
                Paragraph("Administrative Analytics &amp; Operational Performance Report", subtitle_style),
                "",
            ],
        ]
        header_table = Table(header_table_data, colWidths=[360, 180])
        header_table.setStyle(
            TableStyle([
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("ALIGN", (1, 0), (1, -1), "RIGHT"),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
            ])
        )
        story.append(header_table)
        story.append(Spacer(1, 4))
        story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#2563EB"), spaceAfter=8))

        # =====================================================================
        # APPLIED FILTERS BLOCK
        # =====================================================================
        f_start = filters.get("start_date") or "All Dates"
        f_end = filters.get("end_date") or "All Dates"
        f_date_range = f"{f_start} to {f_end}" if (f_start != "All Dates" or f_end != "All Dates") else "All Time"
        f_dept = filters.get("department_id") or "All Departments"
        f_cat = filters.get("category") or "All Categories"
        f_pri = filters.get("priority") or "All Priorities"
        f_stat = filters.get("status") or "All Statuses"
        f_loc = filters.get("location_id") or "All Locations"
        f_int = filters.get("interval") or "daily"

        filter_cells = [
            [
                Paragraph(f"<b>Date Range:</b> {f_date_range}", body_style),
                Paragraph(f"<b>Department:</b> {f_dept}", body_style),
                Paragraph(f"<b>Category:</b> {f_cat}", body_style),
            ],
            [
                Paragraph(f"<b>Priority:</b> {f_pri}", body_style),
                Paragraph(f"<b>Status:</b> {f_stat}", body_style),
                Paragraph(f"<b>Location:</b> {f_loc} | <b>Interval:</b> {f_int}", body_style),
            ],
        ]
        filter_table = Table(filter_cells, colWidths=[180, 180, 180])
        filter_table.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
                ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#E2E8F0")),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#F1F5F9")),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ])
        )
        story.append(filter_table)
        story.append(Spacer(1, 8))

        # =====================================================================
        # EXECUTIVE SUMMARY / OVERVIEW KPIS
        # =====================================================================
        ov = summary.overview
        story.append(Paragraph("1. Executive Summary &amp; Overview KPIs", section_heading))

        kpi_matrix = [
            [
                Paragraph(str(ov.total_complaints), kpi_num_style),
                Paragraph(str(ov.pending_complaints), kpi_num_style),
                Paragraph(str(ov.assigned_complaints), kpi_num_style),
                Paragraph(str(ov.in_progress_complaints), kpi_num_style),
                Paragraph(str(ov.resolved_complaints), kpi_num_style),
                Paragraph(str(ov.closed_complaints), kpi_num_style),
            ],
            [
                Paragraph("TOTAL", kpi_label_style),
                Paragraph("PENDING", kpi_label_style),
                Paragraph("ASSIGNED", kpi_label_style),
                Paragraph("IN PROGRESS", kpi_label_style),
                Paragraph("RESOLVED", kpi_label_style),
                Paragraph("CLOSED", kpi_label_style),
            ],
            [
                Paragraph(str(ov.high_priority_complaints), kpi_num_style),
                Paragraph(str(ov.medium_priority_complaints), kpi_num_style),
                Paragraph(str(ov.low_priority_complaints), kpi_num_style),
                Paragraph(f"{ov.resolution_rate:.1f}%", kpi_num_style),
                Paragraph(f"{ov.closure_rate:.1f}%", kpi_num_style),
                Paragraph(f"{summary.resolution.average_resolution_hours:.1f}h", kpi_num_style),
            ],
            [
                Paragraph("HIGH PRIORITY", kpi_label_style),
                Paragraph("MEDIUM PRIORITY", kpi_label_style),
                Paragraph("LOW PRIORITY", kpi_label_style),
                Paragraph("RESOLUTION RATE", kpi_label_style),
                Paragraph("CLOSURE RATE", kpi_label_style),
                Paragraph("AVG RESOLUTION", kpi_label_style),
            ],
        ]
        kpi_table = Table(kpi_matrix, colWidths=[90, 90, 90, 90, 90, 90])
        kpi_table.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
                ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#CBD5E1")),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ])
        )
        story.append(kpi_table)
        story.append(Spacer(1, 8))

        # =====================================================================
        # SMART CAMPUS INSIGHTS (FACTUAL & DETERMINISTIC)
        # =====================================================================
        story.append(Paragraph("2. Smart Campus Insights", section_heading))
        insights = summary.insights or cls.generate_smart_insights(summary)

        insight_rows = []
        for ins in insights:
            badge_color = "#2563EB"
            if ins.type == "warning":
                badge_color = "#D97706"
            elif ins.type == "success":
                badge_color = "#059669"
            elif ins.type == "neutral":
                badge_color = "#64748B"

            cat_badge = Paragraph(
                f"<font color='{badge_color}'><b>[{ins.category.upper()}]</b></font>",
                body_bold,
            )
            detail_cell = Paragraph(
                f"<b>{ins.title}:</b> {ins.description}",
                insight_desc,
            )
            metric_cell = Paragraph(
                f"<b>{ins.metric or ''}</b>",
                body_center,
            )
            insight_rows.append([cat_badge, detail_cell, metric_cell])

        if insight_rows:
            insights_table = Table(insight_rows, colWidths=[85, 375, 80])
            insights_table.setStyle(
                TableStyle([
                    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
                    ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#E2E8F0")),
                    ("LINEBELOW", (0, 0), (-1, -1), 0.5, colors.HexColor("#F1F5F9")),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("TOPPADDING", (0, 0), (-1, -1), 3),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                    ("LEFTPADDING", (0, 0), (-1, -1), 4),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                ])
            )
            story.append(insights_table)
        else:
            story.append(Paragraph("No sufficient data for insights in the selected scope.", body_style))

        story.append(Spacer(1, 8))

        # =====================================================================
        # COMPLAINT DISTRIBUTIONS (STATUS, CATEGORY, PRIORITY)
        # =====================================================================
        story.append(Paragraph("3. Complaint Distributions", section_heading))

        # Side by Side: Status & Priority
        status_table_data = [
            [Paragraph("Status", th_style), Paragraph("Count", th_center), Paragraph("% Share", th_center)]
        ]
        for s in summary.status_distribution:
            status_table_data.append([
                Paragraph(s.status, body_style),
                Paragraph(str(s.count), body_center),
                Paragraph(f"{s.percentage:.1f}%", body_center),
            ])
        if not summary.status_distribution:
            status_table_data.append([Paragraph("No data", body_style), Paragraph("0", body_center), Paragraph("0%", body_center)])

        priority_table_data = [
            [Paragraph("Priority", th_style), Paragraph("Count", th_center), Paragraph("% Share", th_center)]
        ]
        for p in summary.priority_distribution:
            priority_table_data.append([
                Paragraph(p.priority, body_style),
                Paragraph(str(p.count), body_center),
                Paragraph(f"{p.percentage:.1f}%", body_center),
            ])
        if not summary.priority_distribution:
            priority_table_data.append([Paragraph("No data", body_style), Paragraph("0", body_center), Paragraph("0%", body_center)])

        st_table = Table(status_table_data, colWidths=[130, 65, 65])
        st_table.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1E3A8A")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
                ("TOPPADDING", (0, 0), (-1, -1), 2.5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2.5),
            ])
        )

        pr_table = Table(priority_table_data, colWidths=[130, 65, 65])
        pr_table.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1E3A8A")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
                ("TOPPADDING", (0, 0), (-1, -1), 2.5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2.5),
            ])
        )

        combined_dist = Table([[st_table, pr_table]], colWidths=[265, 275])
        combined_dist.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
        story.append(combined_dist)
        story.append(Spacer(1, 6))

        # Category Breakdown Table
        cat_table_data = [
            [Paragraph("Category", th_style), Paragraph("Complaint Count", th_center), Paragraph("Percentage Share", th_center)]
        ]
        for c in summary.category_distribution:
            cat_table_data.append([
                Paragraph(c.category, body_style),
                Paragraph(str(c.count), body_center),
                Paragraph(f"{c.percentage:.1f}%", body_center),
            ])
        if not summary.category_distribution:
            cat_table_data.append([Paragraph("No categories recorded", body_style), Paragraph("0", body_center), Paragraph("0%", body_center)])

        cat_table = Table(cat_table_data, colWidths=[240, 150, 150])
        cat_table.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1E3A8A")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
                ("TOPPADDING", (0, 0), (-1, -1), 2.5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2.5),
            ])
        )
        story.append(cat_table)

        # Page break before department and category performance tables for clean layout
        story.append(PageBreak())

        # =====================================================================
        # DEPARTMENT PERFORMANCE TABLE
        # =====================================================================
        story.append(Paragraph("4. Department Performance Metrics", section_heading))
        dept_data = [
            [
                Paragraph("Department", th_style),
                Paragraph("Total", th_center),
                Paragraph("Pending", th_center),
                Paragraph("Assigned", th_center),
                Paragraph("In Prog", th_center),
                Paragraph("Resolved", th_center),
                Paragraph("Closed", th_center),
                Paragraph("Res Rate", th_center),
                Paragraph("Avg Hours", th_center),
            ]
        ]
        for d in summary.department_performance:
            dept_data.append([
                Paragraph(d.department_name, body_style),
                Paragraph(str(d.total_complaints), body_center),
                Paragraph(str(d.pending_complaints), body_center),
                Paragraph(str(d.assigned_complaints), body_center),
                Paragraph(str(d.in_progress_complaints), body_center),
                Paragraph(str(d.resolved_complaints), body_center),
                Paragraph(str(d.closed_complaints), body_center),
                Paragraph(f"{d.resolution_rate:.1f}%", body_center),
                Paragraph(f"{d.average_resolution_hours:.1f}h", body_center),
            ])
        if not summary.department_performance:
            dept_data.append([Paragraph("No department records", body_style), Paragraph("0", body_center), Paragraph("0", body_center), Paragraph("0", body_center), Paragraph("0", body_center), Paragraph("0", body_center), Paragraph("0", body_center), Paragraph("0%", body_center), Paragraph("0.0h", body_center)])

        dept_table = Table(dept_data, colWidths=[150, 45, 45, 45, 45, 50, 50, 55, 55])
        dept_table.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1E3A8A")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ])
        )
        story.append(dept_table)
        story.append(Spacer(1, 10))

        # =====================================================================
        # CATEGORY PERFORMANCE TABLE
        # =====================================================================
        story.append(Paragraph("5. Category Resolution &amp; Workload Performance", section_heading))
        cat_perf_data = [
            [
                Paragraph("Category", th_style),
                Paragraph("Total", th_center),
                Paragraph("Resolved", th_center),
                Paragraph("Closed", th_center),
                Paragraph("Open Workload", th_center),
                Paragraph("Resolution Rate", th_center),
                Paragraph("Avg Resolution", th_center),
            ]
        ]
        for cp in summary.category_performance:
            cat_perf_data.append([
                Paragraph(cp.category, body_style),
                Paragraph(str(cp.total_complaints), body_center),
                Paragraph(str(cp.resolved_complaints), body_center),
                Paragraph(str(cp.closed_complaints), body_center),
                Paragraph(str(cp.open_complaints), body_center),
                Paragraph(f"{cp.resolution_rate:.1f}%", body_center),
                Paragraph(f"{cp.average_resolution_hours:.1f}h", body_center),
            ])
        if not summary.category_performance:
            cat_perf_data.append([Paragraph("No category records", body_style), Paragraph("0", body_center), Paragraph("0", body_center), Paragraph("0", body_center), Paragraph("0", body_center), Paragraph("0%", body_center), Paragraph("0.0h", body_center)])

        cat_perf_table = Table(cat_perf_data, colWidths=[150, 60, 60, 60, 70, 70, 70])
        cat_perf_table.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1E3A8A")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ])
        )
        story.append(cat_perf_table)
        story.append(Spacer(1, 10))

        # =====================================================================
        # LOCATION DISTRIBUTION & RESOLUTION SUMMARY
        # =====================================================================
        loc_and_res_story = []
        loc_and_res_story.append(Paragraph("6. Location &amp; Resolution Performance", section_heading))

        loc_data = [
            [Paragraph("Location Name", th_style), Paragraph("Complaints", th_center), Paragraph("% Share", th_center)]
        ]
        for loc in summary.location_distribution:
            loc_data.append([
                Paragraph(loc.location_name, body_style),
                Paragraph(str(loc.complaint_count), body_center),
                Paragraph(f"{loc.percentage:.1f}%", body_center),
            ])
        if not summary.location_distribution:
            loc_data.append([Paragraph("No location records", body_style), Paragraph("0", body_center), Paragraph("0%", body_center)])

        loc_table = Table(loc_data, colWidths=[140, 65, 65])
        loc_table.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1E3A8A")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
                ("TOPPADDING", (0, 0), (-1, -1), 2.5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2.5),
            ])
        )

        res_data = [
            [Paragraph("Resolution Metric", th_style), Paragraph("Measurement", th_center)],
            [Paragraph("Complaints with Resolution Timestamps", body_style), Paragraph(str(summary.resolution.resolved_complaints), body_center)],
            [Paragraph("Average Resolution Duration", body_style), Paragraph(f"{summary.resolution.average_resolution_hours:.1f} hours", body_center)],
            [
                Paragraph("Fastest Recorded Resolution", body_style),
                Paragraph(
                    f"{summary.resolution.fastest_resolution_hours:.1f} hours"
                    if summary.resolution.fastest_resolution_hours is not None
                    else "N/A",
                    body_center,
                ),
            ],
            [
                Paragraph("Slowest Recorded Resolution", body_style),
                Paragraph(
                    f"{summary.resolution.slowest_resolution_hours:.1f} hours"
                    if summary.resolution.slowest_resolution_hours is not None
                    else "N/A",
                    body_center,
                ),
            ],
        ]
        res_table = Table(res_data, colWidths=[175, 95])
        res_table.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1E3A8A")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
                ("TOPPADDING", (0, 0), (-1, -1), 2.5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2.5),
            ])
        )

        loc_res_combined = Table([[loc_table, res_table]], colWidths=[270, 270])
        loc_res_combined.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
        loc_and_res_story.append(loc_res_combined)

        story.append(KeepTogether(loc_and_res_story))
        story.append(Spacer(1, 10))

        # =====================================================================
        # TREND DATA SUMMARY
        # =====================================================================
        trend_story = []
        trend_story.append(Paragraph(f"7. Temporal Submission Trend ({f_int.capitalize()})", section_heading))

        trend_data = [[Paragraph("Period", th_style), Paragraph("Complaints Logged", th_center)]]
        for t in summary.trend:
            trend_data.append([
                Paragraph(t.period, body_style),
                Paragraph(str(t.count), body_center),
            ])
        if not summary.trend:
            trend_data.append([Paragraph("No trend data in selected window", body_style), Paragraph("0", body_center)])

        trend_table = Table(trend_data, colWidths=[270, 270])
        trend_table.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1E3A8A")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
                ("TOPPADDING", (0, 0), (-1, -1), 2.5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2.5),
            ])
        )
        trend_story.append(trend_table)

        story.append(KeepTogether(trend_story))

        # Build document
        doc.build(story, canvasmaker=NumberedCanvas)
        return buffer.getvalue()


analytics_report_service = AnalyticsReportService()
