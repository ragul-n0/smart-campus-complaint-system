import os
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
from app.models.complaint_update import ComplaintUpdate

TEST_DB_PATH = "test_staff.db"
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


@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    if os.path.exists(TEST_DB_PATH):
        try:
            os.remove(TEST_DB_PATH)
        except OSError:
            pass

    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()

    # Seed departments
    depts = [
        Department(name="IT", description="Information Technology"),
        Department(name="Electrical", description="Campus Electrical Systems"),
        Department(name="Maintenance", description="Civil Works"),
        Department(name="Housekeeping", description="Sanitation"),
        Department(name="Security", description="Campus Security"),
    ]
    db.add_all(depts)

    # Seed locations
    locs = [
        Location(name="Main Block", description="Main block"),
        Location(name="CSE Block", description="CSE classrooms and labs"),
        Location(name="Library", description="Central library"),
    ]
    db.add_all(locs)
    db.commit()
    db.close()

    app.dependency_overrides[get_db] = override_get_db
    yield
    app.dependency_overrides.pop(get_db, None)
    Base.metadata.drop_all(bind=engine)
    if os.path.exists(TEST_DB_PATH):
        try:
            os.remove(TEST_DB_PATH)
        except OSError:
            pass


client = TestClient(app)


# Fixtures for Student, IT Staff, and Electrical Staff
@pytest.fixture(scope="module")
def student_token():
    client.post(
        "/api/v1/auth/register",
        json={
            "name": "Alex Student",
            "username": "alex_student",
            "password": "Password@123",
            "role": "student",
        },
    )
    res = client.post(
        "/api/v1/auth/login",
        json={"username": "alex_student", "password": "Password@123"},
    )
    return res.json()["access_token"]


@pytest.fixture(scope="module")
def it_staff_token():
    # Register IT staff (Department 1 = IT)
    client.post(
        "/api/v1/auth/register",
        json={
            "name": "John IT Staff",
            "username": "john_it",
            "password": "Staff@12345",
            "role": "staff",
            "department_id": 1,
        },
    )
    res = client.post(
        "/api/v1/auth/login",
        json={"username": "john_it", "password": "Staff@12345"},
    )
    return res.json()["access_token"]


@pytest.fixture(scope="module")
def elec_staff_token():
    # Register Electrical staff (Department 2 = Electrical)
    client.post(
        "/api/v1/auth/register",
        json={
            "name": "Sarah Electrical Staff",
            "username": "sarah_elec",
            "password": "Staff@54321",
            "role": "staff",
            "department_id": 2,
        },
    )
    res = client.post(
        "/api/v1/auth/login",
        json={"username": "sarah_elec", "password": "Staff@54321"},
    )
    return res.json()["access_token"]


def test_01_staff_can_login(it_staff_token, elec_staff_token):
    """1. Staff can authenticate and retrieve access token."""
    assert it_staff_token is not None
    assert elec_staff_token is not None


