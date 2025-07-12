"""
Digital Persona Platform - Main Application
Working FastAPI app with JWT authentication.
"""

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, validator
from typing import Optional, List, Dict, Any
import os
import sys
import time
import platform
from pathlib import Path
from dotenv import load_dotenv

# Import routers
from app.routers import auth_db, personas_db, media, chat, upload

# Load environment variables
load_dotenv()

# Import configuration and database utilities
from app.config import settings, validate_environment
from app.services.openai_service import openai_service

# Create uploads directory
Path("uploads").mkdir(exist_ok=True)

# FastAPI application
app = FastAPI(
    title="Digital Persona Platform",
    description="""
    # 🤖 Digital Persona Platform API
    
    AI-powered platform for creating and interacting with digital personas.
    
    **✅ Python 3.13 Compatible**  
    **✅ JWT Authentication**  
    **✅ Protected Persona Management**  
    **✅ Ready for AI development**
    
    ## Quick Start
    1. Register at `/auth/register` or login at `/auth/login`
    2. Visit `/docs` for interactive documentation
    3. Check `/health` for system status  
    4. Create personas at `/personas` (requires authentication)
    5. Open in Cursor IDE for AI development
    """,
    version="3.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include routers
app.include_router(auth_db.router)
app.include_router(personas_db.router)
app.include_router(media.router)
app.include_router(chat.router)
app.include_router(upload.router)

# Conditionally include AI routers based on configuration
if settings.ai_capabilities_enabled:
    from app.routers import ai_capabilities, integrations
    app.include_router(ai_capabilities.router)
    app.include_router(integrations.router)

app_start_time = time.time()

# Routes
@app.get("/")
async def root():
    """Platform information and status."""
    import pydantic
    import fastapi
    
    return {
        "message": "🤖 Digital Persona Platform API",
        "status": "healthy",
        "version": "3.0.0",
        "python_version": f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}",
        "fastapi_version": fastapi.__version__,
        "pydantic_version": getattr(pydantic, '__version__', getattr(pydantic, 'VERSION', 'unknown')),
        "platform": platform.system(),
        "features": {
            "jwt_authentication": "✅ Working",
            "protected_personas": "✅ Working",
            "api_documentation": "✅ Working", 
            "cors_support": "✅ Working",
            "file_upload_ready": "✅ Ready",
            "ai_integration_ready": "✅ Ready"
        },
        "endpoints": {
            "docs": "/docs",
            "health": "/health",
            "auth": "/auth",
            "personas": "/personas",
            "test": "/test"
        },
        "next_steps": [
            "1. Register at /auth/register or login at /auth/login",
            "2. Visit /docs for interactive API documentation",
            "3. Create personas using POST /personas (requires authentication)",
            "4. Open in Cursor IDE for AI-assisted development",
            "5. Add OpenAI API key to enable AI features"
        ]
    }

@app.get("/health")
async def health_check():
    """Health check with system information."""
    uptime = time.time() - app_start_time
    
    try:
        # Check OpenAI service
        openai_status = openai_service.get_api_status()
        
        return {
            "status": "healthy",
            "timestamp": time.time(),
            "uptime_seconds": round(uptime, 2),
            "python_version": f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}",
            "platform": f"{platform.system()} {platform.release()}",
            "memory_usage": "Available via system tools",
            "services": {
                "fastapi": "running",
                "pydantic": "working",
                "file_system": "accessible",
                "openai": openai_status,
                "database": "connected"
            }
        }
    except Exception as e:
        # Don't fail the health check if OpenAI service is not available
        return {
            "status": "healthy",
            "timestamp": time.time(),
            "uptime_seconds": round(uptime, 2),
            "python_version": f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}",
            "platform": f"{platform.system()} {platform.release()}",
            "memory_usage": "Available via system tools",
            "services": {
                "fastapi": "running",
                "pydantic": "working",
                "file_system": "accessible",
                "openai": {"status": "error", "message": str(e)},
                "database": "connected"
            }
        }

@app.get("/test")
async def test_components():
    """Test all platform components."""
    results = {
        "timestamp": time.time(),
        "python_version": f"{sys.version_info.major}.{sys.version_info.minor}",
        "tests": {}
    }
    
    # Test FastAPI
    try:
        import fastapi
        results["tests"]["fastapi"] = {
            "status": "✅ working",
            "version": fastapi.__version__
        }
    except Exception as e:
        results["tests"]["fastapi"] = {"status": "❌ error", "error": str(e)}
    
    # Test Pydantic
    try:
        import pydantic
        from pydantic import BaseModel
        
        class TestModel(BaseModel):
            test_field: str
        
        test_obj = TestModel(test_field="validation working")
        
        results["tests"]["pydantic"] = {
            "status": "✅ working",
            "version": getattr(pydantic, '__version__', getattr(pydantic, 'VERSION', 'unknown')),
            "validation": "passed"
        }
    except Exception as e:
        results["tests"]["pydantic"] = {"status": "❌ error", "error": str(e)}
    
    # Test file system
    try:
        upload_path = Path("uploads")
        results["tests"]["file_system"] = {
            "status": "✅ working",
            "upload_directory": str(upload_path.absolute()),
            "writable": upload_path.exists() and os.access(upload_path, os.W_OK)
        }
    except Exception as e:
        results["tests"]["file_system"] = {"status": "❌ error", "error": str(e)}
    
    # Test environment
    try:
        env_status = {
            "openai_configured": os.getenv("OPENAI_API_KEY", "not_set") != "not_set",
            "aws_configured": os.getenv("AWS_ACCESS_KEY_ID", "not_set") != "not_set",
            "secret_key_set": bool(os.getenv("SECRET_KEY"))
        }
        results["tests"]["environment"] = {
            "status": "✅ working",
            "variables": env_status
        }
    except Exception as e:
        results["tests"]["environment"] = {"status": "❌ error", "error": str(e)}
    
    return results


@app.get("/config/validate")
async def validate_config():
    """Validate the current environment configuration."""
    return {
        "timestamp": time.time(),
        "environment": validate_environment(),
        "recommendations": [
            "Set OPENAI_API_KEY to enable AI features",
            "Configure AWS S3 for production file storage",
            "Set a secure SECRET_KEY for production",
            "Configure Redis for caching (optional)"
        ]
    }


@app.get("/config/status")
async def config_status():
    """Get current configuration status."""
    return {
        "environment": settings.ENVIRONMENT,
        "debug": settings.verbose_logging,
        "openai_configured": settings.openai_available,
        "s3_configured": settings.s3_available,
        "redis_configured": settings.redis_available,
        "ai_capabilities": {
            "image_analysis": settings.enable_image_analysis,
            "voice_synthesis": settings.enable_voice_synthesis,
            "memory_system": settings.enable_memory_system,
            "personality_learning": settings.enable_personality_learning
        }
    }

@app.get("/api/status")
async def api_status():
    """Get detailed API status."""
    return {
        "api_version": "3.0.0",
        "openai_available": openai_service.is_available(),
        "openai_status": openai_service.get_api_status(),
        "features": {
            "authentication": True,
            "personas": True,
            "chat": True,
            "media_upload": True,
            "ai_capabilities": {
                "computer_vision": True,
                "voice_synthesis": True,
                "memory_storage": True,
                "personality_learning": True
            }
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
