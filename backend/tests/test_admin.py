import os
from datetime import datetime, timezone
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

TEST_DB_PATH = "test_admin.db"
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
        Department(name="Electrical", description="Campus Electrical"),
        Department(name="Maintenance", description="Civil Works"),
        Department(name="UnusedDept", description="No complaints or users"),
    ]
    db.add_all(depts)

    # Seed locations
    locs = [
        Location(name="Main Block", description="Main block"),
        Location(name="CSE Block", description="CSE classrooms"),
        Location(name="UnusedLoc", description="No complaints"),
    ]
    db.add_all(locs)
    db.commit()
    db.close()

    old_override = app.dependency_overrides.get(get_db)
    app.dependency_overrides[get_db] = override_get_db

    # Register initial users cleanly through test client
    client.post(
        "/api/v1/auth/register",
        json={
            "name": "Super Admin",
            "username": "super_admin",
            "password": "AdminPassword@123",
            "role": "admin",
        },
    )
    client.post(
        "/api/v1/auth/register",
        json={
            "name": "Sam Student",
            "username": "sam_student",
            "password": "StudentPassword@123",
            "role": "student",
        },
    )
    client.post(
        "/api/v1/auth/register",
        json={
            "name": "Isaac IT Staff",
            "username": "isaac_it",
            "password": "StaffPassword@123",
            "role": "staff",
            "department_id": 1,
        },
    )
    client.post(
        "/api/v1/auth/register",
        json={
            "name": "Eli Electrical Staff",
            "username": "eli_elec",
            "password": "StaffPassword@123",
            "role": "staff",
            "department_id": 2,
        },
    )

    yield
    if old_override is not None:
        app.dependency_overrides[get_db] = old_override
    else:
        app.dependency_overrides.pop(get_db, None)
    Base.metadata.drop_all(bind=engine)
    if os.path.exists(TEST_DB_PATH):
        try:
            os.remove(TEST_DB_PATH)
        except OSError:
            pass


client = TestClient(app)


# Fixtures for tokens
@pytest.fixture(scope="module")
def admin_token():
    res = client.post(
        "/api/v1/auth/login",
        json={"username": "super_admin", "password": "AdminPassword@123"},
    )
    return res.json()["access_token"]


@pytest.fixture(scope="module")
def student_token():
    res = client.post(
        "/api/v1/auth/login",
        json={"username": "sam_student", "password": "StudentPassword@123"},
    )
    return res.json()["access_token"]


@pytest.fixture(scope="module")
def it_staff_token():
    res = client.post(
        "/api/v1/auth/login",
        json={"username": "isaac_it", "password": "StaffPassword@123"},
    )
    return res.json()["access_token"]


@pytest.fixture(scope="module")
def elec_staff_token():
    res = client.post(
        "/api/v1/auth/login",
        json={"username": "eli_elec", "password": "StaffPassword@123"},
    )
    return res.json()["access_token"]


# =====================================================================
# 1. AUTHORIZATION TESTS
# =====================================================================

