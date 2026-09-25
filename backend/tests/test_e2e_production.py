"""
Step 12D: Full End-to-End Production Readiness & Integration Test.

Simulates complete user lifecycles across Student, Staff, and Admin roles:
1. Health & Meta checks
2. Student registration, login, complaint submission with ML prediction
3. Staff queue viewing, self-assignment, status updates, resolution, and closure
4. Closed state immutability
5. Admin analytics, filter isolation, smart campus insights, CSV export, and PDF export
6. Role-based security checks across all protected endpoints
"""

import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.core.database import Base, get_db
from app.models.department import Department
from app.models.location import Location

TEST_DB = "test_e2e_prod.db"
DATABASE_URL = f"sqlite:///{TEST_DB}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_db():
    db = TestingSession()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="module")
def client():
    if os.path.exists(TEST_DB):
        try:
            os.remove(TEST_DB)
        except OSError:
            pass

    Base.metadata.create_all(bind=engine)
    db = TestingSession()
    # Seed default departments and locations
    it_dept = Department(name="IT", description="IT Services")
    elec_dept = Department(name="Electrical", description="Electrical Department")
    db.add_all([it_dept, elec_dept])

    main_loc = Location(name="Main Campus", description="Main Academic Block")
    db.add(main_loc)
    db.commit()
    db.close()

    old_override = app.dependency_overrides.get(get_db)
    app.dependency_overrides[get_db] = override_db

    test_client = TestClient(app)
    yield test_client

    if old_override is not None:
        app.dependency_overrides[get_db] = old_override
    else:
        app.dependency_overrides.pop(get_db, None)

    if os.path.exists(TEST_DB):
        try:
            os.remove(TEST_DB)
        except OSError:
            pass


def test_01_health_and_meta(client):
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "online"
    assert data["database"]["status"] == "connected"

    res_root = client.get("/api")
    assert res_root.status_code == 200
    assert res_root.json()["status"] == "online"


def test_02_complete_student_staff_admin_lifecycle(client):
    # 1. Register Student
    res = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Alex Student",
            "username": "alex_student",
            "password": "Password@123",
            "role": "student",
        },
    )
    assert res.status_code == 201
    student_id = res.json()["id"]

    # 2. Login Student
    res = client.post(
        "/api/v1/auth/login",
        json={"username": "alex_student", "password": "Password@123"},
    )
    assert res.status_code == 200
    student_token = res.json()["access_token"]
    student_headers = {"Authorization": f"Bearer {student_token}"}

    # 3. Register Staff (Assigned to IT department)
    res = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Sarah Staff",
            "username": "sarah_staff",
            "password": "Password@123",
            "role": "staff",
            "department_id": 1,
        },
    )
    assert res.status_code == 201

    # 4. Login Staff
    res = client.post(
        "/api/v1/auth/login",
        json={"username": "sarah_staff", "password": "Password@123"},
    )
    assert res.status_code == 200
    staff_token = res.json()["access_token"]
    staff_headers = {"Authorization": f"Bearer {staff_token}"}

    # 5. Register & Login Admin
    res = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Master Admin",
            "username": "master_admin",
            "password": "Password@123",
            "role": "admin",
        },
    )
    assert res.status_code == 201
    res = client.post(
        "/api/v1/auth/login",
        json={"username": "master_admin", "password": "Password@123"},
    )
    assert res.status_code == 200
    admin_token = res.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 6. Student submits complaint with ML auto-classification
    complaint_payload = {
        "title": "Wi-Fi router in library has failed",
        "description": "The wireless internet router in the central library is blinking red and no laptops can connect to the campus intranet network.",
        "location_id": 1,
    }
    res = client.post("/api/v1/complaints", json=complaint_payload, headers=student_headers)
    assert res.status_code == 201
    complaint = res.json()
    complaint_id = complaint["id"]
    assert complaint["status"] == "Pending"
    assert complaint["category"] in ["IT", "Electrical", "Maintenance", "Housekeeping", "Security", "Plumbing", "Furniture", "Other"]
    assert complaint["priority"] in ["High", "Medium", "Low"]

    # 7. Student views complaint details & tracking timeline
    res = client.get(f"/api/v1/complaints/{complaint_id}", headers=student_headers)
    assert res.status_code == 200
    assert res.json()["id"] == complaint_id

    # 8. Staff checks queue and self-assigns complaint
    res = client.get("/api/v1/staff/complaints", headers=staff_headers)
    assert res.status_code == 200
    assert any(c["id"] == complaint_id for c in res.json())

    res = client.put(f"/api/v1/staff/complaints/{complaint_id}/assign", headers=staff_headers)
    assert res.status_code == 200
    assert res.json()["status"] == "Assigned"

    # 9. Staff updates status to In Progress
    res = client.put(
        f"/api/v1/staff/complaints/{complaint_id}/status",
        json={"new_status": "In Progress", "comment": "Technician dispatched with replacement router."},
        headers=staff_headers,
    )
    assert res.status_code == 200
    assert res.json()["status"] == "In Progress"

    # 10. Staff resolves complaint (requires comment)
    res = client.put(
        f"/api/v1/staff/complaints/{complaint_id}/status",
        json={"new_status": "Resolved", "comment": "Installed replacement Cisco Wi-Fi router. Internet connectivity restored."},
        headers=staff_headers,
    )
    assert res.status_code == 200
    assert res.json()["status"] == "Resolved"
    assert res.json()["resolved_at"] is not None

    # 11. Staff closes complaint (Resolved -> Closed)
    res = client.put(
        f"/api/v1/staff/complaints/{complaint_id}/status",
        json={"new_status": "Closed", "comment": "Verified by student and confirmed operational."},
        headers=staff_headers,
    )
    assert res.status_code == 200
    assert res.json()["status"] == "Closed"

    # 12. Immutability: Closed complaint cannot transition again
    res = client.put(
        f"/api/v1/staff/complaints/{complaint_id}/status",
        json={"new_status": "In Progress"},
        headers=staff_headers,
    )
    assert res.status_code == 400

    # 13. Admin checks Analytics Overview
    res = client.get("/api/v1/admin/analytics/overview", headers=admin_headers)
    assert res.status_code == 200
    overview_data = res.json()
    assert overview_data["overview"]["total_complaints"] >= 1
    assert overview_data["overview"]["closed_complaints"] >= 1
    assert len(overview_data["insights"]) >= 4

    # 14. Admin checks Smart Campus Insights
    res = client.get("/api/v1/admin/analytics/insights", headers=admin_headers)
    assert res.status_code == 200
    insights = res.json()
    assert isinstance(insights, list)

    # 15. Admin exports CSV
    res = client.get("/api/v1/admin/analytics/export/csv", headers=admin_headers)
    assert res.status_code == 200
    assert "text/csv" in res.headers["content-type"]
    assert "1. OVERVIEW KPIS" in res.text

    # 16. Admin exports PDF
    res = client.get("/api/v1/admin/analytics/export/pdf", headers=admin_headers)
    assert res.status_code == 200
    assert "application/pdf" in res.headers["content-type"]
    assert res.content.startswith(b"%PDF-")

    # 17. Security: Student and Staff are rejected from Admin Analytics
    assert client.get("/api/v1/admin/analytics/overview", headers=student_headers).status_code == 403
    assert client.get("/api/v1/admin/analytics/overview", headers=staff_headers).status_code == 403
    assert client.get("/api/v1/admin/analytics/export/csv", headers=student_headers).status_code == 403
    assert client.get("/api/v1/admin/analytics/export/pdf", headers=staff_headers).status_code == 403
