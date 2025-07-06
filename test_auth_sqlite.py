#!/usr/bin/env python3
"""
Test script for SQLite-based authentication system
"""
import asyncio
import os
import sys
import requests
import json
from pathlib import Path

# Add the app directory to the path
sys.path.append(str(Path(__file__).parent / "app"))

# Test configuration
BASE_URL = "http://localhost:8000"
TEST_EMAIL = "test@example.com"
TEST_USERNAME = "testuser"
TEST_PASSWORD = "testpassword123"
TEST_FULL_NAME = "Test User"

def print_section(title):
    """Print a section header."""
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")

def print_test_result(test_name, success, details=None):
    """Print test result."""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status} {test_name}")
    if details:
        print(f"    {details}")

def test_health_check():
    """Test the health check endpoint."""
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            data = response.json()
            print_test_result("Health Check", True, f"Status: {data.get('status')}")
            return True
        else:
            print_test_result("Health Check", False, f"Status code: {response.status_code}")
            return False
    except Exception as e:
        print_test_result("Health Check", False, f"Error: {str(e)}")
        return False

def test_registration():
    """Test user registration."""
    try:
        data = {
            "email": TEST_EMAIL,
            "username": TEST_USERNAME,
            "password": TEST_PASSWORD,
            "full_name": TEST_FULL_NAME
        }
        response = requests.post(f"{BASE_URL}/auth/register", json=data)
        
        if response.status_code == 200:
            token_data = response.json()
            print_test_result("User Registration", True, f"Token received: {len(token_data.get('access_token', ''))} chars")
            return token_data.get('access_token')
        elif response.status_code == 400 and "already registered" in response.json().get('detail', ''):
            print_test_result("User Registration", True, "User already exists (expected behavior)")
            return "user_exists"
        else:
            error_detail = response.json().get('detail', 'Unknown error')
            print_test_result("User Registration", False, f"Status: {response.status_code}, Error: {error_detail}")
            return None
    except Exception as e:
        print_test_result("User Registration", False, f"Error: {str(e)}")
        return None

def test_login():
    """Test user login."""
    try:
        data = {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        }
        response = requests.post(f"{BASE_URL}/auth/login", json=data)
        
        if response.status_code == 200:
            token_data = response.json()
            print_test_result("User Login", True, f"Token received: {len(token_data.get('access_token', ''))} chars")
            return token_data.get('access_token')
        else:
            error_detail = response.json().get('detail', 'Unknown error')
            print_test_result("User Login", False, f"Status: {response.status_code}, Error: {error_detail}")
            return None
    except Exception as e:
        print_test_result("User Login", False, f"Error: {str(e)}")
        return None

def test_get_current_user(access_token):
    """Test getting current user info."""
    try:
        headers = {"Authorization": f"Bearer {access_token}"}
        response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
        
        if response.status_code == 200:
            user_data = response.json()
            print_test_result("Get Current User", True, f"User: {user_data.get('username')} ({user_data.get('email')})")
            return user_data
        else:
            error_detail = response.json().get('detail', 'Unknown error')
            print_test_result("Get Current User", False, f"Status: {response.status_code}, Error: {error_detail}")
            return None
    except Exception as e:
        print_test_result("Get Current User", False, f"Error: {str(e)}")
        return None

def test_create_persona(access_token):
    """Test creating a persona."""
    try:
        headers = {"Authorization": f"Bearer {access_token}"}
        data = {
            "name": "Test Persona",
            "description": "A test digital persona",
            "relation_type": "friend"
        }
        response = requests.post(f"{BASE_URL}/personas/", json=data, headers=headers)
        
        if response.status_code == 200:
            persona_data = response.json()
            print_test_result("Create Persona", True, f"Persona: {persona_data.get('name')} (ID: {persona_data.get('id')})")
            return persona_data
        else:
            error_detail = response.json().get('detail', 'Unknown error')
            print_test_result("Create Persona", False, f"Status: {response.status_code}, Error: {error_detail}")
            return None
    except Exception as e:
        print_test_result("Create Persona", False, f"Error: {str(e)}")
        return None

