#!/usr/bin/env python3
"""
Integration test for OpenAI chat functionality with FastAPI server
"""
import asyncio
import os
import time
import requests
import json
from dotenv import load_dotenv
from app.services.openai_service import openai_service

# Load environment variables
load_dotenv()

# Test configuration
BASE_URL = "http://localhost:8000"
TEST_USER_EMAIL = "test@example.com"
TEST_USER_PASSWORD = "testpassword123"

class ChatIntegrationTest:
    """Integration test class for chat functionality."""
    
    def __init__(self):
        self.session = requests.Session()
        self.access_token = None
        self.test_user_id = None
        self.test_persona_id = None
        self.test_conversation_id = None
    
    def test_openai_health(self):
        """Test OpenAI health endpoint."""
        print("🧪 Testing OpenAI Health Endpoint...")
        print("=" * 40)
        
        try:
            response = self.session.get(f"{BASE_URL}/chat/health")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Health check successful: {data}")
                return data.get("status") == "healthy"
            else:
                print(f"❌ Health check failed: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Health check error: {e}")
            return False
    
    def test_basic_openai_functionality(self):
        """Test basic OpenAI functionality."""
        print("\n🧪 Testing Basic OpenAI Functionality...")
        print("=" * 45)
        
        try:
            # Check if API key is available
            if not openai_service.is_available():
                print("❌ OpenAI service is not available")
                return False
            
            # Test API key validation
            if openai_service.validate_api_key():
                print("✅ API key validation successful")
            else:
                print("❌ API key validation failed")
                return False
            
            # Test direct OpenAI client
            from openai import OpenAI
            client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
            
            # Simple test call
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": "Say 'Integration test successful'"}],
                max_tokens=10
            )
            
            content = response.choices[0].message.content
            print(f"✅ Direct API test successful: {content}")
            
            return True
            
        except Exception as e:
            print(f"❌ Error during basic test: {e}")
            return False
    
    def test_server_connection(self):
        """Test if the server is running and accessible."""
        print("\n🧪 Testing Server Connection...")
        print("=" * 35)
        
        try:
            response = self.session.get(f"{BASE_URL}/docs")
            
            if response.status_code == 200:
                print("✅ Server is running and accessible")
                return True
            else:
                print(f"❌ Server connection failed: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Server connection error: {e}")
            print("   Make sure the server is running with: python -m uvicorn app.main:app --reload")
            return False
    
    def test_authentication(self):
        """Test user authentication."""
        print("\n🧪 Testing Authentication...")
        print("=" * 30)
        
        try:
            # Try to register a test user
            register_data = {
                "email": TEST_USER_EMAIL,
                "username": "testuser",
                "full_name": "Test User",
                "password": TEST_USER_PASSWORD
            }
            
            response = self.session.post(f"{BASE_URL}/auth/register", json=register_data)
            
            if response.status_code in [200, 201, 409]:  # 409 means user already exists
                print("✅ User registration/check successful")
            else:
                print(f"⚠️  User registration failed: {response.status_code}")
            
            # Try to login
            login_data = {
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD
            }
            
            response = self.session.post(f"{BASE_URL}/auth/login", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                self.access_token = data.get("access_token")
                print("✅ Login successful")
                return True
            else:
                print(f"❌ Login failed: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Authentication error: {e}")
            return False
    
    def test_self_persona_creation(self):
        """Test getting or creating the self persona."""
        print("\n🧪 Testing Self Persona Creation...")
        print("=" * 40)
        
        if not self.access_token:
            print("❌ No access token available")
            return False
        
        try:
            # Set authorization header
            self.session.headers.update({"Authorization": f"Bearer {self.access_token}"})
            
            # Get or create the self persona
            response = self.session.get(f"{BASE_URL}/personas/self")
            
            if response.status_code == 200:
                data = response.json()
                self.test_persona_id = data.get("id")
                print(f"✅ Self persona retrieved/created successfully: {data.get('name')}")
                print(f"   Relation type: {data.get('relation_type')}")
                print(f"   Persona ID: {self.test_persona_id}")
                return True
            else:
                print(f"❌ Self persona creation failed: {response.status_code}")
                print(f"   Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Self persona creation error: {e}")
            return False
    
    def test_conversation_creation(self):
        """Test creating a test conversation."""
        print("\n🧪 Testing Conversation Creation...")
        print("=" * 40)
        
        if not self.test_persona_id:
            print("❌ No test persona available")
            return False
        
        try:
            # Create a test conversation
            conversation_data = {
                "title": "Test Chat Session",
                "persona_id": self.test_persona_id
            }
            
            response = self.session.post(f"{BASE_URL}/chat/conversations", json=conversation_data)
            
            if response.status_code == 200:
                data = response.json()
                self.test_conversation_id = data.get("id")
                print(f"✅ Conversation created successfully: {data.get('title')}")
                return True
            else:
                print(f"❌ Conversation creation failed: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Conversation creation error: {e}")
            return False
    
    def test_chat_message(self):
        """Test sending a chat message and getting AI response."""
        print("\n🧪 Testing Chat Message...")
        print("=" * 30)
        
        if not self.test_conversation_id:
            print("❌ No test conversation available")
            return False
        
        try:
            # Send a test message
            message_data = {
                "content": "Hello! Can you tell me a short joke?"
            }
            
            print(f"🧪 Sending message: '{message_data['content']}'")
            
            response = self.session.post(
                f"{BASE_URL}/chat/conversations/{self.test_conversation_id}/send",
                json=message_data
            )
            
            if response.status_code == 200:
                data = response.json()
                
                user_message = data.get("user_message", {})
                assistant_message = data.get("assistant_message", {})
                
                print("✅ Chat message successful!")
                print(f"   User message: {user_message.get('content', '')}")
                print(f"   AI response: {assistant_message.get('content', '')[:100]}...")
                print(f"   Tokens used: {assistant_message.get('tokens_used', 'N/A')}")
                print(f"   Response time: {assistant_message.get('response_time_ms', 'N/A')}ms")
                
                return True
            else:
                print(f"❌ Chat message failed: {response.status_code}")
                print(f"   Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Chat message error: {e}")
            return False
    
    def test_conversation_history(self):
        """Test retrieving conversation history."""
        print("\n🧪 Testing Conversation History...")
        print("=" * 40)
        
        if not self.test_conversation_id:
            print("❌ No test conversation available")
            return False
        
        try:
            # Get conversation messages
            response = self.session.get(f"{BASE_URL}/chat/conversations/{self.test_conversation_id}/messages")
            
            if response.status_code == 200:
                messages = response.json()
                print(f"✅ Retrieved {len(messages)} messages from conversation")
                
                for i, msg in enumerate(messages):
                    print(f"   Message {i+1}: {msg.get('role')} - {msg.get('content', '')[:50]}...")
                
                return True
            else:
                print(f"❌ Failed to retrieve messages: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Conversation history error: {e}")
            return False
    
    def run_all_tests(self):
        """Run all integration tests."""
        print("🚀 Starting OpenAI Integration Tests")
        print("=" * 60)
        
        tests = [
            ("Basic OpenAI Functionality", self.test_basic_openai_functionality),
            ("Server Connection", self.test_server_connection),
            ("OpenAI Health", self.test_openai_health),
            ("Authentication", self.test_authentication),
            ("Self Persona Creation", self.test_self_persona_creation),
            ("Conversation Creation", self.test_conversation_creation),
            ("Chat Message", self.test_chat_message),
            ("Conversation History", self.test_conversation_history)
        ]
        
        results = []
        
        for test_name, test_func in tests:
            print(f"\n📋 Running {test_name} test...")
            try:
                result = test_func()
                results.append((test_name, result))
            except Exception as e:
                print(f"❌ {test_name} test failed with exception: {e}")
                results.append((test_name, False))
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 Integration Test Results Summary:")
        print("=" * 60)
        
        passed = 0
        for test_name, result in results:
            status = "✅ PASSED" if result else "❌ FAILED"
            print(f"   {test_name}: {status}")
            if result:
                passed += 1
        
        print(f"\n🎯 Overall: {passed}/{len(results)} tests passed")
        
        if passed == len(results):
            print("🎉 All integration tests passed! OpenAI chat system is working correctly.")
        else:
            print("⚠️  Some tests failed. Please check the errors above.")
        
        return passed == len(results)

def main():
    """Main test runner."""
    test_runner = ChatIntegrationTest()
    success = test_runner.run_all_tests()
    
    if not success:
        print("\n💡 Troubleshooting Tips:")
        print("   1. Make sure the server is running: python -m uvicorn app.main:app --reload")
        print("   2. Check that OPENAI_API_KEY is set in your environment")
        print("   3. Verify the database is properly initialized")
        print("   4. Check server logs for any errors")

if __name__ == "__main__":
    main() 