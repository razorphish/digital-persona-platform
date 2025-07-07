"""
Configuration management for Digital Persona Platform
"""
import os
from typing import List, Optional
from pydantic_settings import BaseSettings
from pathlib import Path
from pydantic import EmailStr


class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    # Database Configuration
    DATABASE_URL: str = "sqlite+aiosqlite:///./digital_persona.db"
    
    # Security & Authentication
    SECRET_KEY: str = "your-secret-key-here-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    refresh_token_expire_days: int = 7
    
    # OpenAI Configuration
    OPENAI_API_KEY: Optional[str] = None
    openai_model: str = "gpt-4-turbo-preview"
    openai_vision_model: str = "gpt-4-vision-preview"
    openai_max_tokens: int = 4000
    openai_temperature: float = 0.7
    
    # AWS S3 Configuration (Optional)
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_DEFAULT_REGION: str = "us-east-1"
    S3_BUCKET_NAME: Optional[str] = None
    aws_s3_endpoint_url: str = "https://s3.amazonaws.com"
    
    # Redis Configuration (Optional)
    REDIS_URL: str = "redis://localhost:6379"
    REDIS_PASSWORD: Optional[str] = None
    
    # File Upload Configuration
    MAX_FILE_SIZE: int = 100 * 1024 * 1024  # 100MB
    allowed_file_types: List[str] = ["image/jpeg", "image/png", "image/gif", "video/mp4", "audio/mpeg", "audio/wav"]
    upload_dir: str = "uploads"
    
    # AI Capabilities Configuration
    enable_image_analysis: bool = True
    image_analysis_models: str = "openai_vision"
    
    enable_voice_synthesis: bool = True
    default_tts_engine: str = "edge"  # Options: edge, gtts
    edge_tts_voice: str = "en-US-JennyNeural"
    
    enable_memory_system: bool = True
    memory_embedding_model: str = "all-MiniLM-L6-v2"
    chroma_db_path: str = "./chroma_db"
    
    enable_personality_learning: bool = True
    learning_confidence_threshold: float = 0.7
    
    # Application Configuration
    LOG_LEVEL: str = "INFO"
    ENVIRONMENT: str = "development"  # Options: development, staging, production
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8000",
    ]
    
    # Server Configuration
    host: str = "0.0.0.0"
    port: int = 8000
    workers: int = 1
    
    # Monitoring & Analytics (Optional)
    ENABLE_METRICS: bool = True
    METRICS_PORT: int = 9090
    sentry_dsn: Optional[str] = None
    
    # Development Tools
    verbose_logging: bool = False
    enable_test_endpoints: bool = False
    
    # Security
    RATE_LIMIT_ENABLED: bool = True
    
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
        """Check if AWS S3 is configured."""
        return all([
            self.AWS_ACCESS_KEY_ID,
            self.AWS_SECRET_ACCESS_KEY,
            self.S3_BUCKET_NAME
        ])
    
    @property
    def redis_available(self) -> bool:
        """Check if Redis is configured."""
        return bool(self.REDIS_URL)
    
    def get_upload_path(self) -> Path:
        """Get the upload directory path."""
        upload_path = Path(self.upload_dir)
        upload_path.mkdir(parents=True, exist_ok=True)
        return upload_path
    
    def get_chroma_db_path(self) -> Path:
        """Get the ChromaDB directory path."""
        chroma_path = Path(self.chroma_db_path)
        chroma_path.mkdir(parents=True, exist_ok=True)
        return chroma_path
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


# Create global settings instance
settings = Settings()


def get_settings() -> Settings:
    """Get the application settings."""
    return settings


def validate_environment() -> dict:
    """Validate the current environment configuration."""
    validation_results = {
        "database": {
            "status": "✅ Configured",
            "url": settings.DATABASE_URL
        },
        "security": {
            "status": "✅ Configured" if settings.SECRET_KEY != "your-super-secret-key-here-change-this-in-production" else "⚠️ Using default key",
            "algorithm": settings.ALGORITHM
        },
        "openai": {
            "status": "✅ Configured" if settings.openai_available else "❌ Not configured",
            "model": settings.openai_model,
            "vision_model": settings.openai_vision_model
        },
        "aws_s3": {
            "status": "✅ Configured" if settings.s3_available else "⚠️ Not configured (optional)",
            "bucket": settings.S3_BUCKET_NAME
        },
        "redis": {
            "status": "✅ Configured" if settings.redis_available else "⚠️ Not configured (optional)",
            "url": settings.REDIS_URL
        },
        "ai_capabilities": {
            "image_analysis": "✅ Enabled" if settings.enable_image_analysis else "❌ Disabled",
            "voice_synthesis": "✅ Enabled" if settings.enable_voice_synthesis else "❌ Disabled",
            "memory_system": "✅ Enabled" if settings.enable_memory_system else "❌ Disabled",
            "personality_learning": "✅ Enabled" if settings.enable_personality_learning else "❌ Disabled"
        },
        "environment": {
            "mode": settings.ENVIRONMENT,
            "debug": settings.verbose_logging,
            "log_level": settings.LOG_LEVEL
        }
    }
    
    return validation_results 