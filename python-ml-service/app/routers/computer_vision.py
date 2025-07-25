"""
Computer Vision router for image analysis endpoints
"""
import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, status, UploadFile, File, Form
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

router = APIRouter()


# Pydantic models
class ImageAnalysisRequest(BaseModel):
    analysis_types: List[str] = Field(default=["objects", "faces", "text", "emotions"], description="Types of analysis to perform")
    use_openai: bool = Field(default=True, description="Whether to use OpenAI Vision API")


class ImageAnalysisResponse(BaseModel):
    analysis_types: List[str]
    results: Dict[str, Any]
    processing_time_ms: int
    models_used: str
    image_info: Dict[str, Any]


@router.post("/analyze", response_model=ImageAnalysisResponse)
async def analyze_image(
    file: UploadFile = File(..., description="Image file to analyze"),
    analysis_types: str = Form(default="objects,faces,text,emotions", description="Comma-separated analysis types"),
    use_openai: bool = Form(default=True, description="Whether to use OpenAI Vision API")
):
    """Analyze an image with multiple computer vision capabilities."""
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File must be an image"
            )
        
        # Parse analysis types
        analysis_types_list = [t.strip() for t in analysis_types.split(',') if t.strip()]
        
        # Read image data
        image_data = await file.read()
        
        if len(image_data) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Empty image file"
            )
        
        # Import and use computer vision service
        try:
            from app.services.computer_vision_service import cv_service
            
            result = await cv_service.analyze_image(
                image_data=image_data,
                analysis_types=analysis_types_list,
                use_openai=use_openai
            )
            
            return ImageAnalysisResponse(**result)
            
        except ImportError:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Computer vision service not available"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Image analysis failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Image analysis failed: {str(e)}"
        )


@router.get("/status")
async def get_cv_status():
    """Get computer vision service status."""
    try:
        from app.services.computer_vision_service import cv_service
        return cv_service.get_service_status()
        
    except ImportError:
        return {
            "status": "not_available",
            "message": "Computer vision service not available"
        }
    except Exception as e:
        logger.error(f"Failed to get CV status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get status: {str(e)}"
        )


@router.get("/capabilities")
async def get_cv_capabilities():
    """Get available computer vision capabilities."""
    try:
        from app.config.settings import settings
        
        return {
            "available_analysis_types": settings.CV_ANALYSIS_TYPES,
            "max_image_size": settings.MAX_IMAGE_SIZE,
            "enabled": settings.ENABLE_COMPUTER_VISION,
            "engines": {
                "openai_vision": True,
                "opencv": True
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to get CV capabilities: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get capabilities: {str(e)}"
        ) 