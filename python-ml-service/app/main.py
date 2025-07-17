"""
Digital Persona Platform - Python ML Service
FastAPI application for AI and ML capabilities
"""

import os
import sys
import time
import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

# Import configuration
from app.config.settings import settings

# Import routers
from app.routers import health, openai_service, computer_vision, voice_synthesis, memory, personality_learning

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Create necessary directories
Path(settings.AUDIO_OUTPUT_DIR).mkdir(parents=True, exist_ok=True)
Path(settings.CHROMA_DB_PATH).mkdir(parents=True, exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    logger.info(f"Starting {settings.SERVICE_NAME} v{settings.VERSION}")
    
    # Initialize ML models if enabled
    if settings.PRELOAD_MODELS:
        await initialize_ml_models()
    
    yield
    
    # Shutdown
    logger.info("Shutting down ML service")


async def initialize_ml_models():
    """Initialize ML models on startup."""
    try:
        logger.info("Initializing ML models...")
        
        # TODO: Initialize services after they are created
        # Initialize embedding model for memory service
        # if settings.ENABLE_MEMORY_SYSTEM:
        #     from app.services.memory_service import memory_service
        #     await memory_service.initialize()
        #     logger.info("Memory service initialized")
        
        logger.info("ML models initialization placeholder - services to be created")
        
    except Exception as e:
        logger.error(f"Failed to initialize ML models: {e}")
        # Don't fail startup, just log the error


# Create FastAPI application
app = FastAPI(
    title="Digital Persona ML Service",
    description="""
    # 🤖 Digital Persona Platform - ML Service
    
    Microservice providing AI and ML capabilities for the Digital Persona Platform.
    
    ## Features
    - 🧠 **OpenAI Integration**: Chat completions, image analysis, text processing
    - 👁️ **Computer Vision**: Object detection, face analysis, scene understanding
    - 🔊 **Voice Synthesis**: Text-to-speech with multiple engines
    - 💾 **Memory System**: Vector embeddings and semantic search
    - 📚 **Personality Learning**: Adaptive persona traits from interactions
    
    ## Service Information
    - **Version**: {version}
    - **Environment**: {environment}
    - **Port**: {port}
    
    ## Health Checks
    - `/health` - Service health status
    - `/health/models` - ML model status
    - `/health/dependencies` - External service status
    """.format(
        version=settings.VERSION,
        environment=settings.ENVIRONMENT,
        port=settings.PORT
    ),
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response middleware
@app.middleware("http")
async def add_process_time_header(request, call_next):
    """Add processing time to response headers."""
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

# Include routers
app.include_router(health.router, prefix="/health", tags=["Health"])
app.include_router(openai_service.router, prefix="/openai", tags=["OpenAI"])

# Conditionally include AI capability routers
if settings.ENABLE_COMPUTER_VISION:
    app.include_router(computer_vision.router, prefix="/cv", tags=["Computer Vision"])

if settings.ENABLE_VOICE_SYNTHESIS:
    app.include_router(voice_synthesis.router, prefix="/voice", tags=["Voice Synthesis"])

if settings.ENABLE_MEMORY_SYSTEM:
    app.include_router(memory.router, prefix="/memory", tags=["Memory"])

if settings.ENABLE_PERSONALITY_LEARNING:
    app.include_router(personality_learning.router, prefix="/learning", tags=["Personality Learning"])


# Root endpoint
@app.get("/")
async def root():
    """Service information and status."""
    return {
        "service": settings.SERVICE_NAME,
        "version": settings.VERSION,
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "capabilities": {
            "openai": settings.openai_available,
            "computer_vision": settings.ENABLE_COMPUTER_VISION,
            "voice_synthesis": settings.ENABLE_VOICE_SYNTHESIS,
            "memory_system": settings.ENABLE_MEMORY_SYSTEM,
            "personality_learning": settings.ENABLE_PERSONALITY_LEARNING,
            "s3_integration": settings.s3_available,
        },
        "endpoints": {
            "docs": "/docs",
            "health": "/health",
            "openai": "/openai",
            "computer_vision": "/cv",
            "voice_synthesis": "/voice",
            "memory": "/memory",
            "personality_learning": "/learning",
        }
    }


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": "An unexpected error occurred",
            "type": "internal_error"
        }
    )


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        workers=settings.WORKERS,
        log_level=settings.LOG_LEVEL.lower(),
        reload=settings.is_development
    ) 