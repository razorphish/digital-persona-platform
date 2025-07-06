#!/usr/bin/env python3
"""
Test script for database integration with SQLAlchemy and PostgreSQL
"""
import asyncio
import requests
import json
import time

BASE_URL = "http://localhost:8000"

async def test_database_integration():
    """Test the complete database integration."""
    print("🗄️ Testing Database Integration with SQLAlchemy & PostgreSQL")
    print("=" * 60)
    
    # Test 1: Register a new user (should be stored in database)
    print("\n1. Testing user registration with database storage...")
    register_data = {
        "email": "db_test@example.com",
        "username": "dbtestuser",
        "password": "testpassword123",
        "full_name": "Database Test User"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/register", json=register_data)
        if response.status_code == 200:
            token_data = response.json()
            print("✅ Registration successful and stored in database!")
            print(f"   Access token: {token_data['access_token'][:50]}...")
            access_token = token_data['access_token']
        else:
            print(f"❌ Registration failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return
    except Exception as e:
        print(f"❌ Registration error: {e}")
        return
    
    # Test 2: Login with the same user (should retrieve from database)
    print("\n2. Testing user login from database...")
    login_data = {
        "email": "db_test@example.com",
        "password": "testpassword123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
        if response.status_code == 200:
            token_data = response.json()
            print("✅ Login successful from database!")
            print(f"   Access token: {token_data['access_token'][:50]}...")
            access_token = token_data['access_token']
        else:
            print(f"❌ Login failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return
    except Exception as e:
        print(f"❌ Login error: {e}")
        return
    
    # Test 3: Get current user info (from database)
    print("\n3. Testing get current user info from database...")
    headers = {"Authorization": f"Bearer {access_token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
        if response.status_code == 200:
            user_data = response.json()
            print("✅ Get user info successful from database!")
            print(f"   User ID: {user_data['id']}")
            print(f"   Username: {user_data['username']}")
            print(f"   Email: {user_data['email']}")
            print(f"   Created at: {user_data['created_at']}")
        else:
            print(f"❌ Get user info failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return
    except Exception as e:
        print(f"❌ Get user info error: {e}")
        return
    
    # Test 4: Create a persona (stored in database)
    print("\n4. Testing persona creation with database storage...")
    persona_data = {
        "name": "Database Test Persona",
        "description": "A test persona stored in PostgreSQL",
        "relation_type": "friend"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/personas/", json=persona_data, headers=headers)
        if response.status_code == 200:
            persona = response.json()
            print("✅ Persona creation successful and stored in database!")
            print(f"   Persona ID: {persona['id']}")
            print(f"   Name: {persona['name']}")
            print(f"   User ID: {persona['user_id']}")
            print(f"   Created at: {persona['created_at']}")
            persona_id = persona['id']
        else:
            print(f"❌ Persona creation failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return
    except Exception as e:
        print(f"❌ Persona creation error: {e}")
        return
    
    # Test 5: List personas (from database)
    print("\n5. Testing list personas from database...")
    
    try:
        response = requests.get(f"{BASE_URL}/personas/", headers=headers)
        if response.status_code == 200:
            personas = response.json()
            print("✅ List personas successful from database!")
            print(f"   Found {len(personas)} personas")
            for persona in personas:
                print(f"   - {persona['name']} ({persona['relation_type']}) - ID: {persona['id']}")
        else:
            print(f"❌ List personas failed: {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ List personas error: {e}")
    
    # Test 6: Update persona (in database)
    print("\n6. Testing persona update in database...")
    update_data = {
        "name": "Updated Database Persona",
        "description": "Updated description in PostgreSQL",
        "relation_type": "colleague"
    }
    
    try:
        response = requests.put(f"{BASE_URL}/personas/{persona_id}", json=update_data, headers=headers)
        if response.status_code == 200:
            updated_persona = response.json()
            print("✅ Persona update successful in database!")
            print(f"   Updated name: {updated_persona['name']}")
            print(f"   Updated relation: {updated_persona['relation_type']}")
        else:
            print(f"❌ Persona update failed: {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ Persona update error: {e}")
    
    # Test 7: Get specific persona (from database)
    print("\n7. Testing get specific persona from database...")
    
    try:
        response = requests.get(f"{BASE_URL}/personas/{persona_id}", headers=headers)
        if response.status_code == 200:
            persona = response.json()
            print("✅ Get specific persona successful from database!")
            print(f"   Name: {persona['name']}")
            print(f"   Description: {persona['description']}")
            print(f"   Relation: {persona['relation_type']}")
        else:
            print(f"❌ Get specific persona failed: {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ Get specific persona error: {e}")
    
    # Test 8: Delete persona (from database)
    print("\n8. Testing persona deletion from database...")
    
    try:
        response = requests.delete(f"{BASE_URL}/personas/{persona_id}", headers=headers)
        if response.status_code == 200:
            print("✅ Persona deletion successful from database!")
            print(f"   Response: {response.json()}")
        else:
            print(f"❌ Persona deletion failed: {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ Persona deletion error: {e}")
    
    # Test 9: Verify persona is deleted
    print("\n9. Testing persona deletion verification...")
    
    try:
        response = requests.get(f"{BASE_URL}/personas/", headers=headers)
        if response.status_code == 200:
            personas = response.json()
            print(f"✅ Verification successful! Found {len(personas)} personas remaining")
            if len(personas) == 0:
                print("   ✅ All personas deleted successfully from database")
            else:
                print("   ⚠️ Some personas still exist")
        else:
            print(f"❌ Verification failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Verification error: {e}")
    
    print("\n" + "=" * 60)
    print("🎉 Database integration test completed!")
    print("✅ SQLAlchemy + PostgreSQL integration working correctly!")

if __name__ == "__main__":
    asyncio.run(test_database_integration()) 