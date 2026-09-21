import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.core.database import Base, get_db
from app.models.department import Department
from app.models.location import Location
from app.models.complaint import Complaint
from app.models.complaint_update import ComplaintUpdate

TEST_DB_PATH = "test_complaints.db"
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
    # Clean up prior test db if left over
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
        Location(name="Hostel", description="Student dormitories"),
        Location(name="Cafeteria", description="Campus cafeteria"),
    ]
    db.add_all(locs)
    db.commit()
    db.close()

    # Apply override for this module
    app.dependency_overrides[get_db] = override_get_db
    yield
    # Cleanup override and database
    app.dependency_overrides.pop(get_db, None)
    Base.metadata.drop_all(bind=engine)
    if os.path.exists(TEST_DB_PATH):
        try:
            os.remove(TEST_DB_PATH)
        except OSError:
            pass


client = TestClient(app)


# Helper fixtures/tokens
@pytest.fixture(scope="module")
def student_a_token():
    client.post(
        "/api/v1/auth/register",
        json={
            "name": "Student Alpha",
            "username": "student_alpha",
            "password": "Password@123",
            "role": "student",
        },
    )
    res = client.post(
        "/api/v1/auth/login",
        json={"username": "student_alpha", "password": "Password@123"},
    )
    return res.json()["access_token"]


@pytest.fixture(scope="module")
def student_b_token():
    client.post(
        "/api/v1/auth/register",
        json={
            "name": "Student Beta",
            "username": "student_beta",
            "password": "Password@456",
            "role": "student",
        },
    )
    res = client.post(
        "/api/v1/auth/login",
        json={"username": "student_beta", "password": "Password@456"},
    )
    return res.json()["access_token"]


def test_11_location_endpoint_works(student_a_token):
    """11. Location endpoint returns seeded campus locations for authenticated user."""
    res = client.get(
        "/api/v1/locations",
        headers={"Authorization": f"Bearer {student_a_token}"},
    )
    assert res.status_code == 200
    locations = res.json()
    assert len(locations) >= 4
    names = [loc["name"] for loc in locations]
    assert "CSE Block" in names
    assert "Main Block" in names


def test_01_student_can_create_complaint(student_a_token):
    """1. Student can create complaint with automatic department resolution."""
    db = TestingSessionLocal()
    cse_loc = db.query(Location).filter(Location.name == "CSE Block").first()
    db.close()

    res = client.post(
        "/api/v1/complaints",
        headers={"Authorization": f"Bearer {student_a_token}"},
        json={
            "title": "Ceiling fan not working",
            "description": "The ceiling fan in CSE Lab 2 is making grinding noise and stopped.",
            "category": "Electrical",
            "priority": "High",
            "location_id": cse_loc.id,
        },
    )
    assert res.status_code == 201
    data = res.json()
    assert data["title"] == "Ceiling fan not working"
    assert data["category"] == "Electrical"
    assert data["priority"] == "High"
    assert data["status"] == "Pending"
    assert data["location_id"] == cse_loc.id
    # Verify automatic department mapping: Electrical -> Electrical
    assert data["department_id"] is not None
    assert data["department"]["name"] == "Electrical"
    assert "id" in data


def test_02_complaint_gets_status_pending(student_a_token):
    """2. Complaint automatically gets status Pending on creation."""
    db = TestingSessionLocal()
    main_loc = db.query(Location).filter(Location.name == "Main Block").first()
    db.close()

    res = client.post(
        "/api/v1/complaints",
        headers={"Authorization": f"Bearer {student_a_token}"},
        json={
            "title": "Projector HDMI cable broken",
            "description": "The projector in Room 301 has a broken HDMI pin.",
            "category": "IT",
            "priority": "Low",
            "location_id": main_loc.id,
        },
    )
    assert res.status_code == 201
    assert res.json()["status"] == "Pending"
    assert res.json()["department"]["name"] == "IT"


def test_03_complaint_gets_default_priority_if_omitted(student_a_token):
    """3. Complaint gets default priority 'Medium' when omitted in request."""
    db = TestingSessionLocal()
    main_loc = db.query(Location).filter(Location.name == "Main Block").first()
    db.close()

    res = client.post(
        "/api/v1/complaints",
        headers={"Authorization": f"Bearer {student_a_token}"},
        json={
            "title": "Water leakage in washroom",
            "description": "There is a pipe leak near the 2nd floor restroom.",
            "category": "Plumbing",
            "location_id": main_loc.id,
        },
    )
    assert res.status_code == 201
    data = res.json()
    assert data["priority"] == "Medium"
    # Plumbing maps to Maintenance department
    assert data["department"]["name"] == "Maintenance"


