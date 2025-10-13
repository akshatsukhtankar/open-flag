"""Tests for health check endpoint"""
from fastapi.testclient import TestClient


def test_health_check(client: TestClient):
    """Test health check endpoint returns healthy status"""
    response = client.get("/health")
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "openflag"
