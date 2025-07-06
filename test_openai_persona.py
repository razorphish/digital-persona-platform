#!/usr/bin/env python3
"""
Comprehensive test of OpenAI service with persona chat functionality
"""
import asyncio
import os
from dotenv import load_dotenv
from app.services.openai_service import openai_service
from app.models.persona_db import Persona as DBPersona
from app.models.chat_db import ChatMessage as DBChatMessage

# Load environment variables
load_dotenv()

def create_mock_persona():
    """Create a mock persona for testing."""
    return DBPersona(
        id=1,
        user_id=1,
        name="Test Friend",
        description="A friendly test persona who loves to chat about technology and help people learn new things.",
        relation_type="friend",
        created_at=None,
        updated_at=None
    )

def create_mock_conversation_history():
    """Create mock conversation history."""
    return [
        DBChatMessage(
            id=1,
            conversation_id=1,
            role="user",
            content="Hello! How are you today?",
            created_at=None
        ),
        DBChatMessage(
            id=2,
            conversation_id=1,
            role="assistant",
            content="Hi there! I'm doing great, thanks for asking. I'm always excited to chat about new things!",
            created_at=None
        )
    ]

async def test_persona_chat():
    """Test the full persona chat functionality."""
    print("🧪 Testing OpenAI Persona Chat...")
    print("=" * 50)
    
    # Check if API key is available
    if not openai_service.is_available():
        print("❌ OpenAI service is not available")
        return False
    
    try:
        # Create mock persona and conversation
        persona = create_mock_persona()
        conversation_history = create_mock_conversation_history()
        
        print(f"✅ Created mock persona: {persona.name}")
        print(f"✅ Created conversation history with {len(conversation_history)} messages")
        
        # Test system prompt creation
        system_prompt = openai_service.create_persona_system_prompt(persona)
        print("✅ System prompt created successfully")
        print(f"   Prompt length: {len(system_prompt)} characters")
        
        # Test conversation formatting
        formatted_messages = openai_service.format_conversation_history(conversation_history)
        print(f"✅ Conversation formatted: {len(formatted_messages)} messages")
        
        # Test actual chat response
        user_message = "What's your favorite programming language and why?"
        print(f"🧪 Sending message: '{user_message}'")
        
        response = await openai_service.generate_response(
            persona=persona,
            user_message=user_message,
            conversation_history=conversation_history
        )
        
        print("✅ Response generated successfully!")
        print(f"   Content: {response['content'][:100]}...")
        print(f"   Tokens used: {response['tokens_used']}")
        print(f"   Model: {response['model_used']}")
        print(f"   Response time: {response['response_time_ms']}ms")
        
        return True
        
    except Exception as e:
        print(f"❌ Error during persona chat test: {e}")
        return False

async def test_simple_chat():
    """Test a simple chat without conversation history."""
    print("\n🧪 Testing Simple Chat...")
    print("=" * 30)
    
    try:
        persona = create_mock_persona()
        user_message = "Hello! Can you tell me a short joke?"
        
        print(f"🧪 Sending simple message: '{user_message}'")
        
        response = await openai_service.generate_response(
            persona=persona,
            user_message=user_message,
            conversation_history=[]
        )
        
        print("✅ Simple chat successful!")
        print(f"   Response: {response['content'][:150]}...")
        print(f"   Tokens: {response['tokens_used']}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error during simple chat test: {e}")
        return False

async def test_different_persona_types():
    """Test different persona relationship types."""
    print("\n🧪 Testing Different Persona Types...")
    print("=" * 40)
    
    persona_types = ["parent", "friend", "colleague"]
    
    for relation_type in persona_types:
        try:
            persona = DBPersona(
                id=1,
                user_id=1,
                name=f"Test {relation_type.title()}",
                description=f"A test {relation_type} persona",
                relation_type=relation_type,
                created_at=None,
                updated_at=None
            )
            
            user_message = "I'm feeling stressed about work today."
            print(f"🧪 Testing {relation_type} persona...")
            
            response = await openai_service.generate_response(
                persona=persona,
                user_message=user_message,
                conversation_history=[]
            )
            
            print(f"✅ {relation_type.title()} persona test successful!")
            print(f"   Response preview: {response['content'][:80]}...")
            
        except Exception as e:
            print(f"❌ Error testing {relation_type} persona: {e}")
            return False
    
    return True

async def main():
    """Run all tests."""
    print("🚀 Starting OpenAI Persona Chat Tests")
    print("=" * 60)
    
    tests = [
        ("Persona Chat", test_persona_chat),
        ("Simple Chat", test_simple_chat),
        ("Different Persona Types", test_different_persona_types)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        print(f"\n📋 Running {test_name} test...")
        try:
            result = await test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} test failed with exception: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 Test Results Summary:")
    print("=" * 60)
    
    passed = 0
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"   {test_name}: {status}")
        if result:
            passed += 1
    
    print(f"\n🎯 Overall: {passed}/{len(results)} tests passed")
    
    if passed == len(results):
        print("🎉 All tests passed! OpenAI persona chat is working correctly.")
    else:
        print("⚠️  Some tests failed. Please check the errors above.")

if __name__ == "__main__":
    asyncio.run(main()) 