def test_02_student_cannot_access_staff_endpoints(student_token):
    """2. Student cannot access staff complaint endpoint (403 Forbidden)."""
    res = client.get(
        "/api/v1/staff/complaints",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert res.status_code == 403
    assert "not authorized" in res.json()["detail"].lower() or "forbidden" in res.json()["detail"].lower()


def test_03_staff_can_see_own_department_complaints(student_token, it_staff_token, elec_staff_token):
    """3 & 4. Staff sees own department complaints and cannot see other departments' complaints."""
    # Student submits 1 IT complaint and 1 Electrical complaint
    res_it = client.post(
        "/api/v1/complaints",
        headers={"Authorization": f"Bearer {student_token}"},
        json={
            "title": "Wi-Fi Router Dead in CSE Lab 1",
            "description": "The main access point in CSE Lab 1 has no power.",
            "category": "IT",
            "priority": "High",
            "location_id": 2,
        },
    )
    assert res_it.status_code == 201

    res_elec = client.post(
        "/api/v1/complaints",
        headers={"Authorization": f"Bearer {student_token}"},
        json={
            "title": "Corridor Light Flickering",
            "description": "Tube light in Main Block 2nd floor is flickering constantly.",
            "category": "Electrical",
            "priority": "Low",
            "location_id": 1,
        },
    )
    assert res_elec.status_code == 201

    # IT staff lists complaints
    it_list = client.get(
        "/api/v1/staff/complaints",
        headers={"Authorization": f"Bearer {it_staff_token}"},
    )
    assert it_list.status_code == 200
    it_items = it_list.json()
    assert len(it_items) >= 1
    # Check that all items belong to IT department (dept 1)
    for c in it_items:
        assert c["department"]["name"] == "IT"
        assert c["title"] != "Corridor Light Flickering"

    # Electrical staff lists complaints
    elec_list = client.get(
        "/api/v1/staff/complaints",
        headers={"Authorization": f"Bearer {elec_staff_token}"},
    )
    assert elec_list.status_code == 200
    elec_items = elec_list.json()
    assert len(elec_items) >= 1
    for c in elec_items:
        assert c["department"]["name"] == "Electrical"
        assert c["title"] != "Wi-Fi Router Dead in CSE Lab 1"


def test_05_staff_can_view_department_complaint_details(student_token, it_staff_token):
    """5. Staff can view details of their department's complaint including student info."""
    # Find IT complaint
    it_list = client.get(
        "/api/v1/staff/complaints",
        headers={"Authorization": f"Bearer {it_staff_token}"},
    )
    complaint_id = it_list.json()[0]["id"]

    res = client.get(
        f"/api/v1/staff/complaints/{complaint_id}",
        headers={"Authorization": f"Bearer {it_staff_token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == complaint_id
    assert data["student"] is not None
    assert data["student"]["name"] == "Alex Student"
    assert data["student"]["username"] == "alex_student"
    assert "password_hash" not in str(data)


def test_06_staff_cannot_view_another_department_complaint(elec_staff_token, it_staff_token):
    """6. Staff cannot view complaint details belonging to another department (403 Forbidden)."""
    # Get IT complaint ID
    it_list = client.get(
        "/api/v1/staff/complaints",
        headers={"Authorization": f"Bearer {it_staff_token}"},
    )
    it_complaint_id = it_list.json()[0]["id"]

    # Electrical staff attempts to view it
    res = client.get(
        f"/api/v1/staff/complaints/{it_complaint_id}",
        headers={"Authorization": f"Bearer {elec_staff_token}"},
    )
    assert res.status_code == 403
    assert "outside your department" in res.json()["detail"].lower()


def test_07_staff_can_assign_pending_complaint_to_self(it_staff_token):
    """7 & 8. Staff assigns Pending complaint to self; status becomes Assigned and audit record is created."""
    it_list = client.get(
        "/api/v1/staff/complaints?status=Pending",
        headers={"Authorization": f"Bearer {it_staff_token}"},
    )
    complaint_id = it_list.json()[0]["id"]

    # Assign
    res = client.put(
        f"/api/v1/staff/complaints/{complaint_id}/assign",
        headers={"Authorization": f"Bearer {it_staff_token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "Assigned"
    assert data["assigned_staff"] is not None
    assert data["assigned_staff"]["username"] == "john_it"

    # Verify history entry created
    db = TestingSessionLocal()
    history = (
        db.query(ComplaintUpdate)
        .filter(ComplaintUpdate.complaint_id == complaint_id)
        .order_by(ComplaintUpdate.id.desc())
        .first()
    )
    assert history.old_status == "Pending"
    assert history.new_status == "Assigned"
    assert "assigned" in history.comment.lower()
    db.close()


def test_09_staff_can_change_assigned_to_in_progress(it_staff_token):
    """9. Staff advances status from Assigned to In Progress."""
    it_list = client.get(
        "/api/v1/staff/complaints?status=Assigned",
        headers={"Authorization": f"Bearer {it_staff_token}"},
    )
    complaint_id = it_list.json()[0]["id"]

    res = client.put(
        f"/api/v1/staff/complaints/{complaint_id}/status",
        headers={"Authorization": f"Bearer {it_staff_token}"},
        json={
            "new_status": "In Progress",
            "comment": "Diagnosing the router hardware.",
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "In Progress"


def test_10_resolved_requires_non_empty_comment(it_staff_token):
    """11. Advancing status to Resolved requires a non-empty resolution comment."""
    it_list = client.get(
        "/api/v1/staff/complaints?status=In Progress",
        headers={"Authorization": f"Bearer {it_staff_token}"},
    )
    complaint_id = it_list.json()[0]["id"]

    # Attempt to resolve with empty comment -> Rejected with 400
    res_empty = client.put(
        f"/api/v1/staff/complaints/{complaint_id}/status",
        headers={"Authorization": f"Bearer {it_staff_token}"},
        json={
            "new_status": "Resolved",
            "comment": "   ",
        },
    )
    assert res_empty.status_code == 400
    assert "resolution comment is required" in res_empty.json()["detail"].lower()


def test_11_staff_can_resolve_complaint(it_staff_token):
    """10 & 14. Staff can mark complaint Resolved with a valid comment; audit log created and resolved_at set."""
    it_list = client.get(
        "/api/v1/staff/complaints?status=In Progress",
        headers={"Authorization": f"Bearer {it_staff_token}"},
    )
    complaint_id = it_list.json()[0]["id"]

    res = client.put(
        f"/api/v1/staff/complaints/{complaint_id}/status",
        headers={"Authorization": f"Bearer {it_staff_token}"},
        json={
            "new_status": "Resolved",
            "comment": "Replaced the power adapter and tested network connectivity.",
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "Resolved"
    assert data["resolved_at"] is not None

    # Verify audit history
    db = TestingSessionLocal()
    history = (
        db.query(ComplaintUpdate)
        .filter(ComplaintUpdate.complaint_id == complaint_id)
        .order_by(ComplaintUpdate.id.desc())
        .first()
    )
    assert history.old_status == "In Progress"
    assert history.new_status == "Resolved"
    assert "power adapter" in history.comment
    db.close()


def test_12_invalid_status_transitions_rejected(it_staff_token, student_token):
    """12. Invalid status transitions are rejected (e.g. Pending -> Resolved, Closed -> In Progress)."""
    # Create fresh Pending complaint
    res_fresh = client.post(
        "/api/v1/complaints",
        headers={"Authorization": f"Bearer {student_token}"},
        json={
            "title": "Monitor Cable Cut",
            "description": "VGA/HDMI cable cut in Room 204.",
            "category": "IT",
            "location_id": 2,
        },
    )
    fresh_id = res_fresh.json()["id"]

    # Try to jump from Pending directly to Resolved -> Should fail with 400
    res_invalid1 = client.put(
        f"/api/v1/staff/complaints/{fresh_id}/status",
        headers={"Authorization": f"Bearer {it_staff_token}"},
        json={"new_status": "Resolved", "comment": "Skipping to resolved"},
    )
    assert res_invalid1.status_code == 400
    assert "invalid status transition" in res_invalid1.json()["detail"].lower()

    # Try to jump from Pending directly to Closed -> Should fail with 400
    res_invalid2 = client.put(
        f"/api/v1/staff/complaints/{fresh_id}/status",
        headers={"Authorization": f"Bearer {it_staff_token}"},
        json={"new_status": "Closed", "comment": "Skipping to closed"},
    )
    assert res_invalid2.status_code == 400


def test_13_staff_cannot_modify_other_department_complaint(elec_staff_token, it_staff_token):
    """13. Staff cannot assign or update complaints outside their department."""
    it_list = client.get(
        "/api/v1/staff/complaints",
        headers={"Authorization": f"Bearer {it_staff_token}"},
    )
    it_id = it_list.json()[0]["id"]

    # Electrical staff attempts to assign IT complaint
    res_assign = client.put(
        f"/api/v1/staff/complaints/{it_id}/assign",
        headers={"Authorization": f"Bearer {elec_staff_token}"},
    )
    assert res_assign.status_code == 403

    # Electrical staff attempts to update status of IT complaint
    res_status = client.put(
        f"/api/v1/staff/complaints/{it_id}/status",
        headers={"Authorization": f"Bearer {elec_staff_token}"},
        json={"new_status": "Closed", "comment": "Unauthorized close attempt"},
    )
    assert res_status.status_code == 403


def test_14_staff_metrics_and_search_endpoint(it_staff_token):
    """14. Metrics endpoint returns accurate counts and search query filters correctly."""
    # Test metrics
    res_metrics = client.get(
        "/api/v1/staff/metrics",
        headers={"Authorization": f"Bearer {it_staff_token}"},
    )
    assert res_metrics.status_code == 200
    metrics = res_metrics.json()
    assert "total" in metrics
    assert "pending" in metrics
    assert "assigned" in metrics
    assert "in_progress" in metrics
    assert "resolved" in metrics
    assert metrics["total"] >= 1

    # Test search by title
    res_search = client.get(
        "/api/v1/staff/complaints?search=Router",
        headers={"Authorization": f"Bearer {it_staff_token}"},
    )
    assert res_search.status_code == 200
    search_results = res_search.json()
    assert len(search_results) >= 1
    assert any("Router" in item["title"] for item in search_results)