def test_list_personas(access_token):
    """Test listing personas."""
    try:
        headers = {"Authorization": f"Bearer {access_token}"}
        response = requests.get(f"{BASE_URL}/personas/", headers=headers)
        
        if response.status_code == 200:
            personas = response.json()
            print_test_result("List Personas", True, f"Found {len(personas)} personas")
            return personas
        else:
            error_detail = response.json().get('detail', 'Unknown error')
            print_test_result("List Personas", False, f"Status: {response.status_code}, Error: {error_detail}")
            return None
    except Exception as e:
        print_test_result("List Personas", False, f"Error: {str(e)}")
        return None

def test_unauthorized_access():
    """Test that unauthorized access is properly blocked."""
    try:
        # Try to access protected endpoint without token
        response = requests.get(f"{BASE_URL}/personas/")
        
        if response.status_code == 403:
            print_test_result("Unauthorized Access Blocked", True, "Properly returns 403")
            return True
        else:
            print_test_result("Unauthorized Access Blocked", False, f"Expected 403, got {response.status_code}")
            return False
    except Exception as e:
        print_test_result("Unauthorized Access Blocked", False, f"Error: {str(e)}")
        return False

def test_invalid_token():
    """Test that invalid tokens are properly rejected."""
    try:
        headers = {"Authorization": "Bearer invalid_token_here"}
        response = requests.get(f"{BASE_URL}/personas/", headers=headers)
        
        if response.status_code == 401:
            print_test_result("Invalid Token Rejected", True, "Properly returns 401")
            return True
        else:
            print_test_result("Invalid Token Rejected", False, f"Expected 401, got {response.status_code}")
            return False
    except Exception as e:
        print_test_result("Invalid Token Rejected", False, f"Error: {str(e)}")
        return False

def main():
    """Run all authentication tests."""
    print_section("SQLite Authentication System Test")
    print(f"Testing against: {BASE_URL}")
    
    # Test results tracking
    tests_passed = 0
    total_tests = 0
    
    # Test 1: Health check
    total_tests += 1
    if test_health_check():
        tests_passed += 1
    
    # Test 2: Registration
    total_tests += 1
    registration_result = test_registration()
    if registration_result is not None:  # Either got token or user already exists
        tests_passed += 1
    access_token = registration_result if registration_result != "user_exists" else None
    
    # Test 3: Login
    total_tests += 1
    if not access_token:
        access_token = test_login()
    if access_token:
        tests_passed += 1
    
    # Test 4: Get current user
    total_tests += 1
    if access_token and test_get_current_user(access_token):
        tests_passed += 1
    
    # Test 5: Create persona (protected endpoint)
    total_tests += 1
    if access_token and test_create_persona(access_token):
        tests_passed += 1
    
    # Test 6: List personas (protected endpoint)
    total_tests += 1
    if access_token and test_list_personas(access_token):
        tests_passed += 1
    
    # Test 7: Unauthorized access
    total_tests += 1
    if test_unauthorized_access():
        tests_passed += 1
    
    # Test 8: Invalid token
    total_tests += 1
    if test_invalid_token():
        tests_passed += 1
    
    # Summary
    print_section("Test Summary")
    print(f"Tests Passed: {tests_passed}/{total_tests}")
    print(f"Success Rate: {(tests_passed/total_tests)*100:.1f}%")
    
    if tests_passed == total_tests:
        print("\n🎉 All tests passed! Authentication system is working correctly.")
    else:
        print(f"\n⚠️  {total_tests - tests_passed} test(s) failed. Please check the implementation.")
    
    print(f"\nDatabase file: {Path('digital_persona.db').absolute()}")
    print(f"Test user: {TEST_EMAIL}")
    print(f"Test password: {TEST_PASSWORD}")

if __name__ == "__main__":
    main() 