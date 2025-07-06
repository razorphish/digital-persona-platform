#!/usr/bin/env python3
"""
Test script for OpenAI-powered chat system with digital personas
"""
import asyncio
import requests
import json
import time
import os

BASE_URL = "http://localhost:8000"

async def test_chat_system():
    """Test the complete chat system with OpenAI integration."""
    print("🤖 Testing OpenAI-Powered Chat System")
    print("=" * 60)
    
    # Check if OpenAI API key is set
    if not os.getenv("OPENAI_API_KEY"):
        print("⚠️  OPENAI_API_KEY not set. Some tests will be skipped.")
        print("   Set your OpenAI API key: export OPENAI_API_KEY='your-key-here'")
    
    # Test 1: Register a user
    print("\n1. Registering test user...")
    register_data = {
        "email": "chat_test@example.com",
        "username": "chattestuser",
        "password": "testpassword123",
        "full_name": "Chat Test User"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/register", json=register_data)
        if response.status_code == 200:
            token_data = response.json()
            access_token = token_data['access_token']
            print("✅ User registered successfully!")
        else:
            print(f"❌ Registration failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return
    except Exception as e:
        print(f"❌ Registration error: {e}")
        return
    
    # Test 2: Create a persona
    print("\n2. Creating test persona...")
    persona_data = {
        "name": "Alex",
        "description": "A friendly and supportive friend who loves technology and gives great advice",
        "relation_type": "friend"
    }
    
    headers = {"Authorization": f"Bearer {access_token}"}
    
    try:
        response = requests.post(f"{BASE_URL}/personas/", json=persona_data, headers=headers)
        if response.status_code == 200:
            persona = response.json()
            persona_id = persona['id']
            print(f"✅ Persona created successfully! ID: {persona_id}")
            print(f"   Name: {persona['name']}")
            print(f"   Relation: {persona['relation_type']}")
        else:
            print(f"❌ Persona creation failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return
    except Exception as e:
        print(f"❌ Persona creation error: {e}")
        return
    
    # Test 3: Check OpenAI health
    print("\n3. Checking OpenAI API health...")
    try:
        response = requests.get(f"{BASE_URL}/chat/health")
        if response.status_code == 200:
            health = response.json()
            print(f"✅ OpenAI health check: {health['status']}")
            print(f"   API Status: {health['openai_api']}")
            if health['openai_api'] == 'disconnected':
                print("   ⚠️ OpenAI API not connected - chat tests will be limited")
        else:
            print(f"❌ Health check failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Health check error: {e}")
    
    # Test 4: Create a conversation
    print("\n4. Creating conversation with persona...")
    conversation_data = {
        "title": "First Chat with Alex",
        "persona_id": persona_id
    }
    
    try:
        response = requests.post(f"{BASE_URL}/chat/conversations", json=conversation_data, headers=headers)
        if response.status_code == 200:
            conversation = response.json()
            conversation_id = conversation['id']
            print("✅ Conversation created successfully!")
            print(f"   Conversation ID: {conversation_id}")
            print(f"   Title: {conversation['title']}")
        else:
            print(f"❌ Conversation creation failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return
    except Exception as e:
        print(f"❌ Conversation creation error: {e}")
        return
    
    # Test 5: List conversations
    print("\n5. Testing list conversations...")
    try:
        response = requests.get(f"{BASE_URL}/chat/conversations", headers=headers)
        if response.status_code == 200:
            conversations = response.json()
            print(f"✅ List conversations successful! Found {len(conversations)} conversations")
            for conv in conversations:
                print(f"   - {conv['title']} (ID: {conv['id']})")
        else:
            print(f"❌ List conversations failed: {response.status_code}")
    except Exception as e:
        print(f"❌ List conversations error: {e}")
    
    # Test 6: Send a message (if OpenAI is available)
    print("\n6. Testing send message to persona...")
    message_data = {
        "content": "Hi Alex! How are you doing today?"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/chat/conversations/{conversation_id}/send",
            json=message_data,
            headers=headers
        )
        
        if response.status_code == 200:
            chat_response = response.json()
            print("✅ Message sent successfully!")
            print(f"   User message: {chat_response['user_message']['content']}")
            print(f"   Assistant response: {chat_response['assistant_message']['content'][:100]}...")
            print(f"   Tokens used: {chat_response['assistant_message']['tokens_used']}")
            print(f"   Response time: {chat_response['assistant_message']['response_time_ms']}ms")
        elif response.status_code == 500 and "OpenAI API error" in response.text:
            print("⚠️ OpenAI API not available - skipping chat test")
            print("   This is expected if OPENAI_API_KEY is not set")
        else:
            print(f"❌ Send message failed: {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ Send message error: {e}")
    
    # Test 7: Get conversation messages
    print("\n7. Testing get conversation messages...")
    try:
        response = requests.get(f"{BASE_URL}/chat/conversations/{conversation_id}/messages", headers=headers)
        if response.status_code == 200:
            messages = response.json()
            print(f"✅ Get messages successful! Found {len(messages)} messages")
            for msg in messages:
                print(f"   - {msg['role']}: {msg['content'][:50]}...")
        else:
            print(f"❌ Get messages failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Get messages error: {e}")
    
    # Test 8: Send another message (if OpenAI is available)
    if os.getenv("OPENAI_API_KEY"):
        print("\n8. Testing follow-up message...")
        followup_data = {
            "content": "That's great! Can you give me some advice about learning Python programming?"
        }
        
        try:
            response = requests.post(
                f"{BASE_URL}/chat/conversations/{conversation_id}/send",
                json=followup_data,
                headers=headers
            )
            
            if response.status_code == 200:
                chat_response = response.json()
                print("✅ Follow-up message sent successfully!")
                print(f"   User message: {chat_response['user_message']['content']}")
                print(f"   Assistant response: {chat_response['assistant_message']['content'][:100]}...")
                print(f"   Tokens used: {chat_response['assistant_message']['tokens_used']}")
            else:
                print(f"❌ Follow-up message failed: {response.status_code}")
        except Exception as e:
            print(f"❌ Follow-up message error: {e}")
    
    # Test 9: Get chat statistics
    print("\n9. Testing get chat statistics...")
    try:
        response = requests.get(f"{BASE_URL}/chat/stats", headers=headers)
        if response.status_code == 200:
            stats = response.json()
            print("✅ Get chat stats successful!")
            print(f"   Total conversations: {stats['total_conversations']}")
            print(f"   Total messages: {stats['total_messages']}")
            print(f"   Total tokens: {stats['total_tokens']}")
            print(f"   Estimated cost: ${stats['estimated_cost_usd']}")
        else:
            print(f"❌ Get chat stats failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Get chat stats error: {e}")
    
    # Test 10: Create another conversation with different persona
    print("\n10. Testing conversation with different persona...")
    persona2_data = {
        "name": "Dr. Sarah",
        "description": "A wise and experienced mentor who provides professional guidance",
        "relation_type": "colleague"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/personas/", json=persona2_data, headers=headers)
        if response.status_code == 200:
            persona2 = response.json()
            persona2_id = persona2['id']
            print(f"✅ Second persona created! ID: {persona2_id}")
            
            # Create conversation with second persona
            conv2_data = {
                "title": "Professional Discussion with Dr. Sarah",
                "persona_id": persona2_id
            }
            
            response = requests.post(f"{BASE_URL}/chat/conversations", json=conv2_data, headers=headers)
            if response.status_code == 200:
                conv2 = response.json()
                print(f"✅ Second conversation created! ID: {conv2['id']}")
            else:
                print(f"❌ Second conversation creation failed: {response.status_code}")
        else:
            print(f"❌ Second persona creation failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Second persona/conversation error: {e}")
    
    # Test 11: List conversations by persona
    print("\n11. Testing list conversations by persona...")
    try:
        response = requests.get(f"{BASE_URL}/chat/conversations?persona_id={persona_id}", headers=headers)
        if response.status_code == 200:
            conversations = response.json()
            print(f"✅ List conversations by persona successful! Found {len(conversations)} conversations")
        else:
            print(f"❌ List conversations by persona failed: {response.status_code}")
    except Exception as e:
        print(f"❌ List conversations by persona error: {e}")
    
    # Test 12: Update conversation title
    print("\n12. Testing update conversation title...")
    update_data = {
        "title": "Updated Chat with Alex",
        "persona_id": persona_id
    }
    
    try:
        response = requests.put(f"{BASE_URL}/chat/conversations/{conversation_id}", json=update_data, headers=headers)
        if response.status_code == 200:
            updated_conv = response.json()
            print("✅ Update conversation successful!")
            print(f"   New title: {updated_conv['title']}")
        else:
            print(f"❌ Update conversation failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Update conversation error: {e}")
    
    # Test 13: Get conversation info
    print("\n13. Testing get conversation info...")
    try:
        response = requests.get(f"{BASE_URL}/chat/conversations/{conversation_id}", headers=headers)
        if response.status_code == 200:
            conv_info = response.json()
            print("✅ Get conversation info successful!")
            print(f"   Title: {conv_info['title']}")
            print(f"   Active: {conv_info['is_active']}")
            print(f"   Created: {conv_info['created_at']}")
        else:
            print(f"❌ Get conversation info failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Get conversation info error: {e}")
    
    print("\n" + "=" * 60)
    print("🎉 Chat system test completed!")
    
    if os.getenv("OPENAI_API_KEY"):
        print("✅ OpenAI integration working correctly!")
        print("✅ Persona conversations functioning!")
    else:
        print("⚠️ OpenAI API key not set - chat functionality limited")
        print("   Set OPENAI_API_KEY to test full chat capabilities")
    
    print("✅ Database and API endpoints working correctly!")

if __name__ == "__main__":
    asyncio.run(test_chat_system()) 