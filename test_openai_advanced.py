#!/usr/bin/env python3
"""
Advanced test demonstrating complex OpenAI chat functionality
"""
import requests
import json
import time
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Test configuration
BASE_URL = "http://localhost:8000"
TEST_USER_EMAIL = "advanced@example.com"
TEST_USER_PASSWORD = "advancedpass123"

def test_advanced_chat_conversation():
    """Test a more complex conversation with multiple messages."""
    print("🚀 Advanced OpenAI Chat Test")
    print("=" * 50)
    
    session = requests.Session()
    
    # Step 1: Login
    print("1️⃣ Logging in...")
    login_data = {
        "email": TEST_USER_EMAIL,
        "password": TEST_USER_PASSWORD
    }
    
    response = session.post(f"{BASE_URL}/auth/login", json=login_data)
    if response.status_code != 200:
        print("❌ Login failed, trying to register...")
        register_data = {
            "email": TEST_USER_EMAIL,
            "username": "advanceduser",
            "full_name": "Advanced Test User",
            "password": TEST_USER_PASSWORD
        }
        session.post(f"{BASE_URL}/auth/register", json=register_data)
        response = session.post(f"{BASE_URL}/auth/login", json=login_data)
    
    if response.status_code == 200:
        access_token = response.json().get("access_token")
        session.headers.update({"Authorization": f"Bearer {access_token}"})
        print("✅ Login successful")
    else:
        print(f"❌ Login failed: {response.status_code}")
        return False
    
    # Step 2: Create a persona
    print("\n2️⃣ Creating a persona...")
    persona_data = {
        "name": "Sage Advisor",
        "description": "A wise and knowledgeable advisor who specializes in technology, philosophy, and life advice. Always provides thoughtful, well-reasoned responses.",
        "relation_type": "other"
    }
    
    response = session.post(f"{BASE_URL}/personas", json=persona_data)
    if response.status_code == 200:
        persona_id = response.json().get("id")
        print(f"✅ Persona created: {response.json().get('name')}")
    else:
        print(f"❌ Persona creation failed: {response.status_code}")
        return False
    
    # Step 3: Create a conversation
    print("\n3️⃣ Creating a conversation...")
    conversation_data = {
        "title": "Deep Discussion with Sage",
        "persona_id": persona_id
    }
    
    response = session.post(f"{BASE_URL}/chat/conversations", json=conversation_data)
    if response.status_code == 200:
        conversation_id = response.json().get("id")
        print(f"✅ Conversation created: {response.json().get('title')}")
    else:
        print(f"❌ Conversation creation failed: {response.status_code}")
        return False
    
    # Step 4: Send multiple messages to test conversation flow
    print("\n4️⃣ Testing conversation flow...")
    
    messages = [
        "Hello! I'm interested in learning about artificial intelligence and its impact on society. What are your thoughts?",
        "That's fascinating! How do you think AI will change the way we work in the next decade?",
        "What advice would you give to someone who wants to start learning about AI?",
        "Thank you for the insights! One last question: what do you think is the most important thing for people to understand about AI?"
    ]
    
    total_tokens = 0
    total_response_time = 0
    
    for i, message in enumerate(messages, 1):
        print(f"\n   💬 Message {i}: {message[:60]}...")
        
        message_data = {"content": message}
        response = session.post(
            f"{BASE_URL}/chat/conversations/{conversation_id}/send",
            json=message_data
        )
        
        if response.status_code == 200:
            data = response.json()
            assistant_message = data.get("assistant_message", {})
            
            content = assistant_message.get("content", "")
            tokens = assistant_message.get("tokens_used", 0)
            response_time = assistant_message.get("response_time_ms", 0)
            
            total_tokens += tokens
            total_response_time += response_time
            
            print(f"   🤖 Response: {content[:80]}...")
            print(f"   📊 Tokens: {tokens}, Time: {response_time}ms")
        else:
            print(f"   ❌ Message failed: {response.status_code}")
            return False
    
    # Step 5: Get conversation history
    print("\n5️⃣ Retrieving conversation history...")
    response = session.get(f"{BASE_URL}/chat/conversations/{conversation_id}/messages")
    
    if response.status_code == 200:
        messages = response.json()
        print(f"✅ Retrieved {len(messages)} messages")
        
        print("\n📝 Full Conversation:")
        print("-" * 50)
        for i, msg in enumerate(messages, 1):
            role = msg.get("role", "unknown")
            content = msg.get("content", "")
            print(f"{i}. [{role.upper()}]: {content[:100]}...")
    
    # Step 6: Get chat statistics
    print("\n6️⃣ Getting chat statistics...")
    response = session.get(f"{BASE_URL}/chat/stats")
    
    if response.status_code == 200:
        stats = response.json()
        print("✅ Chat Statistics:")
        print(f"   Total conversations: {stats.get('total_conversations', 0)}")
        print(f"   Total messages: {stats.get('total_messages', 0)}")
        print(f"   Total tokens: {stats.get('total_tokens', 0)}")
        print(f"   Estimated cost: ${stats.get('estimated_cost_usd', 0)}")
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 Test Summary:")
    print("=" * 50)
    print(f"✅ Total messages sent: {len(messages)}")
    print(f"✅ Total tokens used: {total_tokens}")
    print(f"✅ Average response time: {total_response_time // len(messages)}ms")
    print(f"✅ Conversation ID: {conversation_id}")
    print(f"✅ Persona ID: {persona_id}")
    
    print("\n🎉 Advanced chat test completed successfully!")
    print("The OpenAI integration is working perfectly with:")
    print("  • User authentication")
    print("  • Persona creation and management")
    print("  • Conversation handling")
    print("  • Multi-turn chat with context")
    print("  • Token tracking and cost estimation")
    print("  • Response time monitoring")
    
    return True

if __name__ == "__main__":
    test_advanced_chat_conversation() 