def test_04_student_can_list_own_complaints(student_a_token, student_b_token):
    """4. Student can list own complaints, sorted newest first, and cannot see others'."""
    db = TestingSessionLocal()
    lib_loc = db.query(Location).filter(Location.name == "Library").first()
    db.close()

    # Create complaint by Student B
    client.post(
        "/api/v1/complaints",
        headers={"Authorization": f"Bearer {student_b_token}"},
        json={
            "title": "Student B Issue",
            "description": "Private issue submitted by student B.",
            "category": "Maintenance",
            "location_id": lib_loc.id,
        },
    )

    # Student A lists complaints
    res_a = client.get(
        "/api/v1/complaints",
        headers={"Authorization": f"Bearer {student_a_token}"},
    )
    assert res_a.status_code == 200
    complaints_a = res_a.json()
    assert len(complaints_a) >= 3
    # Check that none belong to Student B
    for item in complaints_a:
        assert item["title"] != "Student B Issue"

    # Verify order: newest first
    dates = [item["created_at"] for item in complaints_a]
    assert dates == sorted(dates, reverse=True)


def test_05_student_can_view_own_complaint(student_a_token):
    """5. Student can view own complaint details."""
    list_res = client.get(
        "/api/v1/complaints",
        headers={"Authorization": f"Bearer {student_a_token}"},
    )
    first_id = list_res.json()[0]["id"]

    res = client.get(
        f"/api/v1/complaints/{first_id}",
        headers={"Authorization": f"Bearer {student_a_token}"},
    )
    assert res.status_code == 200
    assert res.json()["id"] == first_id


def test_06_student_cannot_view_another_student_complaint(student_a_token, student_b_token):
    """6. Student cannot view another student's complaint (returns 403 Forbidden)."""
    db = TestingSessionLocal()
    hostel_loc = db.query(Location).filter(Location.name == "Hostel").first()
    db.close()

    # Student B creates a complaint
    create_b = client.post(
        "/api/v1/complaints",
        headers={"Authorization": f"Bearer {student_b_token}"},
        json={
            "title": "Beta Secret Complaint",
            "description": "Only student B should see this.",
            "category": "Security",
            "location_id": hostel_loc.id,
        },
    )
    complaint_b_id = create_b.json()["id"]

    # Student A attempts to access complaint_b_id
    res = client.get(
        f"/api/v1/complaints/{complaint_b_id}",
        headers={"Authorization": f"Bearer {student_a_token}"},
    )
    assert res.status_code == 403
    assert "not authorized" in res.json()["detail"].lower() or "forbidden" in res.json()["detail"].lower()


def test_07_student_can_edit_pending_complaint(student_a_token):
    """7. Student can edit their own Pending complaint."""
    db = TestingSessionLocal()
    main_loc = db.query(Location).filter(Location.name == "Main Block").first()
    db.close()

    # Create complaint
    create_res = client.post(
        "/api/v1/complaints",
        headers={"Authorization": f"Bearer {student_a_token}"},
        json={
            "title": "Typo in title here",
            "description": "Description details.",
            "category": "Housekeeping",
            "location_id": main_loc.id,
        },
    )
    cid = create_res.json()["id"]

    # Edit
    edit_res = client.put(
        f"/api/v1/complaints/{cid}",
        headers={"Authorization": f"Bearer {student_a_token}"},
        json={
            "title": "Corrected title",
            "description": "Updated detailed description.",
            "priority": "High",
        },
    )
    assert edit_res.status_code == 200
    updated = edit_res.json()
    assert updated["title"] == "Corrected title"
    assert updated["description"] == "Updated detailed description."
    assert updated["priority"] == "High"


def test_08_student_cannot_edit_assigned_complaint(student_a_token):
    """8. Student cannot edit a complaint once status is Assigned / In Progress."""
    db = TestingSessionLocal()
    main_loc = db.query(Location).filter(Location.name == "Main Block").first()
    db.close()

    create_res = client.post(
        "/api/v1/complaints",
        headers={"Authorization": f"Bearer {student_a_token}"},
        json={
            "title": "Will be assigned soon",
            "description": "Testing edit prohibition after assignment.",
            "category": "IT",
            "location_id": main_loc.id,
        },
    )
    cid = create_res.json()["id"]

    # Advance status to 'Assigned' directly in DB
    db = TestingSessionLocal()
    comp = db.query(Complaint).filter(Complaint.id == cid).first()
    comp.status = "Assigned"
    db.commit()
    db.close()

    # Student tries to edit -> rejected with 400 Bad Request
    res = client.put(
        f"/api/v1/complaints/{cid}",
        headers={"Authorization": f"Bearer {student_a_token}"},
        json={"title": "Illegal edit attempt"},
    )
    assert res.status_code == 400
    assert "cannot edit" in res.json()["detail"].lower() or "pending" in res.json()["detail"].lower()


