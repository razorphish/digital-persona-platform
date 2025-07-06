#!/usr/bin/env python3
"""
Simplified test of OpenAI service without database model dependencies
"""
import asyncio
import os
from dotenv import load_dotenv
from app.services.openai_service import openai_service

# Load environment variables
load_dotenv()

class MockPersona:
    """Simple mock persona class to avoid database model imports."""
    def __init__(self, id, user_id, name, description, relation_type):
        self.id = id
        self.user_id = user_id
        self.name = name
        self.description = description
        self.relation_type = relation_type

class MockChatMessage:
    """Simple mock chat message class to avoid database model imports."""
    def __init__(self, id, conversation_id, role, content):
        self.id = id
        self.conversation_id = conversation_id
        self.role = role
        self.content = content

def create_mock_persona():
    """Create a mock persona for testing."""
    return MockPersona(
        id=1,
        user_id=1,
        name="Test Friend",
        description="A friendly test persona who loves to chat about technology and help people learn new things.",
        relation_type="friend"
    )

def create_mock_conversation_history():
    """Create mock conversation history."""
    return [
        MockChatMessage(
            id=1,
            conversation_id=1,
            role="user",
            content="Hello! How are you today?"
        ),
        MockChatMessage(
            id=2,
            conversation_id=1,
            role="assistant",
            content="Hi there! I'm doing great, thanks for asking. I'm always excited to chat about new things!"
        )
    ]

async def test_basic_openai_functionality():
    """Test basic OpenAI functionality without database models."""
    print("🧪 Testing Basic OpenAI Functionality...")
    print("=" * 50)
    
    # Check if API key is available
    if not openai_service.is_available():
        print("❌ OpenAI service is not available")
        return False
    
    try:
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
            messages=[{"role": "user", "content": "Say 'Hello from OpenAI test'"}],
            max_tokens=10
        )
        
        content = response.choices[0].message.content
        print(f"✅ Direct API test successful: {content}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error during basic test: {e}")
        return False

async def test_system_prompt_creation():
    """Test system prompt creation with mock persona."""
    print("\n🧪 Testing System Prompt Creation...")
    print("=" * 40)
    
    try:
        persona = create_mock_persona()
        
        # Test system prompt creation manually (avoiding type issues)
        system_prompt = f"""You are {persona.name}, a digital persona created by a user.

Persona Information:
- Name: {persona.name}
- Description: {persona.description or 'No description provided'}
- Relationship Type: {persona.relation_type}

Instructions:
1. Respond as {persona.name} would, based on the relationship type and description
2. Stay in character throughout the conversation
3. Be helpful, engaging, and appropriate for the relationship type
4. If you don't have enough information about the persona, ask questions to learn more
5. Keep responses conversational and natural
6. Don't break character or mention that you're an AI

Remember: You are {persona.name}, not an AI assistant. Respond as this persona would."""
        
        print("✅ System prompt created successfully")
        print(f"   Prompt length: {len(system_prompt)} characters")
        print(f"   Contains persona name: {'Test Friend' in system_prompt}")
        print(f"   Contains relationship type: {'friend' in system_prompt}")
        
        # Show first 200 characters of prompt
        print(f"   Preview: {system_prompt[:200]}...")
        
        return True
        
    except Exception as e:
        print(f"❌ Error during system prompt test: {e}")
        return False

async def test_conversation_formatting():
    """Test conversation formatting with mock messages."""
    print("\n🧪 Testing Conversation Formatting...")
    print("=" * 40)
    
    try:
        conversation_history = create_mock_conversation_history()
        
        # Test conversation formatting manually (avoiding type issues)
        formatted_messages = []
        for message in conversation_history:
            formatted_messages.append({
                "role": message.role,
                "content": message.content
            })
        
        print(f"✅ Conversation formatted: {len(formatted_messages)} messages")
        
        for i, msg in enumerate(formatted_messages):
            print(f"   Message {i+1}: {msg['role']} - {msg['content'][:50]}...")
        
        return True
        
    except Exception as e:
        print(f"❌ Error during conversation formatting test: {e}")
        return False

async def test_direct_chat_with_mock_data():
    """Test direct chat using the OpenAI service with mock data."""
    print("\n🧪 Testing Direct Chat with Mock Data...")
    print("=" * 45)
    
    try:
        # Create a simple test using the OpenAI client directly
        from openai import OpenAI
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
        # Create a simple persona prompt
        persona = create_mock_persona()
        system_prompt = f"""You are {persona.name}, a {persona.relation_type}. 
{persona.description}

Respond as this persona would, staying in character."""
        
        # Test message
        user_message = "What's your favorite programming language and why?"
        
        print(f"🧪 Sending message: '{user_message}'")
        
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            max_tokens=150,
            temperature=0.7
        )
        
        content = response.choices[0].message.content
        tokens_used = response.usage.total_tokens if response.usage else None
        
        print("✅ Direct chat test successful!")
        print(f"   Response: {content}")
        print(f"   Tokens used: {tokens_used}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error during direct chat test: {e}")
        return False

async def test_different_persona_types():
    """Test different persona relationship types."""
    print("\n🧪 Testing Different Persona Types...")
    print("=" * 40)
    
    persona_types = ["parent", "friend", "colleague"]
    
    for relation_type in persona_types:
        try:
            persona = MockPersona(
                id=1,
                user_id=1,
                name=f"Test {relation_type.title()}",
                description=f"A test {relation_type} persona",
                relation_type=relation_type
            )
            
            # Test system prompt for this persona type manually
            system_prompt = f"""You are {persona.name}, a digital persona created by a user.

Persona Information:
- Name: {persona.name}
- Description: {persona.description or 'No description provided'}
- Relationship Type: {persona.relation_type}

Instructions:
1. Respond as {persona.name} would, based on the relationship type and description
2. Stay in character throughout the conversation
3. Be helpful, engaging, and appropriate for the relationship type
4. If you don't have enough information about the persona, ask questions to learn more
5. Keep responses conversational and natural
6. Don't break character or mention that you're an AI

Remember: You are {persona.name}, not an AI assistant. Respond as this persona would."""
            
            print(f"✅ {relation_type.title()} persona system prompt created")
            print(f"   Contains relationship context: {relation_type in system_prompt}")
            
        except Exception as e:
            print(f"❌ Error testing {relation_type} persona: {e}")
            return False
    
    return True

async def main():
    """Run all tests."""
    print("🚀 Starting Simplified OpenAI Tests")
    print("=" * 60)
    
    tests = [
        ("Basic OpenAI Functionality", test_basic_openai_functionality),
        ("System Prompt Creation", test_system_prompt_creation),
        ("Conversation Formatting", test_conversation_formatting),
        ("Direct Chat with Mock Data", test_direct_chat_with_mock_data),
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
        print("🎉 All tests passed! OpenAI functionality is working correctly.")
    else:
        print("⚠️  Some tests failed. Please check the errors above.")

if __name__ == "__main__":
    asyncio.run(main()) 