def test_admin_metrics_access_allowed(admin_token):
    res = client.get(
        "/api/v1/admin/metrics",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert "total_complaints" in data
    assert "total_admins" in data
    assert data["total_admins"] >= 1


def test_student_forbidden_admin_access(student_token):
    res = client.get(
        "/api/v1/admin/metrics",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert res.status_code == 403
    assert "Access forbidden" in res.json()["detail"]


def test_staff_forbidden_admin_access(it_staff_token):
    res = client.get(
        "/api/v1/admin/metrics",
        headers={"Authorization": f"Bearer {it_staff_token}"},
    )
    assert res.status_code == 403
    assert "Access forbidden" in res.json()["detail"]


def test_unauthenticated_admin_access_rejected():
    res = client.get("/api/v1/admin/metrics")
    assert res.status_code == 401


# =====================================================================
# 2. METRICS & RESOLUTION ANALYTICS
# =====================================================================

def test_resolution_stats_with_no_resolved_complaints(admin_token):
    res = client.get(
        "/api/v1/admin/resolution-stats",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["avg_resolution_hours"] == 0.0
    assert data["fastest_resolution_hours"] is None
    assert data["slowest_resolution_hours"] is None


def test_department_stats_returns_all_departments(admin_token):
    res = client.get(
        "/api/v1/admin/department-stats",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    dept_names = [d["department_name"] for d in data]
    assert "IT" in dept_names
    assert "Electrical" in dept_names


# =====================================================================
# 3. USER MANAGEMENT
# =====================================================================

def test_admin_list_users_no_secrets(admin_token):
    res = client.get(
        "/api/v1/admin/users",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    users = res.json()
    assert len(users) >= 4
    for u in users:
        assert "password" not in u
        assert "password_hash" not in u
        assert "id" in u
        assert "username" in u
        assert "role" in u


def test_admin_filter_users_by_role(admin_token):
    res = client.get(
        "/api/v1/admin/users?role=staff",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    users = res.json()
    assert len(users) >= 2
    for u in users:
        assert u["role"] == "staff"


def test_admin_update_staff_department(admin_token, it_staff_token):
    # Find Isaac IT staff user ID
    users = client.get(
        "/api/v1/admin/users?search=isaac_it",
        headers={"Authorization": f"Bearer {admin_token}"},
    ).json()
    staff_user = users[0]
    staff_id = staff_user["id"]

    # Change department to Electrical (ID 2)
    res = client.put(
        f"/api/v1/admin/users/{staff_id}/department",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"department_id": 2},
    )
    assert res.status_code == 200
    assert res.json()["department_id"] == 2

    # Switch back to IT (ID 1)
    res = client.put(
        f"/api/v1/admin/users/{staff_id}/department",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"department_id": 1},
    )
    assert res.status_code == 200
    assert res.json()["department_id"] == 1


def test_staff_department_update_invalid_department(admin_token):
    users = client.get(
        "/api/v1/admin/users?search=isaac_it",
        headers={"Authorization": f"Bearer {admin_token}"},
    ).json()
    staff_id = users[0]["id"]

    res = client.put(
        f"/api/v1/admin/users/{staff_id}/department",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"department_id": 99999},
    )
    assert res.status_code == 404


def test_staff_department_update_non_staff_rejected(admin_token):
    users = client.get(
        "/api/v1/admin/users?search=sam_student",
        headers={"Authorization": f"Bearer {admin_token}"},
    ).json()
    student_id = users[0]["id"]

    res = client.put(
        f"/api/v1/admin/users/{student_id}/department",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"department_id": 1},
    )
    assert res.status_code == 400
    assert "only allowed for staff" in res.json()["detail"]


def test_update_user_role_safety(admin_token):
    # Register temporary user
    client.post(
        "/api/v1/auth/register",
        json={
            "name": "Temp Role User",
            "username": "temp_role_user",
            "password": "Password@123",
            "role": "student",
        },
    )
    user = client.get(
        "/api/v1/admin/users?search=temp_role_user",
        headers={"Authorization": f"Bearer {admin_token}"},
    ).json()[0]

    # Valid role change: student -> staff
    res = client.put(
        f"/api/v1/admin/users/{user['id']}/role",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"role": "staff"},
    )
    assert res.status_code == 200
    assert res.json()["role"] == "staff"

    # Invalid role change
    res = client.put(
        f"/api/v1/admin/users/{user['id']}/role",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"role": "superuser"},
    )
    assert res.status_code == 400


def test_cannot_demote_last_admin(admin_token):
    admin_user = client.get(
        "/api/v1/admin/users?role=admin",
        headers={"Authorization": f"Bearer {admin_token}"},
    ).json()[0]

    res = client.put(
        f"/api/v1/admin/users/{admin_user['id']}/role",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"role": "student"},
    )
    assert res.status_code == 400
    assert "Cannot remove the only remaining administrator" in res.json()["detail"]


# =====================================================================
# 4. DEPARTMENT MANAGEMENT
# =====================================================================

def test_admin_create_and_update_department(admin_token):
    # Create department
    res = client.post(
        "/api/v1/admin/departments",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"name": "Sports & Gym", "description": "Campus sports facilities"},
    )
    assert res.status_code == 201
    dept_id = res.json()["id"]
    assert res.json()["name"] == "Sports & Gym"

    # Duplicate department rejection
    dup_res = client.post(
        "/api/v1/admin/departments",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"name": "sports & gym"},
    )
    assert dup_res.status_code == 400
    assert "already exists" in dup_res.json()["detail"]

    # Update department
    update_res = client.put(
        f"/api/v1/admin/departments/{dept_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"name": "Sports Complex", "description": "Indoor and outdoor complex"},
    )
    assert update_res.status_code == 200
    assert update_res.json()["name"] == "Sports Complex"


def test_admin_safe_delete_department(admin_token):
    # Safe delete unreferenced department UnusedDept
    unused = client.get(
        "/api/v1/admin/departments",
        headers={"Authorization": f"Bearer {admin_token}"},
    ).json()
    unused_dept = next(d for d in unused if d["name"] == "UnusedDept")

    res = client.delete(
        f"/api/v1/admin/departments/{unused_dept['id']}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200

    # Unsafe delete IT department (has staff assigned)
    it_dept = next(d for d in unused if d["name"] == "IT")
    unsafe_res = client.delete(
        f"/api/v1/admin/departments/{it_dept['id']}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert unsafe_res.status_code == 400
    assert "Cannot delete department" in unsafe_res.json()["detail"]


# =====================================================================
# 5. LOCATION MANAGEMENT
# =====================================================================

def test_admin_create_and_update_location(admin_token):
    # Create location
    res = client.post(
        "/api/v1/admin/locations",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"name": "Auditorium", "description": "Central auditorium"},
    )
    assert res.status_code == 201
    loc_id = res.json()["id"]

    # Duplicate rejection
    dup_res = client.post(
        "/api/v1/admin/locations",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"name": "auditorium"},
    )
    assert dup_res.status_code == 400

    # Update location
    update_res = client.put(
        f"/api/v1/admin/locations/{loc_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"name": "Main Auditorium", "description": "Updated"},
    )
    assert update_res.status_code == 200
    assert update_res.json()["name"] == "Main Auditorium"


