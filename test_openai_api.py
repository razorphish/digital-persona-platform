#!/usr/bin/env python3
"""
Direct test of OpenAI API with the provided key
"""
from dotenv import load_dotenv
import os
from openai import OpenAI

# Load environment variables
load_dotenv()

def test_openai_api():
    """Test OpenAI API directly."""
    print("🔍 Testing OpenAI API Directly...")
    print("=" * 40)
    
    # Get API key
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("❌ OPENAI_API_KEY not found in environment")
        return False
    
    print(f"✅ API Key found: {api_key[:20]}...")
    
    try:
        # Create client
        client = OpenAI(api_key=api_key)
        print("✅ OpenAI client created successfully")
        
        # Test with a simple API call
        print("🧪 Testing API call...")
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": "Hello! Just say 'API test successful'"}],
            max_tokens=10
        )
        
        content = response.choices[0].message.content
        print(f"✅ API Response: {content}")
        
        # Check usage
        if response.usage:
            print(f"✅ Tokens used: {response.usage.total_tokens}")
        
        return True
        
    except Exception as e:
        print(f"❌ API Error: {e}")
        return False

if __name__ == "__main__":
    success = test_openai_api()
    if success:
        print("=" * 40)
        print("🎉 OpenAI API test successful!")
    else:
        print("=" * 40)
        print("❌ OpenAI API test failed!") 