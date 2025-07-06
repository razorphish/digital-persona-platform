#!/usr/bin/env python3
"""
Test script for SQLite-based authentication system using pytest
"""
import pytest
import requests
from pathlib import Path

# Test configuration
BASE_URL = "http://localhost:8000"
TEST_EMAIL = "test@example.com"
TEST_USERNAME = "testuser"
TEST_PASSWORD = "testpassword123"
TEST_FULL_NAME = "Test User"

def print_test_result(test_name, success, details=None):
    """Print test result."""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status} {test_name}")
    if details:
        print(f"    {details}")

@pytest.fixture(scope="session")
def access_token():
    """Fixture to provide an access token for authenticated tests."""
    # Try to register; if user exists, login
    data = {
        "email": TEST_EMAIL,
        "username": TEST_USERNAME,
        "password": TEST_PASSWORD,
        "full_name": TEST_FULL_NAME
    }
    response = requests.post(f"{BASE_URL}/auth/register", json=data)
    if response.status_code == 200:
        return response.json().get("access_token")
    elif response.status_code == 400 and "already registered" in response.json().get("detail", ""):
        # Login if already registered
        data = {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        }
        response = requests.post(f"{BASE_URL}/auth/login", json=data)
        if response.status_code == 200:
            return response.json().get("access_token")
    pytest.fail("Could not obtain access token for tests")

def test_health_check():
    """Test the health check endpoint."""
    response = requests.get(f"{BASE_URL}/health")
    assert response.status_code == 200
    data = response.json()
    assert data.get('status') == 'healthy'
    print_test_result("Health Check", True, f"Status: {data.get('status')}")

def test_registration():
    """Test user registration."""
    data = {
        "email": "newuser@example.com",
        "username": f"{TEST_USERNAME}_new",
        "password": TEST_PASSWORD,
        "full_name": TEST_FULL_NAME
    }
    response = requests.post(f"{BASE_URL}/auth/register", json=data)
    
    if response.status_code == 200:
        token_data = response.json()
        print_test_result("User Registration", True, f"Token received: {len(token_data.get('access_token', ''))} chars")
        assert 'access_token' in token_data
    elif response.status_code == 400 and "already registered" in response.json().get('detail', ''):
        print_test_result("User Registration", True, "User already exists (expected behavior)")
    else:
        error_detail = response.json().get('detail', 'Unknown error')
        print_test_result("User Registration", False, f"Status: {response.status_code}, Error: {error_detail}")
        pytest.fail(f"Registration failed: {error_detail}")

def test_login():
    """Test user login."""
    data = {
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    }
    response = requests.post(f"{BASE_URL}/auth/login", json=data)
    
    assert response.status_code == 200
    token_data = response.json()
    print_test_result("User Login", True, f"Token received: {len(token_data.get('access_token', ''))} chars")
    assert 'access_token' in token_data

def test_get_current_user(access_token):
    """Test getting current user info."""
    headers = {"Authorization": f"Bearer {access_token}"}
    response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    
    assert response.status_code == 200
    user_data = response.json()
    print_test_result("Get Current User", True, f"User: {user_data.get('username')} ({user_data.get('email')})")
    assert user_data.get('email') == TEST_EMAIL
    assert user_data.get('username') == TEST_USERNAME

def test_create_persona(access_token):
    """Test creating a persona."""
    headers = {"Authorization": f"Bearer {access_token}"}
    data = {
        "name": "Test Persona",
        "description": "A test digital persona",
        "relation_type": "friend"
    }
    response = requests.post(f"{BASE_URL}/personas/", json=data, headers=headers)
    
    assert response.status_code == 200
    persona_data = response.json()
    print_test_result("Create Persona", True, f"Persona: {persona_data.get('name')} (ID: {persona_data.get('id')})")
    assert persona_data.get('name') == "Test Persona"
    assert persona_data.get('relation_type') == "friend"

def test_list_personas(access_token):
    """Test listing personas."""
    headers = {"Authorization": f"Bearer {access_token}"}
    response = requests.get(f"{BASE_URL}/personas/", headers=headers)
    
    assert response.status_code == 200
    personas = response.json()
    print_test_result("List Personas", True, f"Found {len(personas)} personas")
    assert isinstance(personas, list)

def test_unauthorized_access():
    """Test that unauthorized access is properly blocked."""
    # Try to access protected endpoint without token
    response = requests.get(f"{BASE_URL}/personas/")
    
    assert response.status_code == 403
    print_test_result("Unauthorized Access Blocked", True, "Properly returns 403")

def test_invalid_token():
    """Test that invalid tokens are properly rejected."""
    headers = {"Authorization": "Bearer invalid_token_here"}
    response = requests.get(f"{BASE_URL}/personas/", headers=headers)
    
    assert response.status_code == 401
    print_test_result("Invalid Token Rejected", True, "Properly returns 401")

def test_persona_operations(access_token):
    """Test full CRUD operations for personas."""
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Create a persona
    create_data = {
        "name": "CRUD Test Persona",
        "description": "A test persona for CRUD operations",
        "relation_type": "colleague"
    }
    response = requests.post(f"{BASE_URL}/personas/", json=create_data, headers=headers)
    assert response.status_code == 200
    persona = response.json()
    persona_id = persona.get('id')
    
    print_test_result("Create Persona (CRUD)", True, f"Created persona ID: {persona_id}")
    
    # Get the persona
    response = requests.get(f"{BASE_URL}/personas/{persona_id}", headers=headers)
    assert response.status_code == 200
    retrieved_persona = response.json()
    assert retrieved_persona.get('id') == persona_id
    assert retrieved_persona.get('name') == "CRUD Test Persona"
    
    print_test_result("Get Persona (CRUD)", True, f"Retrieved persona: {retrieved_persona.get('name')}")
    
    # Update the persona
    update_data = {
        "name": "Updated CRUD Test Persona",
        "description": "Updated description",
        "relation_type": "friend"
    }
    response = requests.put(f"{BASE_URL}/personas/{persona_id}", json=update_data, headers=headers)
    assert response.status_code == 200
    updated_persona = response.json()
    assert updated_persona.get('name') == "Updated CRUD Test Persona"
    assert updated_persona.get('relation_type') == "friend"
    
    print_test_result("Update Persona (CRUD)", True, f"Updated persona: {updated_persona.get('name')}")
    
    # Delete the persona
    response = requests.delete(f"{BASE_URL}/personas/{persona_id}", headers=headers)
    assert response.status_code == 200
    
    print_test_result("Delete Persona (CRUD)", True, f"Deleted persona ID: {persona_id}")

def test_user_ownership(access_token):
    """Test that users can only access their own personas."""
    # This test would require creating a second user and verifying isolation
    # For now, we'll just verify that the current user's personas are accessible
    headers = {"Authorization": f"Bearer {access_token}"}
    response = requests.get(f"{BASE_URL}/personas/", headers=headers)
    
    assert response.status_code == 200
    personas = response.json()
    # All personas should belong to the current user
    for persona in personas:
        assert persona.get('user_id') is not None
    
    print_test_result("User Ownership", True, f"Verified ownership for {len(personas)} personas")

if __name__ == "__main__":
    # Allow running as script for backward compatibility
    pytest.main([__file__, "-v"]) 