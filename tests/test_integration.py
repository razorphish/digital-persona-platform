import pytest
import requests

@pytest.mark.integration
def test_health_endpoint(test_server):
    """Test the health endpoint with the running server."""
    response = requests.get(f"{test_server}/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"

@pytest.mark.integration
def test_auth_flow(api_client, test_user_credentials):
    """Test the complete authentication flow."""
    # Test registration
    response = api_client.post("/auth/register", json=test_user_credentials)
    print("Registration status:", response.status_code)
    print("Registration response:", response.text)
    assert response.status_code in [200, 201, 400, 422]  # 400 for validation errors, 422 means user already exists
    
    # Test login
    login_data = {
        "email": test_user_credentials["email"],
        "password": test_user_credentials["password"]
    }
    response = api_client.post("/auth/login", json=login_data)
    print("Login status:", response.status_code)
    print("Login response:", response.text)
    assert response.status_code == 200
    
    data = response.json()
    assert "access_token" in data
    token = data["access_token"]
    
    # Test authenticated endpoint
    headers = {"Authorization": f"Bearer {token}"}
    response = api_client.get("/auth/me", headers=headers)
    assert response.status_code == 200
    
    user_data = response.json()
    assert user_data["email"] == test_user_credentials["email"]

@pytest.mark.integration
def test_persona_operations(authenticated_user, api_client):
    """Test persona CRUD operations."""
    headers = authenticated_user["headers"]
    
    # Create a persona
    persona_data = {
        "name": "Test Persona",
        "description": "A test persona for integration testing",
        "personality": "Friendly and helpful",
        "relation_type": "friend"
    }
    
    response = api_client.post("/personas/", json=persona_data, headers=headers)
    assert response.status_code in [200, 201]  # Both are valid for successful creation
    
    persona = response.json()
    persona_id = persona["id"]
    
    # Get the persona
    response = api_client.get(f"/personas/{persona_id}", headers=headers)
    assert response.status_code == 200
    
    # List personas
    response = api_client.get("/personas/", headers=headers)
    assert response.status_code == 200
    personas = response.json()
    assert len(personas) > 0
    
    # Update the persona
    update_data = {
        "name": "Updated Test Persona",
        "relation_type": "friend"  # Required field
    }
    response = api_client.put(f"/personas/{persona_id}", json=update_data, headers=headers)
    print(f"Update status: {response.status_code}")
    print(f"Update response: {response.text}")
    assert response.status_code == 200
    
    # Delete the persona
    response = api_client.delete(f"/personas/{persona_id}", headers=headers)
    assert response.status_code in [200, 204]  # Both are valid for successful deletion

@pytest.mark.integration
def test_unauthorized_access(api_client):
    """Test that unauthorized access is properly rejected."""
    # Try to access protected endpoint without token
    response = api_client.get("/personas/")
    assert response.status_code in [401, 403]  # Both are valid for unauthorized access
    
    # Try with invalid token
    headers = {"Authorization": "Bearer invalid_token"}
    response = api_client.get("/personas/", headers=headers)
    assert response.status_code in [401, 403]  # Both are valid for unauthorized access

@pytest.mark.integration
def test_api_documentation(test_server):
    """Test that API documentation is accessible."""
    response = requests.get(f"{test_server}/docs")
    assert response.status_code == 200
    assert "text/html" in response.headers.get("content-type", "")

@pytest.mark.integration
def test_root_endpoint(test_server):
    """Test the root endpoint."""
    response = requests.get(f"{test_server}/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "Digital Persona Platform" in data["message"] 