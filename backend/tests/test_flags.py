"""Comprehensive tests for feature flags CRUD API"""
import pytest
from fastapi.testclient import TestClient


class TestCreateFlag:
    """Tests for creating feature flags"""
    
    def test_create_boolean_flag(self, client: TestClient):
        """Test creating a boolean flag"""
        response = client.post(
            "/api/flags",
            json={
                "key": "new_feature",
                "name": "New Feature",
                "description": "Enable new feature",
                "type": "boolean",
                "value": "true"
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["key"] == "new_feature"
        assert data["name"] == "New Feature"
        assert data["type"] == "boolean"
        assert data["value"] == "true"
        assert "id" in data
        assert "created_at" in data
    
    def test_create_string_flag(self, client: TestClient):
        """Test creating a string flag"""
        response = client.post(
            "/api/flags",
            json={
                "key": "api_url",
                "name": "API URL",
                "type": "string",
                "value": "https://api.example.com"
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["type"] == "string"
        assert data["value"] == "https://api.example.com"
    
    def test_create_number_flag(self, client: TestClient):
        """Test creating a number flag"""
        response = client.post(
            "/api/flags",
            json={
                "key": "max_retries",
                "name": "Max Retries",
                "type": "number",
                "value": "3"
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["type"] == "number"
        assert data["value"] == "3"
    
    def test_create_json_flag(self, client: TestClient):
        """Test creating a JSON flag"""
        response = client.post(
            "/api/flags",
            json={
                "key": "config",
                "name": "Configuration",
                "type": "json",
                "value": '{"timeout": 30, "retries": 3}'
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["type"] == "json"
    
    def test_create_duplicate_key_fails(self, client: TestClient):
        """Test that creating a flag with duplicate key fails"""
        # Create first flag
        client.post(
            "/api/flags",
            json={
                "key": "duplicate",
                "name": "First Flag",
                "type": "boolean",
                "value": "true"
            }
        )
        
        # Try to create second with same key
        response = client.post(
            "/api/flags",
            json={
                "key": "duplicate",
                "name": "Second Flag",
                "type": "boolean",
                "value": "false"
            }
        )
        
        assert response.status_code == 400
        assert "already exists" in response.json()["detail"]
    
    def test_invalid_boolean_value_fails(self, client: TestClient):
        """Test that invalid boolean value is rejected"""
        response = client.post(
            "/api/flags",
            json={
                "key": "bad_bool",
                "name": "Bad Boolean",
                "type": "boolean",
                "value": "yes"
            }
        )
        
        assert response.status_code == 400
        assert "true" in response.json()["detail"].lower()
    
    def test_invalid_number_value_fails(self, client: TestClient):
        """Test that invalid number value is rejected"""
        response = client.post(
            "/api/flags",
            json={
                "key": "bad_number",
                "name": "Bad Number",
                "type": "number",
                "value": "not-a-number"
            }
        )
        
        assert response.status_code == 400
        assert "numeric" in response.json()["detail"].lower()
    
    def test_invalid_json_value_fails(self, client: TestClient):
        """Test that invalid JSON value is rejected"""
        response = client.post(
            "/api/flags",
            json={
                "key": "bad_json",
                "name": "Bad JSON",
                "type": "json",
                "value": "{invalid json"
            }
        )
        
        assert response.status_code == 400
        assert "json" in response.json()["detail"].lower()


class TestListFlags:
    """Tests for listing feature flags"""
    
    def test_list_empty_flags(self, client: TestClient):
        """Test listing when no flags exist"""
        response = client.get("/api/flags")
        
        assert response.status_code == 200
        assert response.json() == []
    
    def test_list_multiple_flags(self, client: TestClient):
        """Test listing multiple flags"""
        # Create test flags
        for i in range(3):
            client.post(
                "/api/flags",
                json={
                    "key": f"flag_{i}",
                    "name": f"Flag {i}",
                    "type": "boolean",
                    "value": "true"
                }
            )
        
        response = client.get("/api/flags")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3
        assert all("id" in flag for flag in data)
    
    def test_list_flags_pagination(self, client: TestClient):
        """Test pagination of flag list"""
        # Create 5 flags
        for i in range(5):
            client.post(
                "/api/flags",
                json={
                    "key": f"flag_{i}",
                    "name": f"Flag {i}",
                    "type": "boolean",
                    "value": "true"
                }
            )
        
        # Get first 2
        response = client.get("/api/flags?skip=0&limit=2")
        assert response.status_code == 200
        assert len(response.json()) == 2
        
        # Get next 2
        response = client.get("/api/flags?skip=2&limit=2")
        assert response.status_code == 200
        assert len(response.json()) == 2


class TestGetFlag:
    """Tests for getting individual flags"""
    
    def test_get_flag_by_id(self, client: TestClient):
        """Test getting a flag by ID"""
        # Create a flag
        create_response = client.post(
            "/api/flags",
            json={
                "key": "test_flag",
                "name": "Test Flag",
                "type": "boolean",
                "value": "true"
            }
        )
        flag_id = create_response.json()["id"]
        
        # Get by ID
        response = client.get(f"/api/flags/{flag_id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == flag_id
        assert data["key"] == "test_flag"
    
    def test_get_flag_by_key(self, client: TestClient):
        """Test getting a flag by key"""
        # Create a flag
        client.post(
            "/api/flags",
            json={
                "key": "test_key",
                "name": "Test Flag",
                "type": "boolean",
                "value": "true"
            }
        )
        
        # Get by key
        response = client.get("/api/flags/key/test_key")
        
        assert response.status_code == 200
        data = response.json()
        assert data["key"] == "test_key"
    
    def test_get_nonexistent_flag_by_id(self, client: TestClient):
        """Test getting a non-existent flag by ID returns 404"""
        response = client.get("/api/flags/9999")
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"]
    
    def test_get_nonexistent_flag_by_key(self, client: TestClient):
        """Test getting a non-existent flag by key returns 404"""
        response = client.get("/api/flags/key/nonexistent")
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"]
    
    def test_get_flag_by_key_uses_cache(self, client: TestClient):
        """Test that getting by key uses cache on second request"""
        # Create a flag
        client.post(
            "/api/flags",
            json={
                "key": "cached_flag",
                "name": "Cached Flag",
                "type": "boolean",
                "value": "true"
            }
        )
        
        # First request (should cache)
        response1 = client.get("/api/flags/key/cached_flag")
        assert response1.status_code == 200
        
        # Second request (should use cache)
        response2 = client.get("/api/flags/key/cached_flag")
        assert response2.status_code == 200
        assert response1.json() == response2.json()


class TestUpdateFlag:
    """Tests for updating flags"""
    
    def test_update_flag_name(self, client: TestClient):
        """Test updating a flag's name"""
        # Create a flag
        create_response = client.post(
            "/api/flags",
            json={
                "key": "update_test",
                "name": "Original Name",
                "type": "boolean",
                "value": "true"
            }
        )
        flag_id = create_response.json()["id"]
        
        # Update name
        response = client.put(
            f"/api/flags/{flag_id}",
            json={"name": "Updated Name"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Name"
        assert data["key"] == "update_test"  # Should not change
    
    def test_update_flag_value(self, client: TestClient):
        """Test updating a flag's value"""
        # Create a flag
        create_response = client.post(
            "/api/flags",
            json={
                "key": "toggle",
                "name": "Toggle",
                "type": "boolean",
                "value": "false"
            }
        )
        flag_id = create_response.json()["id"]
        
        # Update value
        response = client.put(
            f"/api/flags/{flag_id}",
            json={"value": "true"}
        )
        
        assert response.status_code == 200
        assert response.json()["value"] == "true"
    
    def test_update_flag_enabled_status(self, client: TestClient):
        """Test updating a flag's enabled status"""
        # Create a flag
        create_response = client.post(
            "/api/flags",
            json={
                "key": "disable_test",
                "name": "Disable Test",
                "type": "boolean",
                "value": "true"
            }
        )
        flag_id = create_response.json()["id"]
        
        # Disable flag
        response = client.put(
            f"/api/flags/{flag_id}",
            json={"enabled": False}
        )
        
        assert response.status_code == 200
        assert response.json()["enabled"] is False
    
    def test_update_nonexistent_flag(self, client: TestClient):
        """Test updating a non-existent flag returns 404"""
        response = client.put(
            "/api/flags/9999",
            json={"name": "New Name"}
        )
        
        assert response.status_code == 404
    
    def test_update_with_invalid_value_fails(self, client: TestClient):
        """Test that updating with invalid value fails"""
        # Create a number flag
        create_response = client.post(
            "/api/flags",
            json={
                "key": "number_flag",
                "name": "Number Flag",
                "type": "number",
                "value": "42"
            }
        )
        flag_id = create_response.json()["id"]
        
        # Try to update with invalid number
        response = client.put(
            f"/api/flags/{flag_id}",
            json={"value": "not-a-number"}
        )
        
        assert response.status_code == 400


class TestDeleteFlag:
    """Tests for deleting flags"""
    
    def test_delete_flag(self, client: TestClient):
        """Test deleting a flag"""
        # Create a flag
        create_response = client.post(
            "/api/flags",
            json={
                "key": "delete_me",
                "name": "Delete Me",
                "type": "boolean",
                "value": "true"
            }
        )
        flag_id = create_response.json()["id"]
        
        # Delete it
        response = client.delete(f"/api/flags/{flag_id}")
        
        assert response.status_code == 204
        
        # Verify it's gone
        get_response = client.get(f"/api/flags/{flag_id}")
        assert get_response.status_code == 404
    
    def test_delete_nonexistent_flag(self, client: TestClient):
        """Test deleting a non-existent flag returns 404"""
        response = client.delete("/api/flags/9999")
        
        assert response.status_code == 404
    
    def test_delete_flag_invalidates_cache(self, client: TestClient):
        """Test that deleting a flag removes it from cache"""
        # Create and cache a flag
        create_response = client.post(
            "/api/flags",
            json={
                "key": "cache_delete",
                "name": "Cache Delete",
                "type": "boolean",
                "value": "true"
            }
        )
        flag_id = create_response.json()["id"]
        
        # Cache it by getting by key
        client.get("/api/flags/key/cache_delete")
        
        # Delete it
        client.delete(f"/api/flags/{flag_id}")
        
        # Try to get by key (should not use cache)
        response = client.get("/api/flags/key/cache_delete")
        assert response.status_code == 404
