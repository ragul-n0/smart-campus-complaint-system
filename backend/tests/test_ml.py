"""
Unit and Integration Tests for Machine Learning Prediction & Safety Workflows.
Tests:
- ML Service cached inference
- Step 8C vs Step 8B version loading
- Robustness against empty/malformed text
- POST /api/v1/complaints/predict endpoint
- Automatic category detection on complaint submission when category is omitted
- Fallback handling and zero-crash guarantee
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.core.database import Base, get_db
from app.models.location import Location
from app.models.department import Department
from app.models.user import User
from app.services.ml_service import ml_service, ComplaintMLService

TEST_DB_PATH = "test_ml.db"
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
    import os
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
        Department(name="Maintenance", description="Civil & Maintenance"),
        Department(name="Housekeeping", description="Sanitation"),
        Department(name="Security", description="Campus Security"),
    ]
    db.add_all(depts)

    # Seed location
    loc = Location(name="Main Tech Block", description="Academic laboratories")
    db.add(loc)
    db.commit()
    db.close()

    app.dependency_overrides[get_db] = override_get_db
    yield
    app.dependency_overrides.clear()
    if os.path.exists(TEST_DB_PATH):
        try:
            os.remove(TEST_DB_PATH)
        except OSError:
            pass


@pytest.fixture(scope="module")
def client():
    return TestClient(app)


@pytest.fixture(scope="module")
def student_token(client):
    from app.auth.security import hash_password
    db = TestingSessionLocal()
    student = User(
        username="ml_student_tester",
        name="ML Tester",
        password_hash=hash_password("Student@123"),
        role="student",
    )
    db.add(student)
    db.commit()
    db.close()

    res = client.post(
        "/api/v1/auth/login",
        json={"username": "ml_student_tester", "password": "Student@123"},
    )
    return res.json()["access_token"]


# -------------------------------------------------------------
# Service Unit Tests
# -------------------------------------------------------------

def test_ml_service_is_ready():
    assert ml_service.is_ready() is True


def test_ml_service_predict_it():
    res = ml_service.predict("WiFi in computer science lab keeps dropping connection.")
    assert res["predicted_category"] == "IT"
    assert res["category_confidence"] > 0.15
    assert res["active"] is True
    assert res["model_version"] in ["step8c", "step8b"]


def test_ml_service_predict_electrical():
    res = ml_service.predict("Ceiling fan regulator sparking and smoking.")
    assert res["predicted_category"] == "Electrical"
    assert res["active"] is True


def test_ml_service_predict_plumbing():
    res = ml_service.predict("Water is heavily leaking from the bathroom pipe.")
    assert res["predicted_category"] == "Plumbing"
    assert res["active"] is True


def test_ml_service_empty_text_safety():
    res = ml_service.predict("")
    assert res["predicted_category"] == "Other"
    assert res["is_low_confidence"] is True
    assert res["category_confidence"] == 0.0


def test_ml_service_version_selection():
    res_8c = ml_service.predict("Broken classroom chair", category_version="step8c")
    res_8b = ml_service.predict("Broken classroom chair", category_version="step8b")
    assert res_8c["model_version"] == "step8c"
    assert res_8b["model_version"] == "step8b"


# -------------------------------------------------------------
# Endpoint Integration Tests
# -------------------------------------------------------------

def test_predict_endpoint_authenticated(client, student_token):
    res = client.post(
        "/api/v1/complaints/predict",
        headers={"Authorization": f"Bearer {student_token}"},
        json={"title": "WiFi Problem", "description": "Cannot connect to campus wifi in library"},
    )
    assert res.status_code == 200
    data = res.json()
    assert "predicted_category" in data
    assert "category_confidence" in data
    assert "is_low_confidence" in data
    assert "predicted_priority" in data
    assert data["predicted_category"] == "IT"


def test_predict_endpoint_unauthenticated(client):
    res = client.post(
        "/api/v1/complaints/predict",
        json={"text": "WiFi issue"},
    )
    assert res.status_code == 401


def test_predict_endpoint_empty_payload(client, student_token):
    res = client.post(
        "/api/v1/complaints/predict",
        headers={"Authorization": f"Bearer {student_token}"},
        json={},
    )
    assert res.status_code == 422


def test_complaint_submission_with_auto_detected_category(client, student_token):
    db = TestingSessionLocal()
    loc = db.query(Location).first()
    db.close()

    # Submit complaint WITHOUT category
    res = client.post(
        "/api/v1/complaints",
        headers={"Authorization": f"Bearer {student_token}"},
        json={
            "title": "Broken pipe spraying water in washroom",
            "description": "Urgent water pipe burst flooding the entire ground floor restroom corridor.",
            "location_id": loc.id,
        },
    )
    assert res.status_code == 201
    data = res.json()
    # Auto-detected as Plumbing
    assert data["category"] == "Plumbing"
    assert data["department"]["name"] == "Maintenance"  # Plumbing routes to Maintenance


def test_complaint_submission_with_ml_failure_simulation(client, student_token):
    from unittest.mock import patch
    db = TestingSessionLocal()
    loc = db.query(Location).first()
    db.close()

    # Mock ML service to raise an exception during inference
    with patch("app.api.v1.endpoints.complaints.ml_service.predict", side_effect=RuntimeError("Simulated inference crash")):
        res = client.post(
            "/api/v1/complaints",
            headers={"Authorization": f"Bearer {student_token}"},
            json={
                "title": "Air conditioning unit leaking water",
                "description": "The AC unit in the laboratory is leaking droplets onto electrical desks.",
                "location_id": loc.id,
            },
        )
        assert res.status_code == 201
        data = res.json()
        assert data["id"] is not None
        # Safe fallback triggered without crashing or losing the complaint
        assert data["category"] == "Other"
        assert data["status"] == "Pending"

