"""
Computer Vision Service for image analysis capabilities
"""
import os
import time
import logging
import json
import base64
from typing import Dict, List, Any, Optional
from pathlib import Path
import cv2
import numpy as np
from PIL import Image
from fastapi import HTTPException, status

from app.config.settings import settings
from app.services.openai_service import openai_service

# Configure logging
logger = logging.getLogger(__name__)


class ComputerVisionService:
    """Service for computer vision and image analysis capabilities."""
    
    def __init__(self):
        self.models_loaded = False
        self.available_analysis_types = settings.CV_ANALYSIS_TYPES
        self.max_image_size = settings.MAX_IMAGE_SIZE
        
        # OpenCV and traditional CV models (to be loaded on demand)
        self.face_cascade = None
        self.eye_cascade = None
    
    async def initialize(self):
        """Initialize computer vision models."""
        try:
            logger.info("Initializing computer vision models...")
            
            # Load OpenCV models
            self._load_opencv_models()
            
            self.models_loaded = True
            logger.info("Computer vision models initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize computer vision models: {e}")
            self.models_loaded = False
    
    def _load_opencv_models(self):
        """Load OpenCV pre-trained models."""
        try:
            # Load face detection cascade
            face_cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            if os.path.exists(face_cascade_path):
                self.face_cascade = cv2.CascadeClassifier(face_cascade_path)
                logger.info("Face detection model loaded")
            
            # Load eye detection cascade
            eye_cascade_path = cv2.data.haarcascades + 'haarcascade_eye.xml'
            if os.path.exists(eye_cascade_path):
                self.eye_cascade = cv2.CascadeClassifier(eye_cascade_path)
                logger.info("Eye detection model loaded")
                
        except Exception as e:
            logger.warning(f"Failed to load OpenCV models: {e}")
    
    async def analyze_image(
        self, 
        image_data: bytes,
        analysis_types: Optional[List[str]] = None,
        use_openai: bool = True
    ) -> Dict[str, Any]:
        """Analyze an image with multiple AI capabilities."""
        
        if analysis_types is None:
            analysis_types = ['objects', 'faces', 'text', 'emotions']
        
        # Validate analysis types
        invalid_types = [t for t in analysis_types if t not in self.available_analysis_types]
        if invalid_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid analysis types: {invalid_types}. Available: {self.available_analysis_types}"
            )
        
        results = {}
        start_time = time.time()
        
        try:
            # Validate image size
            if len(image_data) > self.max_image_size:
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"Image size exceeds maximum allowed size of {self.max_image_size} bytes"
                )
            
            # Convert bytes to image format for OpenCV processing
            image_array = np.frombuffer(image_data, np.uint8)
            cv_image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
            
            if cv_image is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid image format"
                )
            
            # Perform different types of analysis
            for analysis_type in analysis_types:
                if analysis_type == 'objects':
                    if use_openai and openai_service.is_available():
                        results['objects'] = await self._detect_objects_openai(image_data)
                    else:
                        results['objects'] = await self._detect_objects_opencv(cv_image)
                        
                elif analysis_type == 'faces':
                    if use_openai and openai_service.is_available():
                        results['faces'] = await self._detect_faces_openai(image_data)
                    else:
                        results['faces'] = await self._detect_faces_opencv(cv_image)
                        
                elif analysis_type == 'text':
                    if use_openai and openai_service.is_available():
                        results['text'] = await self._extract_text_openai(image_data)
                    else:
                        results['text'] = await self._extract_text_opencv(cv_image)
                        
                elif analysis_type == 'emotions':
                    if use_openai and openai_service.is_available():
                        results['emotions'] = await self._analyze_emotions_openai(image_data)
                    else:
                        results['emotions'] = {"message": "Emotion analysis requires OpenAI"}
                        
                elif analysis_type == 'scene':
                    if use_openai and openai_service.is_available():
                        results['scene'] = await self._analyze_scene_openai(image_data)
                    else:
                        results['scene'] = await self._analyze_scene_opencv(cv_image)
            
            processing_time_ms = int((time.time() - start_time) * 1000)
            
            return {
                'analysis_types': analysis_types,
                'results': results,
                'processing_time_ms': processing_time_ms,
                'models_used': 'openai' if use_openai and openai_service.is_available() else 'opencv',
                'image_info': {
                    'size_bytes': len(image_data),
                    'dimensions': f"{cv_image.shape[1]}x{cv_image.shape[0]}" if cv_image is not None else "unknown"
                }
            }
            
        except Exception as e:
            logger.error(f"Image analysis failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Image analysis failed: {str(e)}"
            )
    
    # OpenAI-based analysis methods
    async def _detect_objects_openai(self, image_data: bytes) -> Dict[str, Any]:
        """Detect objects using OpenAI Vision API."""
        try:
            response = await openai_service.analyze_image_with_vision(
                image_data,
                prompt="Describe all objects, people, animals, and items visible in this image. Include their positions and any notable details. Format as a detailed list."
            )
            
            return {
                "objects_description": response.get("description", ""),
                "model": response.get("model_used", "gpt-4-vision-preview"),
                "tokens_used": response.get("tokens_used", 0)
            }
            
        except Exception as e:
            logger.error(f"OpenAI object detection failed: {e}")
            return {"error": str(e)}
    
    async def _detect_faces_openai(self, image_data: bytes) -> Dict[str, Any]:
        """Detect faces using OpenAI Vision API."""
        try:
            response = await openai_service.analyze_image_with_vision(
                image_data,
                prompt="Count and describe all faces visible in this image. Include their positions, expressions, estimated age ranges, and any notable features. If no faces are visible, state that clearly."
            )
            
            return {
                "faces_analysis": response.get("description", ""),
                "model": response.get("model_used", "gpt-4-vision-preview"),
                "tokens_used": response.get("tokens_used", 0)
            }
            
        except Exception as e:
            logger.error(f"OpenAI face detection failed: {e}")
            return {"error": str(e)}
    
    async def _extract_text_openai(self, image_data: bytes) -> Dict[str, Any]:
        """Extract text using OpenAI Vision API."""
        try:
            response = await openai_service.analyze_image_with_vision(
                image_data,
                prompt="Extract and list all text visible in this image. Include any signs, labels, handwritten text, or printed content. If no text is visible, state that clearly."
            )
            
            return {
                "extracted_text": response.get("description", ""),
                "model": response.get("model_used", "gpt-4-vision-preview"),
                "tokens_used": response.get("tokens_used", 0)
            }
            
        except Exception as e:
            logger.error(f"OpenAI text extraction failed: {e}")
            return {"error": str(e)}
    
    async def _analyze_emotions_openai(self, image_data: bytes) -> Dict[str, Any]:
        """Analyze emotions using OpenAI Vision API."""
        try:
            response = await openai_service.analyze_image_with_vision(
                image_data,
                prompt="Analyze the emotions and mood visible in this image. Look at facial expressions, body language, and overall atmosphere. Describe the emotions you can detect and their intensity."
            )
            
            return {
                "emotion_analysis": response.get("description", ""),
                "model": response.get("model_used", "gpt-4-vision-preview"),
                "tokens_used": response.get("tokens_used", 0)
            }
            
        except Exception as e:
            logger.error(f"OpenAI emotion analysis failed: {e}")
            return {"error": str(e)}
    
    async def _analyze_scene_openai(self, image_data: bytes) -> Dict[str, Any]:
        """Analyze scene using OpenAI Vision API."""
        try:
            response = await openai_service.analyze_image_with_vision(
                image_data,
                prompt="Describe the overall scene, setting, and context of this image. Include location type, time of day, weather conditions, and any notable environmental factors."
            )
            
            return {
                "scene_description": response.get("description", ""),
                "model": response.get("model_used", "gpt-4-vision-preview"),
                "tokens_used": response.get("tokens_used", 0)
            }
            
        except Exception as e:
            logger.error(f"OpenAI scene analysis failed: {e}")
            return {"error": str(e)}
    
    # OpenCV-based analysis methods (fallback)
    async def _detect_objects_opencv(self, cv_image: np.ndarray) -> Dict[str, Any]:
        """Basic object detection using OpenCV (limited capabilities)."""
        try:
            # Simple contour detection as a basic object detection
            gray = cv2.cvtColor(cv_image, cv2.COLOR_BGR2GRAY)
            edges = cv2.Canny(gray, 50, 150)
            contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            # Filter significant contours
            significant_contours = [c for c in contours if cv2.contourArea(c) > 100]
            
            return {
                "objects_detected": len(significant_contours),
                "method": "opencv_contours",
                "note": "Basic contour detection - use OpenAI for detailed object recognition"
            }
            
        except Exception as e:
            logger.error(f"OpenCV object detection failed: {e}")
            return {"error": str(e)}
    
    async def _detect_faces_opencv(self, cv_image: np.ndarray) -> Dict[str, Any]:
        """Detect faces using OpenCV Haar cascades."""
        try:
            if self.face_cascade is None:
                return {"error": "Face detection model not loaded"}
            
            gray = cv2.cvtColor(cv_image, cv2.COLOR_BGR2GRAY)
            faces = self.face_cascade.detectMultiScale(gray, 1.1, 4)
            
            face_data = []
            for (x, y, w, h) in faces:
                face_data.append({
                    "position": {"x": int(x), "y": int(y), "width": int(w), "height": int(h)},
                    "confidence": "unknown"  # Haar cascades don't provide confidence scores
                })
            
            return {
                "faces_detected": len(faces),
                "faces": face_data,
                "method": "opencv_haar_cascades"
            }
            
        except Exception as e:
            logger.error(f"OpenCV face detection failed: {e}")
            return {"error": str(e)}
    
    async def _extract_text_opencv(self, cv_image: np.ndarray) -> Dict[str, Any]:
        """Extract text using OpenCV (requires additional OCR library like tesseract)."""
        try:
            # Note: This is a placeholder. For full OCR, you'd need to install pytesseract
            # For now, return a message indicating the limitation
            return {
                "extracted_text": "",
                "method": "opencv_placeholder",
                "note": "OpenCV text extraction requires additional OCR libraries. Use OpenAI for text extraction."
            }
            
        except Exception as e:
            logger.error(f"OpenCV text extraction failed: {e}")
            return {"error": str(e)}
    
    async def _analyze_scene_opencv(self, cv_image: np.ndarray) -> Dict[str, Any]:
        """Basic scene analysis using OpenCV."""
        try:
            # Basic image properties analysis
            height, width, channels = cv_image.shape
            
            # Calculate basic color statistics
            mean_color = np.mean(cv_image, axis=(0, 1))
            
            # Brightness analysis
            gray = cv2.cvtColor(cv_image, cv2.COLOR_BGR2GRAY)
            brightness = np.mean(gray)
            
            return {
                "image_properties": {
                    "dimensions": f"{width}x{height}",
                    "channels": channels,
                    "brightness": float(brightness),
                    "dominant_colors": {
                        "blue": float(mean_color[0]),
                        "green": float(mean_color[1]),
                        "red": float(mean_color[2])
                    }
                },
                "method": "opencv_basic_analysis",
                "note": "Basic image analysis - use OpenAI for detailed scene understanding"
            }
            
        except Exception as e:
            logger.error(f"OpenCV scene analysis failed: {e}")
            return {"error": str(e)}
    
    def get_service_status(self) -> Dict[str, Any]:
        """Get computer vision service status."""
        return {
            "models_loaded": self.models_loaded,
            "available_analysis_types": self.available_analysis_types,
            "max_image_size": self.max_image_size,
            "openai_available": openai_service.is_available(),
            "opencv_models": {
                "face_cascade": self.face_cascade is not None,
                "eye_cascade": self.eye_cascade is not None
            }
        }


# Global computer vision service instance
cv_service = ComputerVisionService() 