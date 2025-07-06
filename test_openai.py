#!/usr/bin/env python3
"""
Test script to verify OpenAI API key configuration
"""
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

def test_openai_config():
    """Test OpenAI configuration."""
    print("🔍 Testing OpenAI Configuration...")
    print("=" * 40)
    
    # Check if API key is set
    api_key = os.getenv("OPENAI_API_KEY")
    if api_key:
        print("✅ OPENAI_API_KEY is set")
        print(f"   Key starts with: {api_key[:20]}...")
    else:
        print("❌ OPENAI_API_KEY is not set")
        return False
    
    # Test OpenAI service
    try:
        from app.services.openai_service import openai_service
        print("✅ OpenAI service imported successfully")
        
        # Check availability
        if openai_service.is_available():
            print("✅ OpenAI service is available")
        else:
            print("❌ OpenAI service is not available")
            return False
        
        # Test API key validation
        if openai_service.validate_api_key():
            print("✅ OpenAI API key is valid")
        else:
            print("❌ OpenAI API key validation failed")
            return False
            
    except Exception as e:
        print(f"❌ Error testing OpenAI service: {e}")
        return False
    
    print("=" * 40)
    print("🎉 All OpenAI tests passed!")
    return True

if __name__ == "__main__":
    test_openai_config() 