"""
Health check router for ML service monitoring
"""
import time
import logging
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, status

from app.config.settings import settings
from app.services.openai_service import openai_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/")
async def health_check() -> Dict[str, Any]:
    """Basic health check endpoint."""
    return {
        "status": "healthy",
        "service": settings.SERVICE_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "timestamp": time.time()
    }


@router.get("/detailed")
async def detailed_health_check() -> Dict[str, Any]:
    """Detailed health check with service dependencies."""
    try:
        health_status = {
            "service": {
                "name": settings.SERVICE_NAME,
                "version": settings.VERSION,
                "environment": settings.ENVIRONMENT,
                "status": "healthy"
            },
            "dependencies": {
                "openai": {
                    "available": openai_service.is_available(),
                    "status": openai_service.get_api_status()
                }
            },
            "capabilities": {
                "computer_vision": settings.ENABLE_COMPUTER_VISION,
                "voice_synthesis": settings.ENABLE_VOICE_SYNTHESIS,
                "memory_system": settings.ENABLE_MEMORY_SYSTEM,
                "personality_learning": settings.ENABLE_PERSONALITY_LEARNING
            },
            "timestamp": time.time()
        }
        
        # Add computer vision status if enabled
        if settings.ENABLE_COMPUTER_VISION:
            try:
                from app.services.computer_vision_service import cv_service
                health_status["dependencies"]["computer_vision"] = cv_service.get_service_status()
            except ImportError:
                health_status["dependencies"]["computer_vision"] = {"status": "not_available"}
        
        return health_status
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Health check failed: {str(e)}"
        )


@router.get("/models")
async def models_health_check() -> Dict[str, Any]:
    """Check the status of ML models."""
    try:
        models_status = {
            "openai": {
                "available": openai_service.is_available(),
                "models": ["gpt-4-turbo-preview", "gpt-4-vision-preview"] if openai_service.is_available() else []
            }
        }
        
        # Add computer vision models if enabled
        if settings.ENABLE_COMPUTER_VISION:
            try:
                from app.services.computer_vision_service import cv_service
                models_status["computer_vision"] = {
                    "loaded": cv_service.models_loaded,
                    "opencv_available": True
                }
            except ImportError:
                models_status["computer_vision"] = {
                    "loaded": False,
                    "opencv_available": False
                }
        
        return {
            "models_status": models_status,
            "timestamp": time.time()
        }
        
    except Exception as e:
        logger.error(f"Models health check failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Models health check failed: {str(e)}"
        )


@router.get("/readiness")
async def readiness_check() -> Dict[str, Any]:
    """Kubernetes readiness probe endpoint."""
    try:
        # Check if essential services are ready
        ready = True
        issues = []
        
        # Check OpenAI if required
        if not openai_service.is_available() and settings.openai_available:
            ready = False
            issues.append("OpenAI service not available")
        
        if ready:
            return {
                "status": "ready",
                "timestamp": time.time()
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail={"status": "not_ready", "issues": issues}
            )
            
    except Exception as e:
        logger.error(f"Readiness check failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Service not ready: {str(e)}"
        )


@router.get("/liveness")
async def liveness_check() -> Dict[str, Any]:
    """Kubernetes liveness probe endpoint."""
    return {
        "status": "alive",
        "timestamp": time.time()
    } 