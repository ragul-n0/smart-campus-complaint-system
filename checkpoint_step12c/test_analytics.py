import os
from datetime import datetime, date, timedelta, timezone
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.core.database import Base, get_db
from app.models.department import Department
from app.models.location import Location
from app.models.user import User
from app.models.complaint import Complaint

TEST_DB_PATH = "test_analytics.db"
SQLALCHEMY_DATABASE_URL = f"sqlite:///{TEST_DB_PATH}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="module")
def client():
    return TestClient(app)


@pytest.fixture(scope="module", autouse=True)
def setup_test_db(client):
    if os.path.exists(TEST_DB_PATH):
        try:
            os.remove(TEST_DB_PATH)
        except OSError:
            pass

    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()

    # Seed departments
    dept_it = Department(name="IT", description="Information Technology")
    dept_elec = Department(name="Electrical", description="Campus Electrical")
    dept_maint = Department(name="Maintenance", description="Civil Works")
    dept_unused = Department(name="UnusedDept", description="No complaints")
    db.add_all([dept_it, dept_elec, dept_maint, dept_unused])

    # Seed locations
    loc_main = Location(name="Main Block", description="Main campus building")
    loc_cse = Location(name="CSE Block", description="Computer science block")
    loc_unused = Location(name="UnusedLoc", description="No complaints here")
    db.add_all([loc_main, loc_cse, loc_unused])

    db.commit()
    db.close()

    old_override = app.dependency_overrides.get(get_db)
    app.dependency_overrides[get_db] = override_get_db

    # Register users
    client.post(
        "/api/v1/auth/register",
        json={
            "name": "Analytics Admin",
            "username": "analytics_admin",
            "password": "AdminPassword@123",
            "role": "admin",
        },
    )
    client.post(
        "/api/v1/auth/register",
        json={
            "name": "Analytics Student",
            "username": "analytics_student",
            "password": "StudentPassword@123",
            "role": "student",
        },
    )
    client.post(
        "/api/v1/auth/register",
        json={
            "name": "Analytics Staff",
            "username": "analytics_staff",
            "password": "StaffPassword@123",
            "role": "staff",
            "department_id": 1,
        },
    )

    yield

    if old_override is not None:
        app.dependency_overrides[get_db] = old_override
    else:
        app.dependency_overrides.pop(get_db, None)
    if os.path.exists(TEST_DB_PATH):
        try:
            os.remove(TEST_DB_PATH)
        except OSError:
            pass


@pytest.fixture(scope="module")
def admin_token(client):
    res = client.post(
        "/api/v1/auth/login",
        json={"username": "analytics_admin", "password": "AdminPassword@123"},
    )
    assert res.status_code == 200
    return res.json()["access_token"]


@pytest.fixture(scope="module")
def student_token(client):
    res = client.post(
        "/api/v1/auth/login",
        json={"username": "analytics_student", "password": "StudentPassword@123"},
    )
    assert res.status_code == 200
    return res.json()["access_token"]


@pytest.fixture(scope="module")
def staff_token(client):
    res = client.post(
        "/api/v1/auth/login",
        json={"username": "analytics_staff", "password": "StaffPassword@123"},
    )
    assert res.status_code == 200
    return res.json()["access_token"]


# =====================================================================
# 1. AUTHENTICATION & AUTHORIZATION TESTS
# =====================================================================

