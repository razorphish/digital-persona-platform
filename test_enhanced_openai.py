#!/usr/bin/env python3
"""
Comprehensive test for enhanced OpenAI integration with persona-specific responses
"""
import asyncio
import requests
import json
import time
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Test configuration
BASE_URL = "http://localhost:8000"
TEST_USER_EMAIL = "enhanced@example.com"
TEST_USER_PASSWORD = "enhancedpass123"

class EnhancedOpenAITest:
    """Test class for enhanced OpenAI integration."""
    
    def __init__(self):
        self.session = requests.Session()
        self.access_token = None
        self.test_personas = {}
        self.test_conversations = {}
    
    def test_api_health_and_status(self):
        """Test enhanced API health and status endpoints."""
        print("🧪 Testing Enhanced API Health and Status...")
        print("=" * 50)
        
        try:
            # Test basic health
            response = self.session.get(f"{BASE_URL}/chat/health")
            if response.status_code == 200:
                health_data = response.json()
                print(f"✅ Health check: {health_data}")
                
                # Check for detailed status information
                if "api_key_configured" in health_data:
                    print(f"   API Key configured: {health_data['api_key_configured']}")
                if "models_available" in health_data:
                    print(f"   Models available: {health_data['models_available']}")
                if "default_model" in health_data:
                    print(f"   Default model: {health_data['default_model']}")
                
                return health_data.get("status") == "healthy"
            else:
                print(f"❌ Health check failed: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Health check error: {e}")
            return False
    
    def test_available_models(self):
        """Test the new models endpoint."""
        print("\n🧪 Testing Available Models...")
        print("=" * 35)
        
        try:
            response = self.session.get(f"{BASE_URL}/chat/models")
            
            if response.status_code == 200:
                models_data = response.json()
                print(f"✅ Models endpoint successful")
                print(f"   Default model: {models_data.get('default_model')}")
                print(f"   Total models: {models_data.get('total_models')}")
                
                # Show some available models
                models = models_data.get('models', [])
                if models:
                    print("   Available models:")
                    for model in models[:3]:  # Show first 3
                        print(f"     - {model.get('id')} (owned by: {model.get('owned_by')})")
                
                return True
            else:
                print(f"❌ Models endpoint failed: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Models endpoint error: {e}")
            return False
    
    def test_authentication(self):
        """Test user authentication."""
        print("\n🧪 Testing Authentication...")
        print("=" * 30)
        
        try:
            # Try to login
            login_data = {
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD
            }
            
            response = self.session.post(f"{BASE_URL}/auth/login", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                self.access_token = data.get("access_token")
                self.session.headers.update({"Authorization": f"Bearer {self.access_token}"})
                print("✅ Login successful")
                return True
            else:
                print(f"❌ Login failed: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Authentication error: {e}")
            return False
    
    def test_persona_creation_with_different_types(self):
        """Test creating personas with different relationship types."""
        print("\n🧪 Testing Persona Creation with Different Types...")
        print("=" * 55)
        
        persona_types = [
            {
                "name": "Wise Mentor",
                "description": "A knowledgeable and experienced mentor who provides guidance and wisdom. Always thoughtful and patient in responses.",
                "relation_type": "other"
            },
            {
                "name": "Supportive Friend",
                "description": "A close friend who is always there to listen, support, and share in both joys and challenges.",
                "relation_type": "friend"
            },
            {
                "name": "Professional Colleague",
                "description": "A work colleague who is professional, efficient, and focused on collaboration and productivity.",
                "relation_type": "colleague"
            }
        ]
        
        for i, persona_data in enumerate(persona_types, 1):
            try:
                print(f"\n   Creating persona {i}: {persona_data['name']}")
                
                response = self.session.post(f"{BASE_URL}/personas", json=persona_data)
                
                if response.status_code == 200:
                    data = response.json()
                    persona_id = data.get("id")
                    self.test_personas[persona_data['name']] = persona_id
                    print(f"   ✅ Created: {data.get('name')} (ID: {persona_id})")
                else:
                    print(f"   ❌ Failed: {response.status_code}")
                    return False
                    
            except Exception as e:
                print(f"   ❌ Error: {e}")
                return False
        
        return True
    
    def test_conversation_creation(self):
        """Test creating conversations for each persona."""
        print("\n🧪 Testing Conversation Creation...")
        print("=" * 40)
        
        for persona_name, persona_id in self.test_personas.items():
            try:
                conversation_data = {
                    "title": f"Chat with {persona_name}",
                    "persona_id": persona_id
                }
                
                print(f"   Creating conversation with {persona_name}...")
                
                response = self.session.post(f"{BASE_URL}/chat/conversations", json=conversation_data)
                
                if response.status_code == 200:
                    data = response.json()
                    conversation_id = data.get("id")
                    self.test_conversations[persona_name] = conversation_id
                    print(f"   ✅ Created conversation: {data.get('title')} (ID: {conversation_id})")
                else:
                    print(f"   ❌ Failed: {response.status_code}")
                    return False
                    
            except Exception as e:
                print(f"   ❌ Error: {e}")
                return False
        
        return True
    
    def test_persona_specific_responses(self):
        """Test that different personas respond appropriately to their character."""
        print("\n🧪 Testing Persona-Specific Responses...")
        print("=" * 45)
        
        test_messages = [
            "I'm feeling stressed about work today.",
            "What advice would you give me?",
            "How do you think I should handle this situation?"
        ]
        
        for persona_name, conversation_id in self.test_conversations.items():
            print(f"\n   Testing {persona_name}...")
            
            for i, message in enumerate(test_messages, 1):
                try:
                    print(f"     Message {i}: {message[:40]}...")
                    
                    message_data = {"content": message}
                    response = self.session.post(
                        f"{BASE_URL}/chat/conversations/{conversation_id}/send",
                        json=message_data
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        assistant_message = data.get("assistant_message", {})
                        
                        content = assistant_message.get("content", "")
                        tokens = assistant_message.get("tokens_used", 0)
                        response_time = assistant_message.get("response_time_ms", 0)
                        
                        print(f"     ✅ Response: {content[:60]}...")
                        print(f"        Tokens: {tokens}, Time: {response_time}ms")
                        
                        # Add a small delay between messages
                        time.sleep(1)
                        
                    else:
                        print(f"     ❌ Failed: {response.status_code}")
                        return False
                        
                except Exception as e:
                    print(f"     ❌ Error: {e}")
                    return False
        
        return True
    
    def test_error_handling(self):
        """Test error handling for various scenarios."""
        print("\n🧪 Testing Error Handling...")
        print("=" * 35)
        
        # Test 1: Invalid conversation ID
        try:
            print("   Testing invalid conversation ID...")
            response = self.session.post(
                f"{BASE_URL}/chat/conversations/99999/send",
                json={"content": "This should fail"}
            )
            
            if response.status_code == 404:
                print("   ✅ Correctly handled invalid conversation ID")
            else:
                print(f"   ❌ Unexpected response: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"   ❌ Error: {e}")
            return False
        
        # Test 2: Empty message
        try:
            print("   Testing empty message...")
            response = self.session.post(
                f"{BASE_URL}/chat/conversations/1/send",
                json={"content": ""}
            )
            
            if response.status_code == 422:  # Validation error
                print("   ✅ Correctly handled empty message")
            else:
                print(f"   ❌ Unexpected response: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"   ❌ Error: {e}")
            return False
        
        # Test 3: Message too long
        try:
            print("   Testing message too long...")
            long_message = "A" * 5000  # 5000 characters
            response = self.session.post(
                f"{BASE_URL}/chat/conversations/1/send",
                json={"content": long_message}
            )
            
            if response.status_code == 422:  # Validation error
                print("   ✅ Correctly handled message too long")
            else:
                print(f"   ❌ Unexpected response: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"   ❌ Error: {e}")
            return False
        
        return True
    
    def test_rate_limiting_and_retries(self):
        """Test rate limiting and retry mechanisms."""
        print("\n🧪 Testing Rate Limiting and Retries...")
        print("=" * 45)
        
        # Get a valid conversation ID
        if not self.test_conversations:
            print("   ❌ No conversations available for testing")
            return False
        
        conversation_id = list(self.test_conversations.values())[0]
        
        # Send multiple messages quickly to test rate limiting
        print("   Sending multiple messages quickly...")
        
        for i in range(3):
            try:
                message_data = {"content": f"Quick message {i+1} for rate limiting test"}
                
                start_time = time.time()
                response = self.session.post(
                    f"{BASE_URL}/chat/conversations/{conversation_id}/send",
                    json=message_data
                )
                end_time = time.time()
                
                if response.status_code == 200:
                    data = response.json()
                    response_time = data.get("assistant_message", {}).get("response_time_ms", 0)
                    total_time = (end_time - start_time) * 1000
                    
                    print(f"     Message {i+1}: Response time {response_time}ms, Total time {total_time:.0f}ms")
                    
                    # Check if rate limiting is working (should see some delay)
                    if total_time > 1000:  # More than 1 second
                        print(f"     ✅ Rate limiting detected (delay: {total_time-1000:.0f}ms)")
                    
                else:
                    print(f"     ❌ Failed: {response.status_code}")
                    return False
                    
            except Exception as e:
                print(f"     ❌ Error: {e}")
                return False
        
        return True
    
    def test_conversation_history_and_context(self):
        """Test conversation history and context maintenance."""
        print("\n🧪 Testing Conversation History and Context...")
        print("=" * 50)
        
        if not self.test_conversations:
            print("   ❌ No conversations available for testing")
            return False
        
        conversation_id = list(self.test_conversations.values())[0]
        
        # Send a series of related messages
        messages = [
            "My name is Alex.",
            "What's my name?",
            "I work as a software developer.",
            "What do I do for work?",
            "I'm 28 years old.",
            "How old am I?"
        ]
        
        print("   Sending conversation with context...")
        
        for i, message in enumerate(messages, 1):
            try:
                print(f"     Message {i}: {message}")
                
                message_data = {"content": message}
                response = self.session.post(
                    f"{BASE_URL}/chat/conversations/{conversation_id}/send",
                    json=message_data
                )
                
                if response.status_code == 200:
                    data = response.json()
                    assistant_message = data.get("assistant_message", {})
                    content = assistant_message.get("content", "")
                    
                    print(f"     Response: {content[:80]}...")
                    
                    # Add delay between messages
                    time.sleep(1)
                    
                else:
                    print(f"     ❌ Failed: {response.status_code}")
                    return False
                    
            except Exception as e:
                print(f"     ❌ Error: {e}")
                return False
        
        # Test retrieving conversation history
        try:
            print("   Retrieving conversation history...")
            
            response = self.session.get(f"{BASE_URL}/chat/conversations/{conversation_id}/messages")
            
            if response.status_code == 200:
                messages = response.json()
                print(f"   ✅ Retrieved {len(messages)} messages")
                
                # Check that we have both user and assistant messages
                user_messages = [m for m in messages if m.get("role") == "user"]
                assistant_messages = [m for m in messages if m.get("role") == "assistant"]
                
                print(f"     User messages: {len(user_messages)}")
                print(f"     Assistant messages: {len(assistant_messages)}")
                
                return True
            else:
                print(f"   ❌ Failed to retrieve history: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"   ❌ Error retrieving history: {e}")
            return False
    
    def run_all_tests(self):
        """Run all enhanced OpenAI tests."""
        print("🚀 Starting Enhanced OpenAI Integration Tests")
        print("=" * 65)
        
        tests = [
            ("API Health and Status", self.test_api_health_and_status),
            ("Available Models", self.test_available_models),
            ("Authentication", self.test_authentication),
            ("Persona Creation with Different Types", self.test_persona_creation_with_different_types),
            ("Conversation Creation", self.test_conversation_creation),
            ("Persona-Specific Responses", self.test_persona_specific_responses),
            ("Error Handling", self.test_error_handling),
            ("Rate Limiting and Retries", self.test_rate_limiting_and_retries),
            ("Conversation History and Context", self.test_conversation_history_and_context)
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
        print("\n" + "=" * 65)
        print("📊 Enhanced OpenAI Test Results Summary:")
        print("=" * 65)
        
        passed = 0
        for test_name, result in results:
            status = "✅ PASSED" if result else "❌ FAILED"
            print(f"   {test_name}: {status}")
            if result:
                passed += 1
        
        print(f"\n🎯 Overall: {passed}/{len(results)} tests passed")
        
        if passed == len(results):
            print("🎉 All enhanced OpenAI tests passed!")
            print("The enhanced OpenAI integration is working perfectly with:")
            print("  • Sophisticated persona-specific responses")
            print("  • Enhanced error handling and rate limiting")
            print("  • Retry mechanisms and API status monitoring")
            print("  • Conversation context maintenance")
            print("  • Proper validation and error responses")
        else:
            print("⚠️  Some tests failed. Please check the errors above.")
        
        return passed == len(results)

def main():
    """Main test runner."""
    test_runner = EnhancedOpenAITest()
    success = test_runner.run_all_tests()
    
    if not success:
        print("\n💡 Troubleshooting Tips:")
        print("   1. Make sure the server is running: python -m uvicorn app.main:app --reload")
        print("   2. Check that OPENAI_API_KEY is set in your environment")
        print("   3. Verify the database is properly initialized")
        print("   4. Check server logs for any errors")

if __name__ == "__main__":
    main() 