"""
Computer Vision Service for image analysis capabilities
"""
import os
import time
import logging
import json
import base64
from typing import Dict, List, Any, Optional, Tuple
from pathlib import Path
from fastapi import HTTPException, status
from app.models.media_db import MediaFile as DBMediaFile
from app.models.ai_capabilities import ImageAnalysis as DBImageAnalysis
from app.models.persona_db import Persona as DBPersona
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.openai_service import openai_service

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ComputerVisionService:
    """Service for computer vision and image analysis capabilities."""
    
    def __init__(self):
        self.openai_client = None
        self.models_loaded = False
        
        # Note: OpenCV models will be loaded when needed
        # For now, we'll use OpenAI Vision API for all analysis
    
    async def analyze_image(
        self, 
        media_file: DBMediaFile, 
        persona: DBPersona,
        analysis_types: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Analyze an image with multiple AI capabilities."""
        
        if analysis_types is None:
            analysis_types = ['objects', 'faces', 'text', 'emotions']
        
        results = {}
        start_time = time.time()
        
        try:
            # Get image path
            image_path = self._get_image_path(media_file)
            if not os.path.exists(image_path):
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Image file not found"
                )
            
            # Perform different types of analysis
            for analysis_type in analysis_types:
                if analysis_type == 'objects':
                    results['objects'] = await self._detect_objects(image_path)
                elif analysis_type == 'faces':
                    results['faces'] = await self._detect_faces(image_path)
                elif analysis_type == 'text':
                    results['text'] = await self._extract_text(image_path)
                elif analysis_type == 'emotions':
                    results['emotions'] = await self._analyze_emotions(image_path)
                elif analysis_type == 'scene':
                    results['scene'] = await self._analyze_scene(image_path)
            
            processing_time_ms = int((time.time() - start_time) * 1000)
            
            return {
                'analysis_types': analysis_types,
                'results': results,
                'processing_time_ms': processing_time_ms,
                'image_info': {
                    'filename': media_file.filename,
                    'file_size': media_file.file_size,
                    'mime_type': media_file.mime_type
                }
            }
            
        except Exception as e:
            logger.error(f"Image analysis failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Image analysis failed: {str(e)}"
            )
    
    def _get_image_path(self, media_file: DBMediaFile) -> str:
        """Get the local file path for the media file."""
        if media_file.is_s3_stored and media_file.s3_url:
            # For S3 files, we might need to download temporarily
            # For now, assume local path exists
            return media_file.file_path
        else:
            return media_file.file_path
    
    async def _detect_objects(self, image_path: str) -> Dict[str, Any]:
        """Detect objects in the image using OpenAI Vision API."""
        try:
            if not openai_service.is_available():
                return {"error": "OpenAI service not available"}
            
            # Use OpenAI Vision API for object detection
            with open(image_path, "rb") as image_file:
                image_data = image_file.read()
                image_base64 = base64.b64encode(image_data).decode('utf-8')
                
                response = await openai_service.analyze_image_with_vision(
                    image_data,
                    prompt="Describe all objects, people, animals, and items visible in this image. Include their positions and any notable details."
                )
            
            return {
                "objects": response.get("description", ""),
                "model": "gpt-4-vision-preview"
            }
            
        except Exception as e:
            logger.error(f"Object detection failed: {e}")
            return {"error": str(e)}
    
    async def _detect_faces(self, image_path: str) -> Dict[str, Any]:
        """Detect faces in the image using OpenAI Vision API."""
        try:
            if not openai_service.is_available():
                return {"error": "OpenAI service not available"}
            
            # Use OpenAI Vision API for face detection
            with open(image_path, "rb") as image_file:
                image_data = image_file.read()
                
                response = await openai_service.analyze_image_with_vision(
                    image_data,
                    prompt="Count and describe all faces visible in this image. Include their positions, expressions, and any notable features."
                )
            
            return {
                "faces_analysis": response.get("description", ""),
                "model": "gpt-4-vision-preview"
            }
            
        except Exception as e:
            logger.error(f"Face detection failed: {e}")
            return {"error": str(e)}
    
    async def _extract_text(self, image_path: str) -> Dict[str, Any]:
        """Extract text from image using OpenAI Vision API."""
        try:
            if not openai_service.is_available():
                return {"error": "OpenAI service not available"}
            
            # Use OpenAI Vision API for text extraction
            with open(image_path, "rb") as image_file:
                image_data = image_file.read()
                
                response = await openai_service.analyze_image_with_vision(
                    image_data,
                    prompt="Extract and list all text visible in this image. Include any signs, labels, or written content."
                )
            
            return {
                "extracted_text": response.get("description", ""),
                "model": "gpt-4-vision-preview"
            }
            
        except Exception as e:
            logger.error(f"Text extraction failed: {e}")
            return {"error": str(e)}
    
    async def _analyze_emotions(self, image_path: str) -> Dict[str, Any]:
        """Analyze emotions in the image using OpenAI Vision API."""
        try:
            if not openai_service.is_available():
                return {"error": "OpenAI service not available"}
            
            # Use OpenAI Vision API for emotion analysis
            with open(image_path, "rb") as image_file:
                image_data = image_file.read()
                
                response = await openai_service.analyze_image_with_vision(
                    image_data,
                    prompt="Analyze the emotions and mood conveyed in this image. Consider facial expressions, colors, lighting, and overall atmosphere."
                )
            
            return {
                "emotion_analysis": response.get("description", ""),
                "model": "gpt-4-vision-preview"
            }
            
        except Exception as e:
            logger.error(f"Emotion analysis failed: {e}")
            return {"error": str(e)}
    
    async def _analyze_scene(self, image_path: str) -> Dict[str, Any]:
        """Analyze the overall scene and context of the image."""
        try:
            if not openai_service.is_available():
                return {"error": "OpenAI service not available"}
            
            # Use OpenAI Vision API for scene analysis
            with open(image_path, "rb") as image_file:
                image_data = image_file.read()
                
                response = await openai_service.analyze_image_with_vision(
                    image_data,
                    prompt="Describe the overall scene, setting, and context of this image. Include location, time of day, weather, and any notable environmental factors."
                )
            
            return {
                "scene_description": response.get("description", ""),
                "model": "gpt-4-vision-preview"
            }
            
        except Exception as e:
            logger.error(f"Scene analysis failed: {e}")
            return {"error": str(e)}
    
    async def save_analysis_results(
        self, 
        db: AsyncSession,
        media_file: DBMediaFile,
        persona: DBPersona,
        analysis_results: Dict[str, Any]
    ) -> DBImageAnalysis:
        """Save analysis results to the database."""
        try:
            analysis = DBImageAnalysis(
                media_file_id=media_file.id,
                persona_id=persona.id,
                analysis_type="comprehensive",
                results=json.dumps(analysis_results),
                confidence=0.9,  # High confidence for comprehensive analysis
                model_used="openai-vision",
                processing_time_ms=analysis_results.get('processing_time_ms', 0)
            )
            
            db.add(analysis)
            await db.commit()
            await db.refresh(analysis)
            
            return analysis
            
        except Exception as e:
            logger.error(f"Failed to save analysis results: {e}")
            await db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to save analysis results: {str(e)}"
            )


# Global computer vision service instance
computer_vision_service = ComputerVisionService() 