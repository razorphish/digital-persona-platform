"""
OpenAI router for AI processing endpoints
"""
import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, status, UploadFile, File, Form
from pydantic import BaseModel, Field

from app.services.openai_service import openai_service

logger = logging.getLogger(__name__)

router = APIRouter()


# Pydantic models
class ChatMessage(BaseModel):
    role: str = Field(..., description="Message role: 'user', 'assistant', or 'system'")
    content: str = Field(..., description="Message content")


class ChatCompletionRequest(BaseModel):
    messages: List[ChatMessage] = Field(..., description="List of chat messages")
    model: Optional[str] = Field(None, description="Model to use (optional)")
    max_tokens: Optional[int] = Field(None, description="Maximum tokens to generate")
    temperature: Optional[float] = Field(None, description="Sampling temperature")


class ChatCompletionResponse(BaseModel):
    content: str
    tokens_used: Optional[int]
    model_used: str
    response_time_ms: int
    finish_reason: Optional[str]


class ImageAnalysisRequest(BaseModel):
    prompt: str = Field(default="Describe what you see in this image.", description="Analysis prompt")
    model: Optional[str] = Field(None, description="Vision model to use")


class ImageAnalysisResponse(BaseModel):
    description: str
    model_used: str
    tokens_used: Optional[int]


class PersonalityAnalysisRequest(BaseModel):
    text: str = Field(..., description="Text to analyze")
    analysis_prompt: str = Field(..., description="Analysis instructions")
    model: Optional[str] = Field(None, description="Model to use")


class PersonalityAnalysisResponse(BaseModel):
    analysis: str
    model_used: str
    tokens_used: Optional[int]


class EmbeddingRequest(BaseModel):
    texts: List[str] = Field(..., description="List of texts to embed")
    model: str = Field(default="text-embedding-ada-002", description="Embedding model")


class EmbeddingResponse(BaseModel):
    embeddings: List[List[float]]
    model_used: str
    tokens_used: Optional[int]


# Endpoints
@router.post("/chat/completions", response_model=ChatCompletionResponse)
async def generate_chat_completion(request: ChatCompletionRequest):
    """Generate a chat completion using OpenAI."""
    try:
        # Convert Pydantic models to dict format expected by OpenAI service
        messages = [{"role": msg.role, "content": msg.content} for msg in request.messages]
        
        result = await openai_service.generate_chat_completion(
            messages=messages,
            model=request.model,
            max_tokens=request.max_tokens,
            temperature=request.temperature
        )
        
        return ChatCompletionResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chat completion failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chat completion failed: {str(e)}"
        )


@router.post("/vision/analyze", response_model=ImageAnalysisResponse)
async def analyze_image(
    file: UploadFile = File(..., description="Image file to analyze"),
    prompt: str = Form(default="Describe what you see in this image.", description="Analysis prompt"),
    model: Optional[str] = Form(None, description="Vision model to use")
):
    """Analyze an image using OpenAI Vision API."""
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File must be an image"
            )
        
        # Read image data
        image_data = await file.read()
        
        if len(image_data) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Empty image file"
            )
        
        result = await openai_service.analyze_image_with_vision(
            image_data=image_data,
            prompt=prompt,
            model=model
        )
        
        return ImageAnalysisResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Image analysis failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Image analysis failed: {str(e)}"
        )


@router.post("/text/personality-analysis", response_model=PersonalityAnalysisResponse)
async def analyze_personality(request: PersonalityAnalysisRequest):
    """Analyze text for personality traits using OpenAI."""
    try:
        result = await openai_service.analyze_text_for_personality(
            text=request.text,
            analysis_prompt=request.analysis_prompt,
            model=request.model
        )
        
        return PersonalityAnalysisResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Personality analysis failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Personality analysis failed: {str(e)}"
        )


@router.post("/embeddings", response_model=EmbeddingResponse)
async def generate_embeddings(request: EmbeddingRequest):
    """Generate text embeddings using OpenAI."""
    try:
        result = await openai_service.generate_text_embeddings(
            texts=request.texts,
            model=request.model
        )
        
        return EmbeddingResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Embedding generation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Embedding generation failed: {str(e)}"
        )


@router.get("/status")
async def get_openai_status():
    """Get OpenAI service status and configuration."""
    try:
        return {
            "available": openai_service.is_available(),
            "status": openai_service.get_api_status(),
            "models": {
                "chat": openai_service.default_model,
                "vision": openai_service.vision_model
            },
            "configuration": {
                "max_tokens": openai_service.max_tokens,
                "temperature": openai_service.temperature,
                "max_retries": openai_service.max_retries
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to get OpenAI status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get status: {str(e)}"
        )


@router.get("/models")
async def list_available_models():
    """List available OpenAI models."""
    try:
        if not openai_service.is_available():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="OpenAI service not available"
            )
        
        return {
            "chat_models": [
                "gpt-4-turbo-preview",
                "gpt-4",
                "gpt-3.5-turbo"
            ],
            "vision_models": [
                "gpt-4-vision-preview"
            ],
            "embedding_models": [
                "text-embedding-ada-002",
                "text-embedding-3-small",
                "text-embedding-3-large"
            ],
            "default_chat_model": openai_service.default_model,
            "default_vision_model": openai_service.vision_model
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to list models: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list models: {str(e)}"
        ) 