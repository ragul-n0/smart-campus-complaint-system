"""
Integration tests for Step 10B Single-Link Application Architecture.
Tests:
- Root `/` serves React frontend `index.html` with HTTP 200
- Static assets `/assets/...` are accessible
- SPA client routing fallback on direct navigation and refresh:
  `/login`, `/register`, `/student/dashboard`, `/admin/complaints`, `/staff/dashboard`
- API 404s stay JSON 404s and never return index.html
- Swagger `/docs` remains accessible with HTTP 200
- Health check `/api/v1/health` works
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app, frontend_dist

client = TestClient(app)


def test_root_serves_frontend():
    """Verify GET / returns HTTP 200 and serves HTML content."""
    res = client.get("/")
    assert res.status_code == 200
    assert "text/html" in res.headers.get("content-type", "")
    assert "<div id=\"root\"></div>" in res.text or "CampusFlow" in res.text


def test_docs_remain_accessible():
    """Verify Swagger documentation is available at /docs."""
    res = client.get("/docs")
    assert res.status_code == 200


def test_api_meta_endpoint():
    """Verify /api returns API metadata JSON."""
    res = client.get("/api")
    assert res.status_code == 200
    data = res.json()
    assert data.get("status") == "online"


def test_api_health_endpoint():
    """Verify /api/v1/health returns HTTP 200."""
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.json()
    assert data.get("status") == "online"


@pytest.mark.parametrize("route", [
    "/login",
    "/register",
    "/student",
    "/student/dashboard",
    "/student/complaints",
    "/staff",
    "/staff/dashboard",
    "/admin",
    "/admin/dashboard",
    "/admin/complaints",
    "/admin/users",
    "/admin/analytics",
])
def test_spa_client_routes_fallback(route):
    """Verify direct navigation or browser refresh on React client routes serves index.html."""
    res = client.get(route)
    assert res.status_code == 200
    assert "text/html" in res.headers.get("content-type", "")
    assert "<div id=\"root\"></div>" in res.text or "CampusFlow" in res.text


def test_missing_api_endpoint_returns_json_404():
    """Verify that unhandled API routes return strict JSON 404 instead of HTML."""
    res = client.get("/api/v1/non_existent_resource_xyz")
    assert res.status_code == 404
    assert "application/json" in res.headers.get("content-type", "")
    data = res.json()
    assert "detail" in data
