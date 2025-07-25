"""
OpenAI service for AI interactions and language processing
"""
import os
import time
import logging
import base64
from typing import List, Dict, Any, Optional, Union
from openai import OpenAI, RateLimitError, APIError, APIConnectionError, APITimeoutError
from fastapi import HTTPException, status

from app.config.settings import settings

# Configure logging
logger = logging.getLogger(__name__)


class OpenAIService:
    """Enhanced service for handling OpenAI API interactions."""
    
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self.client: Optional[OpenAI] = None
        self.default_model = settings.OPENAI_MODEL
        self.vision_model = settings.OPENAI_VISION_MODEL
        self.max_tokens = settings.OPENAI_MAX_TOKENS
        self.temperature = settings.OPENAI_TEMPERATURE
        self.max_retries = 3
        self.retry_delay = 1.0  # seconds
        self._initialized = False
        
        # API limits and rate limiting
        self.requests_per_minute = 60
        self.tokens_per_minute = 90000
        self.last_request_time = 0
        self.min_request_interval = 1.0  # seconds between requests
    
    def _initialize_client(self):
        """Initialize the OpenAI client if not already done."""
        if self._initialized:
            return
            
        if not self.api_key or self.api_key == "test-key-for-testing":
            # Don't initialize client for testing or missing API key
            self._initialized = True
            return
        
        self.client = OpenAI(api_key=self.api_key)
        self._initialized = True
    
    def is_available(self) -> bool:
        """Check if OpenAI service is available (API key is set)."""
        return bool(self.api_key and self.api_key != "test-key-for-testing")
    
    def _rate_limit_check(self):
        """Implement basic rate limiting."""
        current_time = time.time()
        time_since_last = current_time - self.last_request_time
        
        if time_since_last < self.min_request_interval:
            sleep_time = self.min_request_interval - time_since_last
            time.sleep(sleep_time)
        
        self.last_request_time = time.time()
    
    def _handle_openai_error(self, error: Exception, attempt: int):
        """Handle OpenAI API errors with appropriate retry logic."""
        if isinstance(error, RateLimitError):
            wait_time = min(2 ** attempt, 60)  # Exponential backoff, max 60 seconds
            logger.warning(f"Rate limit hit, waiting {wait_time} seconds (attempt {attempt})")
            time.sleep(wait_time)
        elif isinstance(error, (APIConnectionError, APITimeoutError)):
            wait_time = self.retry_delay * attempt
            logger.warning(f"Connection error, retrying in {wait_time} seconds (attempt {attempt})")
            time.sleep(wait_time)
        elif isinstance(error, APIError):
            logger.error(f"OpenAI API error: {error}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"OpenAI API error: {str(error)}"
            )
        else:
            logger.error(f"Unexpected OpenAI error: {error}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Unexpected error: {str(error)}"
            )
    
    async def generate_chat_completion(
        self, 
        messages: List[Dict[str, Any]],
        model: Optional[str] = None,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None
    ) -> Dict[str, Any]:
        """Generate a chat completion using OpenAI."""
        
        if not self.is_available():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="OpenAI service is not available. Please set OPENAI_API_KEY environment variable."
            )
        
        start_time = time.time()
        
        # Rate limiting check
        self._rate_limit_check()
        
        for attempt in range(1, self.max_retries + 1):
            try:
                # Initialize client if needed
                self._initialize_client()
                
                if self.client is None:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="OpenAI client not initialized"
                    )
                
                logger.info(f"Generating chat completion (attempt {attempt})")
                
                response = self.client.chat.completions.create(
                    model=model or self.default_model,
                    messages=messages,  # type: ignore
                    max_tokens=max_tokens or self.max_tokens,
                    temperature=temperature or self.temperature,
                    presence_penalty=0.1,  # Slightly encourage new topics
                    frequency_penalty=0.1   # Slightly reduce repetition
                )
                
                # Calculate response time
                response_time_ms = int((time.time() - start_time) * 1000)
                
                # Extract response
                assistant_message = response.choices[0].message.content
                tokens_used = response.usage.total_tokens if response.usage else None
                
                logger.info(f"Successfully generated chat completion in {response_time_ms}ms")
                
                return {
                    "content": assistant_message,
                    "tokens_used": tokens_used,
                    "model_used": model or self.default_model,
                    "response_time_ms": response_time_ms,
                    "finish_reason": response.choices[0].finish_reason
                }
                
            except (RateLimitError, APITimeoutError, APIConnectionError, APIError) as e:
                self._handle_openai_error(e, attempt)
                
            except Exception as e:
                logger.error(f"Unexpected error in generate_chat_completion: {e}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to generate response: {str(e)}"
                )
        
        # If we get here, all retries failed
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Failed to generate response after multiple attempts. Please try again later."
        )
    
    async def analyze_image_with_vision(
        self, 
        image_data: bytes, 
        prompt: str = "Describe what you see in this image.",
        model: Optional[str] = None
    ) -> Dict[str, Any]:
        """Analyze an image using OpenAI Vision API."""
        
        if not self.is_available():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="OpenAI service is not available. Please set OPENAI_API_KEY environment variable."
            )
        
        try:
            # Initialize client if needed
            self._initialize_client()
            
            if self.client is None:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="OpenAI client not initialized"
                )
            
            # Convert image to base64
            image_base64 = base64.b64encode(image_data).decode('utf-8')
            
            # Call OpenAI Vision API
            response = self.client.chat.completions.create(
                model=model or self.vision_model,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image_base64}"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=1000
            )
            
            return {
                "description": response.choices[0].message.content,
                "model_used": model or self.vision_model,
                "tokens_used": response.usage.total_tokens if response.usage else None
            }
            
        except Exception as e:
            logger.error(f"Image analysis failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Image analysis failed: {str(e)}"
            )
    
    async def analyze_text_for_personality(
        self, 
        text: str, 
        analysis_prompt: str,
        model: Optional[str] = None
    ) -> Dict[str, Any]:
        """Analyze text for personality traits using OpenAI."""
        
        if not self.is_available():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="OpenAI service is not available. Please set OPENAI_API_KEY environment variable."
            )
        
        try:
            # Initialize client if needed
            self._initialize_client()
            
            if self.client is None:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="OpenAI client not initialized"
                )
            
            # Call OpenAI API for personality analysis
            response = self.client.chat.completions.create(
                model=model or self.default_model,
                messages=[
                    {"role": "system", "content": "You are an expert in personality analysis. Provide detailed insights in JSON format."},
                    {"role": "user", "content": f"{analysis_prompt}\n\nText to analyze: {text}"}
                ],
                max_tokens=1000,
                temperature=0.3  # Lower temperature for more consistent analysis
            )
            
            return {
                "analysis": response.choices[0].message.content,
                "model_used": model or self.default_model,
                "tokens_used": response.usage.total_tokens if response.usage else None
            }
            
        except Exception as e:
            logger.error(f"Personality analysis failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Personality analysis failed: {str(e)}"
            )
    
    async def generate_text_embeddings(
        self, 
        texts: List[str],
        model: str = "text-embedding-ada-002"
    ) -> Dict[str, Any]:
        """Generate text embeddings using OpenAI."""
        
        if not self.is_available():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="OpenAI service is not available."
            )
        
        try:
            self._initialize_client()
            
            if self.client is None:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="OpenAI client not initialized"
                )
            
            response = self.client.embeddings.create(
                input=texts,
                model=model
            )
            
            embeddings = [data.embedding for data in response.data]
            
            return {
                "embeddings": embeddings,
                "model_used": model,
                "tokens_used": response.usage.total_tokens if response.usage else None
            }
            
        except Exception as e:
            logger.error(f"Embedding generation failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Embedding generation failed: {str(e)}"
            )
    
    def validate_api_key(self) -> bool:
        """Validate that the OpenAI API key is working."""
        if not self.is_available():
            return False
            
        try:
            self._initialize_client()
            # Make a simple test call
            if self.client is None:
                return False
            response = self.client.models.list()
            return True
        except Exception as e:
            logger.error(f"API key validation failed: {e}")
            return False
    
    def get_api_status(self) -> Dict[str, Any]:
        """Get detailed API status information."""
        try:
            self._initialize_client()
            if self.client is None:
                # Handle test environment or missing API key
                if not self.api_key or self.api_key == "test-key-for-testing":
                    return {
                        "status": "not_configured",
                        "message": "OpenAI API key not configured",
                        "api_key_configured": False
                    }
                return {"status": "error", "message": "Client not initialized"}
            
            # Test API connection
            models = self.client.models.list()
            
            return {
                "status": "healthy",
                "api_key_configured": bool(self.api_key),
                "models_available": len(models.data) if models.data else 0,
                "default_model": self.default_model,
                "vision_model": self.vision_model,
                "rate_limits": {
                    "requests_per_minute": self.requests_per_minute,
                    "tokens_per_minute": self.tokens_per_minute
                }
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "api_key_configured": bool(self.api_key)
            }


# Global OpenAI service instance
openai_service = OpenAIService() 