def test_admin_delete_location(admin_token):
    locations = client.get(
        "/api/v1/admin/locations",
        headers={"Authorization": f"Bearer {admin_token}"},
    ).json()
    unused_loc = next(loc for loc in locations if loc["name"] == "UnusedLoc")

    res = client.delete(
        f"/api/v1/admin/locations/{unused_loc['id']}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200


# =====================================================================
# 6. COMPLAINTS OVERSIGHT & ACTIONS
# =====================================================================

def test_admin_complaints_oversight_and_actions(
    admin_token, student_token, it_staff_token, elec_staff_token
):
    # 1. Student creates a complaint
    c_res = client.post(
        "/api/v1/complaints",
        headers={"Authorization": f"Bearer {student_token}"},
        json={
            "title": "Wi-Fi Router Broken in Room 204",
            "description": "The Wi-Fi router in CSE block room 204 is completely offline.",
            "category": "IT",
            "priority": "Medium",
            "location_id": 2,  # CSE Block
        },
    )
    assert c_res.status_code == 201
    complaint_id = c_res.json()["id"]

    # 2. Admin views all complaints
    all_complaints = client.get(
        "/api/v1/admin/complaints",
        headers={"Authorization": f"Bearer {admin_token}"},
    ).json()
    assert len(all_complaints) >= 1
    found = next(c for c in all_complaints if c["id"] == complaint_id)
    assert found["title"] == "Wi-Fi Router Broken in Room 204"

    # 3. Admin views complaint details
    detail_res = client.get(
        f"/api/v1/admin/complaints/{complaint_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert len(detail["updates"]) >= 1

    # 4. Admin tries to assign wrong-department staff (Electrical staff to IT complaint) -> Rejected
    elec_staff = client.get(
        "/api/v1/admin/users?search=eli_elec",
        headers={"Authorization": f"Bearer {admin_token}"},
    ).json()[0]

    wrong_assign = client.put(
        f"/api/v1/admin/complaints/{complaint_id}/assign",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"staff_id": elec_staff["id"]},
    )
    assert wrong_assign.status_code == 400
    assert "Department mismatch" in wrong_assign.json()["detail"]

    # 5. Admin assigns correct IT staff member
    it_staff = client.get(
        "/api/v1/admin/users?search=isaac_it",
        headers={"Authorization": f"Bearer {admin_token}"},
    ).json()[0]

    right_assign = client.put(
        f"/api/v1/admin/complaints/{complaint_id}/assign",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"staff_id": it_staff["id"]},
    )
    assert right_assign.status_code == 200
    assert right_assign.json()["status"] == "Assigned"
    assert right_assign.json()["assigned_staff_id"] == it_staff["id"]

    # 6. Admin updates priority to High
    prio_res = client.put(
        f"/api/v1/admin/complaints/{complaint_id}/priority",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"priority": "High"},
    )
    assert prio_res.status_code == 200
    assert prio_res.json()["priority"] == "High"

    # 7. Admin updates department to Electrical -> Clears previous IT staff assignment
    dept_res = client.put(
        f"/api/v1/admin/complaints/{complaint_id}/department",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"department_id": 2},  # Electrical
    )
    assert dept_res.status_code == 200
    assert dept_res.json()["department_id"] == 2
    assert dept_res.json()["assigned_staff_id"] is None
    assert dept_res.json()["status"] == "Pending"

    # 8. Admin updates status to In Progress, then Resolved
    client.put(
        f"/api/v1/admin/complaints/{complaint_id}/status",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"new_status": "In Progress", "comment": "Admin started investigation"},
    )
    resolved_res = client.put(
        f"/api/v1/admin/complaints/{complaint_id}/status",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"new_status": "Resolved", "comment": "Admin confirmed electrical issue fixed"},
    )
    assert resolved_res.status_code == 200
    assert resolved_res.json()["status"] == "Resolved"
    assert resolved_res.json()["resolved_at"] is not None

    # 9. Verify Resolution stats now reflect the resolved complaint
    res_stats = client.get(
        "/api/v1/admin/resolution-stats",
        headers={"Authorization": f"Bearer {admin_token}"},
    ).json()
    assert res_stats["total_resolved"] >= 1
    assert res_stats["avg_resolution_hours"] is not None

    # 10. Check that Location deletion is prevented now that a complaint references location 2
    del_loc_res = client.delete(
        "/api/v1/admin/locations/2",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert del_loc_res.status_code == 400
    assert "Cannot delete location" in del_loc_res.json()["detail"]
