"""
Configuration settings for Python ML Service
"""
import os
from typing import List, Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """ML Service configuration settings."""
    
    # Service Configuration
    SERVICE_NAME: str = "digital-persona-ml-service"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"
    
    # Server Configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8001
    WORKERS: int = 1
    
    # Security
    SECRET_KEY: str = "ml-service-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    
    # OpenAI Configuration
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4-turbo-preview"
    OPENAI_VISION_MODEL: str = "gpt-4-vision-preview"
    OPENAI_MAX_TOKENS: int = 4000
    OPENAI_TEMPERATURE: float = 0.7
    
    # AWS S3 Configuration
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_DEFAULT_REGION: str = "us-west-1"
    S3_BUCKET_NAME: Optional[str] = None
    
    # ML Model Configuration
    ENABLE_COMPUTER_VISION: bool = True
    ENABLE_VOICE_SYNTHESIS: bool = True
    ENABLE_MEMORY_SYSTEM: bool = True
    ENABLE_PERSONALITY_LEARNING: bool = True
    
    # Memory/Vector Database Configuration
    CHROMA_DB_PATH: str = "./chroma_db"
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    VECTOR_DIMENSION: int = 384
    
    # Voice Synthesis Configuration
    DEFAULT_TTS_ENGINE: str = "edge"
    EDGE_TTS_VOICE: str = "en-US-JennyNeural"
    AUDIO_OUTPUT_DIR: str = "./audio_output"
    
    # Computer Vision Configuration
    CV_ANALYSIS_TYPES: List[str] = ["objects", "faces", "text", "emotions", "scene"]
    MAX_IMAGE_SIZE: int = 10 * 1024 * 1024  # 10MB
    
    # Performance Configuration
    MAX_CONCURRENT_REQUESTS: int = 10
    REQUEST_TIMEOUT: int = 300  # 5 minutes
    
    # File Processing Configuration
    MAX_FILE_SIZE: int = 100 * 1024 * 1024  # 100MB
    ALLOWED_IMAGE_TYPES: List[str] = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    ALLOWED_AUDIO_TYPES: List[str] = ["audio/mpeg", "audio/wav", "audio/ogg"]
    
    # CORS Configuration
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8000",
    ]
    
    # Health Check Configuration
    HEALTH_CHECK_INTERVAL: int = 30  # seconds
    
    # Service Discovery (for connecting to Next.js service)
    NEXTJS_SERVICE_URL: str = "http://localhost:3000"
    NEXTJS_API_TOKEN: Optional[str] = None
    
    # Model Loading Configuration
    PRELOAD_MODELS: bool = True
    MODEL_CACHE_SIZE: int = 3  # Number of models to keep in memory
    
    @property
    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self.ENVIRONMENT.lower() == "production"
    
    @property
    def is_development(self) -> bool:
        """Check if running in development environment."""
        return self.ENVIRONMENT.lower() == "development"
    
    @property
    def openai_available(self) -> bool:
        """Check if OpenAI API is configured."""
        return bool(self.OPENAI_API_KEY)
    
    @property
    def s3_available(self) -> bool:
        """Check if S3 is configured."""
        return bool(self.AWS_ACCESS_KEY_ID and self.AWS_SECRET_ACCESS_KEY and self.S3_BUCKET_NAME)
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()


def get_settings() -> Settings:
    """Get application settings."""
    return settings 