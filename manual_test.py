"""
Manual test without TestClient - use this instead of pytest for now.
"""

def test_app_creation():
    """Test that the app can be created."""
    from app.main import app
    assert app.title == "Digital Persona Platform"
    print("✅ App creation test passed")

def test_pydantic_models():
    """Test Pydantic models work."""
    from app.routers.personas_db import PersonaCreate, PersonaResponse
    
    # Test creation
    persona_data = PersonaCreate(
        name="Test Person",
        description="A test",
        relation_type="friend"
    )
    assert persona_data.name == "Test Person"
    print("✅ Pydantic validation test passed")

def test_persona_response():
    """Test persona response model."""
    from app.routers.personas_db import PersonaResponse
    
    persona = PersonaResponse(
        id=1,
        name="Test",
        description="A test persona",
        relation_type="friend",
        created_at="2024-01-01 12:00:00",
        status="active",
        user_id=1
    )
    assert persona.id == 1
    print("✅ Persona response test passed")

if __name__ == "__main__":
    print("🧪 Running manual tests...")
    test_app_creation()
    test_pydantic_models()
    test_persona_response()
    print("🎉 All manual tests passed!")