def test_admin_can_access_analytics_overview(client, admin_token):
    res = client.get(
        "/api/v1/admin/analytics/overview",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert "overview" in data
    assert "status_distribution" in data
    assert "category_distribution" in data
    assert "priority_distribution" in data
    assert "department_distribution" in data
    assert "location_distribution" in data
    assert "trend" in data
    assert "resolution" in data
    assert "department_performance" in data
    assert "category_performance" in data


def test_unauthenticated_analytics_rejected(client):
    res = client.get("/api/v1/admin/analytics/overview")
    assert res.status_code == 401


def test_student_forbidden_analytics(client, student_token):
    res = client.get(
        "/api/v1/admin/analytics/overview",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert res.status_code == 403


def test_staff_forbidden_analytics(client, staff_token):
    res = client.get(
        "/api/v1/admin/analytics/overview",
        headers={"Authorization": f"Bearer {staff_token}"},
    )
    assert res.status_code == 403


# =====================================================================
# 2. EMPTY DATABASE ANALYTICS TESTS
# =====================================================================

def test_analytics_with_zero_complaints(client, admin_token):
    res = client.get(
        "/api/v1/admin/analytics/overview",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    data = res.json()

    ov = data["overview"]
    assert ov["total_complaints"] == 0
    assert ov["pending_complaints"] == 0
    assert ov["assigned_complaints"] == 0
    assert ov["in_progress_complaints"] == 0
    assert ov["resolved_complaints"] == 0
    assert ov["closed_complaints"] == 0
    assert ov["resolution_rate"] == 0.0
    assert ov["closure_rate"] == 0.0

    res_stat = data["resolution"]
    assert res_stat["average_resolution_hours"] == 0.0
    assert res_stat["resolved_complaints"] == 0
    assert res_stat["fastest_resolution_hours"] is None
    assert res_stat["slowest_resolution_hours"] is None

    assert data["trend"] == []


# =====================================================================
# 3. POPULATED DATASET & VERIFICATION TESTS
# =====================================================================

def test_populate_complaints(client):
    """Inserts a controlled set of 5 complaints spanning various dimensions."""
    db = TestingSessionLocal()
    student = db.query(User).filter(User.username == "analytics_student").first()
    dept_it = db.query(Department).filter(Department.name == "IT").first()
    dept_elec = db.query(Department).filter(Department.name == "Electrical").first()
    dept_maint = db.query(Department).filter(Department.name == "Maintenance").first()
    loc_main = db.query(Location).filter(Location.name == "Main Block").first()
    loc_cse = db.query(Location).filter(Location.name == "CSE Block").first()

    complaints = [
        Complaint(
            student_id=student.id,
            title="WiFi disconnected in lab",
            description="Computer science lab wifi is down",
            category="IT",
            priority="Low",
            location_id=loc_main.id,
            department_id=dept_it.id,
            status="Pending",
            created_at=datetime(2026, 9, 20, 10, 0, 0),
        ),
        Complaint(
            student_id=student.id,
            title="Fan regulator smoking",
            description="Sparking switch in classroom 101",
            category="Electrical",
            priority="Medium",
            location_id=loc_cse.id,
            department_id=dept_elec.id,
            status="Assigned",
            created_at=datetime(2026, 9, 21, 11, 0, 0),
        ),
        Complaint(
            student_id=student.id,
            title="Restroom tap broken",
            description="Water overflowing rapidly",
            category="Maintenance",
            priority="High",
            location_id=loc_main.id,
            department_id=dept_maint.id,
            status="In Progress",
            created_at=datetime(2026, 9, 22, 12, 0, 0),
        ),
        Complaint(
            student_id=student.id,
            title="Projector bulb replacement",
            description="Lab projector is dim",
            category="IT",
            priority="High",
            location_id=loc_cse.id,
            department_id=dept_it.id,
            status="Resolved",
            created_at=datetime(2026, 9, 23, 10, 0, 0),
            resolved_at=datetime(2026, 9, 23, 14, 0, 0),  # 4 hours
        ),
        Complaint(
            student_id=student.id,
            title="Corridor light flickering",
            description="Flickering tube light outside hall",
            category="Electrical",
            priority="Medium",
            location_id=loc_main.id,
            department_id=dept_elec.id,
            status="Closed",
            created_at=datetime(2026, 9, 24, 9, 0, 0),
            resolved_at=datetime(2026, 9, 24, 17, 0, 0),  # 8 hours
        ),
    ]
    db.add_all(complaints)
    db.commit()
    db.close()


def test_overview_kpi_metrics(client, admin_token):
    res = client.get(
        "/api/v1/admin/analytics/overview",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    ov = res.json()["overview"]

    assert ov["total_complaints"] == 5
    assert ov["pending_complaints"] == 1
    assert ov["assigned_complaints"] == 1
    assert ov["in_progress_complaints"] == 1
    assert ov["resolved_complaints"] == 1
    assert ov["closed_complaints"] == 1

    assert ov["high_priority_complaints"] == 2
    assert ov["medium_priority_complaints"] == 2
    assert ov["low_priority_complaints"] == 1

    # resolution_rate: (1 resolved + 1 closed) / 5 = 40.0%
    assert ov["resolution_rate"] == 40.0
    # closure_rate: 1 closed / 5 = 20.0%
    assert ov["closure_rate"] == 20.0


def test_status_distribution(client, admin_token):
    res = client.get(
        "/api/v1/admin/analytics/status",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    items = res.json()
    status_map = {item["status"]: item for item in items}

    for s in ["Pending", "Assigned", "In Progress", "Resolved", "Closed"]:
        assert s in status_map
        assert status_map[s]["count"] == 1
        assert status_map[s]["percentage"] == 20.0


def test_category_distribution(client, admin_token):
    res = client.get(
        "/api/v1/admin/analytics/categories",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    items = res.json()
    cat_map = {item["category"]: item for item in items}

    assert cat_map["IT"]["count"] == 2
    assert cat_map["IT"]["percentage"] == 40.0
    assert cat_map["Electrical"]["count"] == 2
    assert cat_map["Electrical"]["percentage"] == 40.0
    assert cat_map["Maintenance"]["count"] == 1
    assert cat_map["Maintenance"]["percentage"] == 20.0
    assert cat_map["Housekeeping"]["count"] == 0
    assert cat_map["Housekeeping"]["percentage"] == 0.0

    # Ensure sorted descending by count
    counts = [item["count"] for item in items]
    assert counts == sorted(counts, reverse=True)


def test_priority_distribution(client, admin_token):
    res = client.get(
        "/api/v1/admin/analytics/priorities",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    items = res.json()
    prio_map = {item["priority"]: item for item in items}

    assert prio_map["High"]["count"] == 2
    assert prio_map["High"]["percentage"] == 40.0
    assert prio_map["Medium"]["count"] == 2
    assert prio_map["Medium"]["percentage"] == 40.0
    assert prio_map["Low"]["count"] == 1
    assert prio_map["Low"]["percentage"] == 20.0


def test_department_distribution(client, admin_token):
    res = client.get(
        "/api/v1/admin/analytics/departments",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    items = res.json()
    dept_map = {item["department_name"]: item for item in items}

    assert dept_map["IT"]["count"] == 2
    assert dept_map["IT"]["percentage"] == 40.0
    assert dept_map["Electrical"]["count"] == 2
    assert dept_map["Electrical"]["percentage"] == 40.0
    assert dept_map["Maintenance"]["count"] == 1
    assert dept_map["Maintenance"]["percentage"] == 20.0
    assert dept_map["UnusedDept"]["count"] == 0
    assert dept_map["UnusedDept"]["percentage"] == 0.0


def test_location_distribution(client, admin_token):
    res = client.get(
        "/api/v1/admin/analytics/locations",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    items = res.json()
    loc_map = {item["location_name"]: item for item in items}

    assert loc_map["Main Block"]["complaint_count"] == 3
    assert loc_map["Main Block"]["percentage"] == 60.0
    assert loc_map["CSE Block"]["complaint_count"] == 2
    assert loc_map["CSE Block"]["percentage"] == 40.0
    assert loc_map["UnusedLoc"]["complaint_count"] == 0
    assert loc_map["UnusedLoc"]["percentage"] == 0.0


def test_resolution_analytics(client, admin_token):
    res = client.get(
        "/api/v1/admin/analytics/resolution",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    data = res.json()

    # Durations are 4.0h (IT) and 8.0h (Electrical) -> avg = 6.0h
    assert data["resolved_complaints"] == 2
    assert data["average_resolution_hours"] == 6.0
    assert data["fastest_resolution_hours"] == 4.0
    assert data["slowest_resolution_hours"] == 8.0


def test_department_performance(client, admin_token):
    res = client.get(
        "/api/v1/admin/analytics/department-performance",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    items = res.json()
    dept_map = {item["department_name"]: item for item in items}

    # IT department: 2 total, 1 pending, 1 resolved -> 50% res_rate, 4.0 avg_hours
    it = dept_map["IT"]
    assert it["total_complaints"] == 2
    assert it["pending_complaints"] == 1
    assert it["resolved_complaints"] == 1
    assert it["resolution_rate"] == 50.0
    assert it["average_resolution_hours"] == 4.0

    # Electrical: 2 total, 1 assigned, 1 closed -> 50% res_rate, 8.0 avg_hours
    elec = dept_map["Electrical"]
    assert elec["total_complaints"] == 2
    assert elec["assigned_complaints"] == 1
    assert elec["closed_complaints"] == 1
    assert elec["resolution_rate"] == 50.0
    assert elec["average_resolution_hours"] == 8.0

    # Maintenance: 1 total, 1 in_progress -> 0% res_rate, 0.0 avg_hours
    maint = dept_map["Maintenance"]
    assert maint["total_complaints"] == 1
    assert maint["in_progress_complaints"] == 1
    assert maint["resolution_rate"] == 0.0
    assert maint["average_resolution_hours"] == 0.0

    # UnusedDept: 0 complaints
    unused = dept_map["UnusedDept"]
    assert unused["total_complaints"] == 0
    assert unused["resolution_rate"] == 0.0
    assert unused["average_resolution_hours"] == 0.0


def test_category_performance(client, admin_token):
    res = client.get(
        "/api/v1/admin/analytics/category-performance",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    items = res.json()
    cat_map = {item["category"]: item for item in items}

    assert cat_map["IT"]["total_complaints"] == 2
    assert cat_map["IT"]["open_complaints"] == 1
    assert cat_map["IT"]["resolved_complaints"] == 1
    assert cat_map["IT"]["closed_complaints"] == 0
    assert cat_map["IT"]["resolution_rate"] == 50.0
    assert cat_map["IT"]["average_resolution_hours"] == 4.0

    assert cat_map["Electrical"]["total_complaints"] == 2
    assert cat_map["Electrical"]["open_complaints"] == 1
    assert cat_map["Electrical"]["closed_complaints"] == 1
    assert cat_map["Electrical"]["resolution_rate"] == 50.0
    assert cat_map["Electrical"]["average_resolution_hours"] == 8.0

    assert cat_map["Maintenance"]["total_complaints"] == 1
    assert cat_map["Maintenance"]["open_complaints"] == 1
    assert cat_map["Maintenance"]["resolution_rate"] == 0.0


def test_trend_analytics(client, admin_token):
    # Daily trend
    res_daily = client.get(
        "/api/v1/admin/analytics/trends?interval=daily",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res_daily.status_code == 200
    daily_data = res_daily.json()
    assert len(daily_data) == 5
    daily_periods = [d["period"] for d in daily_data]
    assert "2026-09-20" in daily_periods
    assert "2026-09-24" in daily_periods

    # Monthly trend
    res_monthly = client.get(
        "/api/v1/admin/analytics/trends?interval=monthly",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res_monthly.status_code == 200
    monthly_data = res_monthly.json()
    assert len(monthly_data) == 1
    assert monthly_data[0]["period"] == "2026-09"
    assert monthly_data[0]["count"] == 5

    # Weekly trend
    res_weekly = client.get(
        "/api/v1/admin/analytics/trends?interval=weekly",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res_weekly.status_code == 200
    assert len(res_weekly.json()) >= 1

    # Invalid interval
    res_invalid = client.get(
        "/api/v1/admin/analytics/trends?interval=yearly",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res_invalid.status_code == 400


# =====================================================================
# 4. FILTERING TESTS
# =====================================================================

def test_filter_by_date_range(client, admin_token):
    res = client.get(
        "/api/v1/admin/analytics/overview?start_date=2026-09-22&end_date=2026-09-24",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    ov = res.json()["overview"]
    # 2026-09-22 (Maintenance), 2026-09-23 (IT), 2026-09-24 (Electrical) = 3 complaints
    assert ov["total_complaints"] == 3


def test_filter_by_department(client, admin_token):
    db = TestingSessionLocal()
    dept_it = db.query(Department).filter(Department.name == "IT").first()
    db.close()

    res = client.get(
        f"/api/v1/admin/analytics/overview?department_id={dept_it.id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    ov = res.json()["overview"]
    assert ov["total_complaints"] == 2


def test_filter_by_category(client, admin_token):
    res = client.get(
        "/api/v1/admin/analytics/overview?category=Electrical",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    ov = res.json()["overview"]
    assert ov["total_complaints"] == 2


def test_filter_by_priority(client, admin_token):
    res = client.get(
        "/api/v1/admin/analytics/overview?priority=High",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    ov = res.json()["overview"]
    assert ov["total_complaints"] == 2


def test_filter_by_status(client, admin_token):
    res = client.get(
        "/api/v1/admin/analytics/overview?status=Pending",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    ov = res.json()["overview"]
    assert ov["total_complaints"] == 1
    assert ov["pending_complaints"] == 1


def test_filter_by_location(client, admin_token):
    db = TestingSessionLocal()
    loc_cse = db.query(Location).filter(Location.name == "CSE Block").first()
    db.close()

    res = client.get(
        f"/api/v1/admin/analytics/overview?location_id={loc_cse.id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    ov = res.json()["overview"]
    assert ov["total_complaints"] == 2


def test_combined_filters(client, admin_token):
    db = TestingSessionLocal()
    dept_it = db.query(Department).filter(Department.name == "IT").first()
    db.close()

    res = client.get(
        f"/api/v1/admin/analytics/overview?department_id={dept_it.id}&priority=High",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    ov = res.json()["overview"]
    assert ov["total_complaints"] == 1
    assert ov["resolved_complaints"] == 1


# =====================================================================
# 5. EDGE CASES
# =====================================================================

def test_negative_or_invalid_resolution_timestamp_safe(client, admin_token):
    """
    If a complaint somehow has resolved_at < created_at, it must not corrupt
    average resolution calculations.
    """
    db = TestingSessionLocal()
    student = db.query(User).filter(User.username == "analytics_student").first()
    loc = db.query(Location).first()
    dept = db.query(Department).first()

    bad_complaint = Complaint(
        student_id=student.id,
        title="Invalid timestamp complaint",
        description="Corrupted timestamp edge case test",
        category="Other",
        priority="Low",
        location_id=loc.id,
        department_id=dept.id,
        status="Resolved",
        created_at=datetime(2026, 9, 24, 12, 0, 0),
        resolved_at=datetime(2026, 9, 24, 10, 0, 0),  # Negative duration
    )
    db.add(bad_complaint)
    db.commit()

    res = client.get(
        "/api/v1/admin/analytics/resolution?category=Other",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    data = res.json()
    # Bad complaint duration is ignored safely
    assert data["resolved_complaints"] == 0
    assert data["average_resolution_hours"] == 0.0

    # Cleanup
    db.delete(bad_complaint)
    db.commit()
    db.close()


def test_null_department_and_location_safe(client, admin_token):
    """
    Complaints with null department or null location must not raise 500
    and should be labeled as 'Unassigned' in distribution breakdowns.
    """
    db = TestingSessionLocal()
    student = db.query(User).filter(User.username == "analytics_student").first()
    loc = db.query(Location).first()

    unassigned_dept_complaint = Complaint(
        student_id=student.id,
        title="Unassigned department complaint",
        description="No department mapped",
        category="Other",
        priority="Medium",
        location_id=loc.id,
        department_id=None,
        status="Pending",
        created_at=datetime(2026, 9, 24, 12, 0, 0),
    )
    db.add(unassigned_dept_complaint)
    db.commit()

    res = client.get(
        "/api/v1/admin/analytics/departments",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    items = res.json()
    unassigned = next((item for item in items if item["department_name"] == "Unassigned"), None)
    assert unassigned is not None
    assert unassigned["count"] >= 1

    # Cleanup
    db.delete(unassigned_dept_complaint)
    db.commit()
    db.close()


def test_kpis_specialized_endpoint(client, admin_token):
    res = client.get(
        "/api/v1/admin/analytics/kpis",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert "total_complaints" in data
    assert "resolution_rate" in data
    assert "closure_rate" in data


# =====================================================================
# STEP 12C: SMART CAMPUS INSIGHTS & EXPORT TESTS
# =====================================================================

def test_insights_endpoint_authorization(client, student_token, staff_token):
    # Unauthenticated -> 401
    res = client.get("/api/v1/admin/analytics/insights")
    assert res.status_code == 401

    # Student -> 403
    res = client.get(
        "/api/v1/admin/analytics/insights",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert res.status_code == 403

    # Staff -> 403
    res = client.get(
        "/api/v1/admin/analytics/insights",
        headers={"Authorization": f"Bearer {staff_token}"},
    )
    assert res.status_code == 403


def test_insights_endpoint_admin_access_and_determinism(client, admin_token):
    res = client.get(
        "/api/v1/admin/analytics/insights",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    insights = res.json()
    assert isinstance(insights, list)
    assert len(insights) >= 5

    # Check that required insight items exist with factual deterministic content
    keys = {item["id"] for item in insights}
    assert "overview_total" in keys
    assert "overview_open" in keys
    assert "overview_high_priority" in keys
    assert "top_category" in keys
    assert "top_department" in keys
    assert "workload_highest_open" in keys


def test_insights_respect_filters(client, admin_token):
    # Filter by Category=IT
    res = client.get(
        "/api/v1/admin/analytics/insights?category=IT",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    insights = res.json()
    top_cat = next((item for item in insights if item["id"] == "top_category"), None)
    assert top_cat is not None
    assert "IT" in top_cat["description"]


def test_export_csv_authorization(client, admin_token, student_token, staff_token):
    # Unauthenticated -> 401
    res = client.get("/api/v1/admin/analytics/export/csv")
    assert res.status_code == 401

    # Student -> 403
    res = client.get(
        "/api/v1/admin/analytics/export/csv",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert res.status_code == 403

    # Staff -> 403
    res = client.get(
        "/api/v1/admin/analytics/export/csv",
        headers={"Authorization": f"Bearer {staff_token}"},
    )
    assert res.status_code == 403

    # Admin -> 200
    res = client.get(
        "/api/v1/admin/analytics/export/csv",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    assert "text/csv" in res.headers["content-type"]
    assert "attachment; filename=\"campus-analytics-" in res.headers["content-disposition"]


def test_export_csv_content_and_sections(client, admin_token):
    res = client.get(
        "/api/v1/admin/analytics/export/csv",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    text = res.text
    # Verify report sections exist
    assert "SMART CAMPUS COMPLAINT & ISSUE MANAGEMENT SYSTEM" in text
    assert "APPLIED FILTERS" in text
    assert "1. OVERVIEW KPIS" in text
    assert "2. SMART CAMPUS INSIGHTS" in text
    assert "3. STATUS DISTRIBUTION" in text
    assert "4. CATEGORY DISTRIBUTION" in text
    assert "5. PRIORITY DISTRIBUTION" in text
    assert "6. DEPARTMENT PERFORMANCE" in text
    assert "7. CATEGORY PERFORMANCE" in text
    assert "8. LOCATION DISTRIBUTION" in text
    assert "9. RESOLUTION PERFORMANCE" in text
    assert "10. SUBMISSION TREND" in text


def test_export_csv_with_filters(client, admin_token):
    res = client.get(
        "/api/v1/admin/analytics/export/csv?category=IT&priority=High",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    text = res.text
    assert "Category,IT" in text
    assert "Priority,High" in text


def test_export_csv_empty_dataset(client, admin_token):
    # Future dates with 0 complaints
    res = client.get(
        "/api/v1/admin/analytics/export/csv?start_date=2099-01-01&end_date=2099-01-31",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    text = res.text
    assert "Total Complaints,0" in text
    assert "No sufficient data for this insight" in text or "No complaints found" in text


def test_export_pdf_authorization(client, admin_token, student_token, staff_token):
    # Unauthenticated -> 401
    res = client.get("/api/v1/admin/analytics/export/pdf")
    assert res.status_code == 401

    # Student -> 403
    res = client.get(
        "/api/v1/admin/analytics/export/pdf",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert res.status_code == 403

    # Staff -> 403
    res = client.get(
        "/api/v1/admin/analytics/export/pdf",
        headers={"Authorization": f"Bearer {staff_token}"},
    )
    assert res.status_code == 403

    # Admin -> 200
    res = client.get(
        "/api/v1/admin/analytics/export/pdf",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    assert "application/pdf" in res.headers["content-type"]
    assert "attachment; filename=\"campus-analytics-" in res.headers["content-disposition"]
    # PDF magic byte signature %PDF-
    assert res.content.startswith(b"%PDF-")


def test_export_pdf_with_filters_and_empty_dataset(client, admin_token):
    # Filters producing zero records in 2099
    res = client.get(
        "/api/v1/admin/analytics/export/pdf?start_date=2099-01-01&end_date=2099-01-31&category=IT",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    assert "application/pdf" in res.headers["content-type"]
    assert len(res.content) > 1000
    assert res.content.startswith(b"%PDF-")
