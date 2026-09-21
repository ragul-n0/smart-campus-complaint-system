import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import Base, get_db
from app.core.init_db import init_db
from app.models.department import Department
from app.models.user import User

# Use an in-memory SQLite database specifically for running tests
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    # Seed initial departments
    db = TestingSessionLocal()
    depts = [
        Department(name="IT", description="Information Technology"),
        Department(name="Electrical", description="Campus Electrical Systems"),
        Department(name="Maintenance", description="Civil Works"),
        Department(name="Housekeeping", description="Sanitation"),
        Department(name="Security", description="Campus Security"),
    ]
    db.add_all(depts)
    db.commit()
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


def test_a_register_student_successfully():
    """A. Register a student successfully."""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Test Student",
            "username": "teststudent",
            "password": "Test@123",
            "role": "student",
            "department_id": None,
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test Student"
    assert data["username"] == "teststudent"
    assert data["role"] == "student"
    assert "id" in data
    # G check: ensure password_hash is not present
    assert "password_hash" not in data
    assert "password" not in data


def test_b_register_duplicate_username_rejected():
    """B. Register another user with the same username and verify it is rejected."""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Duplicate Student",
            "username": "teststudent",
            "password": "Password@456",
            "role": "student",
            "department_id": None,
        },
    )
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"].lower()


def test_c_login_correct_credentials():
    """C. Login with correct credentials."""
    response = client.post(
        "/api/v1/auth/login",
        json={
            "username": "teststudent",
            "password": "Test@123",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["username"] == "teststudent"
    assert data["user"]["role"] == "student"
    # G check: ensure password_hash is not returned in login response
    assert "password_hash" not in data["user"]
    assert "password" not in data["user"]


def test_d_login_incorrect_credentials_rejected():
    """D. Login with incorrect credentials and verify it is rejected."""
    response = client.post(
        "/api/v1/auth/login",
        json={
            "username": "teststudent",
            "password": "WrongPassword!999",
        },
    )
    assert response.status_code == 401
    assert "invalid username or password" in response.json()["detail"].lower()

    # Also test non-existent user
    non_existent = client.post(
        "/api/v1/auth/login",
        json={
            "username": "nonexistentuser",
            "password": "AnyPassword!123",
        },
    )
    assert non_existent.status_code == 401


def test_e_get_current_user_with_valid_token():
    """E. Call /api/v1/auth/me with a valid token."""
    login_res = client.post(
        "/api/v1/auth/login",
        json={"username": "teststudent", "password": "Test@123"},
    )
    token = login_res.json()["access_token"]

    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "teststudent"
    assert data["role"] == "student"
    # G check
    assert "password_hash" not in data


def test_f_get_current_user_without_token_rejected():
    """F. Call /api/v1/auth/me without a token and verify it is rejected."""
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
    assert "missing" in response.json()["detail"].lower() or "credentials" in response.json()["detail"].lower()


def test_g_verify_password_hash_never_returned():
    """G. Verify password_hash is NEVER returned across all auth endpoints."""
    # Register staff member
    res = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Staff Member",
            "username": "staffuser",
            "password": "Staff@123",
            "role": "staff",
            "department_id": 1,
        },
    )
    assert res.status_code == 201
    assert "password_hash" not in res.text
    assert res.json()["department"]["name"] == "IT"

    # Login staff
    login_res = client.post(
        "/api/v1/auth/login",
        json={"username": "staffuser", "password": "Staff@123"},
    )
    assert "password_hash" not in login_res.text

    # Me endpoint
    token = login_res.json()["access_token"]
    me_res = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert "password_hash" not in me_res.text


def test_h_role_based_dependencies_work():
    """H. Verify role-based dependencies work."""
    from fastapi import Depends
    from app.auth.dependencies import require_roles

    # Add a temporary test route protected by require_roles(["admin"])
    @app.get("/api/v1/test/admin-only")
    def admin_only_endpoint(user: User = Depends(require_roles(["admin"]))):
        return {"message": "Welcome Admin", "user": user.username}

    # Add a temporary test route protected by require_roles(["staff", "admin"])
    @app.get("/api/v1/test/staff-or-admin")
    def staff_or_admin_endpoint(user: User = Depends(require_roles(["staff", "admin"]))):
        return {"message": "Welcome Staff", "user": user.username}

    # 1. Login student
    student_token = client.post(
        "/api/v1/auth/login",
        json={"username": "teststudent", "password": "Test@123"},
    ).json()["access_token"]

    # 2. Login staff
    staff_token = client.post(
        "/api/v1/auth/login",
        json={"username": "staffuser", "password": "Staff@123"},
    ).json()["access_token"]

    # 3. Register and login admin
    client.post(
        "/api/v1/auth/register",
        json={
            "name": "Admin User",
            "username": "adminuser",
            "password": "Admin@123",
            "role": "admin",
            "department_id": None,
        },
    )
    admin_token = client.post(
        "/api/v1/auth/login",
        json={"username": "adminuser", "password": "Admin@123"},
    ).json()["access_token"]

    # Test student accessing admin-only -> should be 403 Forbidden
    res_student_admin = client.get(
        "/api/v1/test/admin-only",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert res_student_admin.status_code == 403

    # Test staff accessing admin-only -> should be 403 Forbidden
    res_staff_admin = client.get(
        "/api/v1/test/admin-only",
        headers={"Authorization": f"Bearer {staff_token}"},
    )
    assert res_staff_admin.status_code == 403

    # Test admin accessing admin-only -> should be 200 OK
    res_admin_admin = client.get(
        "/api/v1/test/admin-only",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res_admin_admin.status_code == 200
    assert res_admin_admin.json()["user"] == "adminuser"

    # Test student accessing staff-or-admin -> 403 Forbidden
    res_student_staff = client.get(
        "/api/v1/test/staff-or-admin",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert res_student_staff.status_code == 403

    # Test staff accessing staff-or-admin -> 200 OK
    res_staff_staff = client.get(
        "/api/v1/test/staff-or-admin",
        headers={"Authorization": f"Bearer {staff_token}"},
    )
    assert res_staff_staff.status_code == 200