def test_09_student_can_delete_pending_complaint(student_a_token):
    """9. Student can delete a Pending complaint."""
    db = TestingSessionLocal()
    main_loc = db.query(Location).filter(Location.name == "Main Block").first()
    db.close()

    create_res = client.post(
        "/api/v1/complaints",
        headers={"Authorization": f"Bearer {student_a_token}"},
        json={
            "title": "Delete me soon",
            "description": "Mistaken complaint.",
            "category": "Furniture",
            "location_id": main_loc.id,
        },
    )
    cid = create_res.json()["id"]

    # Delete
    del_res = client.delete(
        f"/api/v1/complaints/{cid}",
        headers={"Authorization": f"Bearer {student_a_token}"},
    )
    assert del_res.status_code == 200

    # Verify it is gone
    get_res = client.get(
        f"/api/v1/complaints/{cid}",
        headers={"Authorization": f"Bearer {student_a_token}"},
    )
    assert get_res.status_code == 404


def test_10_student_cannot_delete_assigned_complaint(student_a_token):
    """10. Student cannot delete a complaint once status is no longer Pending."""
    db = TestingSessionLocal()
    main_loc = db.query(Location).filter(Location.name == "Main Block").first()
    db.close()

    create_res = client.post(
        "/api/v1/complaints",
        headers={"Authorization": f"Bearer {student_a_token}"},
        json={
            "title": "Will be in progress",
            "description": "Testing delete restriction.",
            "category": "IT",
            "location_id": main_loc.id,
        },
    )
    cid = create_res.json()["id"]

    # Advance status in DB to 'In Progress'
    db = TestingSessionLocal()
    comp = db.query(Complaint).filter(Complaint.id == cid).first()
    comp.status = "In Progress"
    db.commit()
    db.close()

    # Delete attempt -> should fail with 400
    del_res = client.delete(
        f"/api/v1/complaints/{cid}",
        headers={"Authorization": f"Bearer {student_a_token}"},
    )
    assert del_res.status_code == 400
    assert "cannot delete" in del_res.json()["detail"].lower() or "pending" in del_res.json()["detail"].lower()


def test_12_complaint_history_is_created(student_a_token):
    """12. Initial history is automatically recorded and accessible."""
    db = TestingSessionLocal()
    cse_loc = db.query(Location).filter(Location.name == "CSE Block").first()
    db.close()

    create_res = client.post(
        "/api/v1/complaints",
        headers={"Authorization": f"Bearer {student_a_token}"},
        json={
            "title": "History test issue",
            "description": "Testing that history is created on submission.",
            "category": "Security",
            "location_id": cse_loc.id,
        },
    )
    cid = create_res.json()["id"]

    # Fetch history
    hist_res = client.get(
        f"/api/v1/complaints/{cid}/history",
        headers={"Authorization": f"Bearer {student_a_token}"},
    )
    assert hist_res.status_code == 200
    history = hist_res.json()
    assert len(history) == 1
    assert history[0]["old_status"] is None
    assert history[0]["new_status"] == "Pending"
    assert history[0]["comment"] == "Complaint submitted"


def test_13_unauthorized_requests_rejected():
    """13. Unauthenticated requests are rejected with 401."""
    # GET complaints without token
    res_list = client.get("/api/v1/complaints")
    assert res_list.status_code == 401

    # POST complaint without token
    res_post = client.post("/api/v1/complaints", json={"title": "No token"})
    assert res_post.status_code == 401

    # GET locations without token
    res_loc = client.get("/api/v1/locations")
    assert res_loc.status_code == 401


def test_14_complaint_validation_errors(student_a_token):
    """14. Title/description length validations and invalid location reject appropriately."""
    # Missing/too short title
    res1 = client.post(
        "/api/v1/complaints",
        headers={"Authorization": f"Bearer {student_a_token}"},
        json={
            "title": "a",
            "description": "Valid description length here.",
            "category": "IT",
            "location_id": 1,
        },
    )
    assert res1.status_code == 422

    # Non-existent location
    res2 = client.post(
        "/api/v1/complaints",
        headers={"Authorization": f"Bearer {student_a_token}"},
        json={
            "title": "Valid title text",
            "description": "Valid description length here.",
            "category": "IT",
            "location_id": 999999,
        },
    )
    assert res2.status_code == 404
