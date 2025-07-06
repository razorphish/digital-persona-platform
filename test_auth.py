#!/usr/bin/env python3
"""
Test script for JWT authentication system
"""
import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_auth_system():
    """Test the complete authentication flow."""
    print("🔐 Testing JWT Authentication System")
    print("=" * 50)
    
    # Test 1: Register a new user
    print("\n1. Testing user registration...")
    register_data = {
        "email": "test@example.com",
        "username": "testuser",
        "password": "testpassword123",
        "full_name": "Test User"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/register", json=register_data)
        if response.status_code == 200:
            token_data = response.json()
            print("✅ Registration successful!")
            print(f"   Access token: {token_data['access_token'][:50]}...")
            print(f"   Refresh token: {token_data['refresh_token'][:50]}...")
            access_token = token_data['access_token']
        else:
            print(f"❌ Registration failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return
    except Exception as e:
        print(f"❌ Registration error: {e}")
        return
    
    # Test 2: Login with the same user
    print("\n2. Testing user login...")
    login_data = {
        "email": "test@example.com",
        "password": "testpassword123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
        if response.status_code == 200:
            token_data = response.json()
            print("✅ Login successful!")
            print(f"   Access token: {token_data['access_token'][:50]}...")
            access_token = token_data['access_token']
        else:
            print(f"❌ Login failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return
    except Exception as e:
        print(f"❌ Login error: {e}")
        return
    
    # Test 3: Get current user info
    print("\n3. Testing get current user info...")
    headers = {"Authorization": f"Bearer {access_token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
        if response.status_code == 200:
            user_data = response.json()
            print("✅ Get user info successful!")
            print(f"   User ID: {user_data['id']}")
            print(f"   Username: {user_data['username']}")
            print(f"   Email: {user_data['email']}")
        else:
            print(f"❌ Get user info failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return
    except Exception as e:
        print(f"❌ Get user info error: {e}")
        return
    
    # Test 4: Create a persona (requires authentication)
    print("\n4. Testing persona creation (requires auth)...")
    persona_data = {
        "name": "John Doe",
        "description": "A test persona",
        "relationship": "friend"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/personas/", json=persona_data, headers=headers)
        if response.status_code == 200:
            persona = response.json()
            print("✅ Persona creation successful!")
            print(f"   Persona ID: {persona['id']}")
            print(f"   Name: {persona['name']}")
            print(f"   User ID: {persona['user_id']}")
            persona_id = persona['id']
        else:
            print(f"❌ Persona creation failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return
    except Exception as e:
        print(f"❌ Persona creation error: {e}")
        return
    
    # Test 5: List personas (requires authentication)
    print("\n5. Testing list personas (requires auth)...")
    
    try:
        response = requests.get(f"{BASE_URL}/personas/", headers=headers)
        if response.status_code == 200:
            personas = response.json()
            print("✅ List personas successful!")
            print(f"   Found {len(personas)} personas")
            for persona in personas:
                print(f"   - {persona['name']} ({persona['relationship']})")
        else:
            print(f"❌ List personas failed: {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ List personas error: {e}")
    
    # Test 6: Test without authentication (should fail)
    print("\n6. Testing persona creation without auth (should fail)...")
    
    try:
        response = requests.post(f"{BASE_URL}/personas/", json=persona_data)
        if response.status_code == 401:
            print("✅ Correctly rejected unauthenticated request!")
        else:
            print(f"❌ Should have failed with 401, got {response.status_code}")
    except Exception as e:
        print(f"❌ Test error: {e}")
    
    # Test 7: Verify token endpoint
    print("\n7. Testing token verification...")
    
    try:
        response = requests.get(f"{BASE_URL}/auth/verify", headers=headers)
        if response.status_code == 200:
            verify_data = response.json()
            print("✅ Token verification successful!")
            print(f"   Valid: {verify_data['valid']}")
            print(f"   User ID: {verify_data['user_id']}")
        else:
            print(f"❌ Token verification failed: {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ Token verification error: {e}")
    
    print("\n" + "=" * 50)
    print("🎉 Authentication system test completed!")

if __name__ == "__main__":
    test_auth_system() 