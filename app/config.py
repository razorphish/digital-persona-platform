"""
Configuration management for Digital Persona Platform
"""
import os
from typing import List, Optional
from pydantic import BaseSettings, validator
from pathlib import Path


class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    # Database Configuration
    database_url: str = "sqlite+aiosqlite:///./digital_persona.db"
    
    # Security & Authentication
    secret_key: str = "your-super-secret-key-here-change-this-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    
    # OpenAI Configuration
    openai_api_key: Optional[str] = None
    openai_model: str = "gpt-4-turbo-preview"
    openai_vision_model: str = "gpt-4-vision-preview"
    openai_max_tokens: int = 4000
    openai_temperature: float = 0.7
    
    # AWS S3 Configuration (Optional)
    aws_access_key_id: Optional[str] = None
    aws_secret_access_key: Optional[str] = None
    aws_region: str = "us-east-1"
    aws_s3_bucket: Optional[str] = None
    aws_s3_endpoint_url: str = "https://s3.amazonaws.com"
    
    # Redis Configuration (Optional)
    redis_url: Optional[str] = None
    redis_db: int = 0
    
    # File Upload Configuration
    max_file_size: int = 10485760  # 10MB
    allowed_file_types: str = "image/jpeg,image/png,image/gif,video/mp4,audio/mpeg,audio/wav"
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
    debug: bool = True
    environment: str = "development"  # Options: development, staging, production
    log_level: str = "INFO"
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    
    # Server Configuration
    host: str = "0.0.0.0"
    port: int = 8000
    workers: int = 1
    
    # Monitoring & Analytics (Optional)
    enable_metrics: bool = False
    metrics_port: int = 9090
    sentry_dsn: Optional[str] = None
    
    # Development Tools
    verbose_logging: bool = False
    enable_test_endpoints: bool = False
    
    @validator('cors_origins', pre=True)
    def parse_cors_origins(cls, v):
        """Parse CORS origins from comma-separated string."""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(',')]
        return v
    
    @validator('allowed_file_types', pre=True)
    def parse_allowed_file_types(cls, v):
        """Parse allowed file types from comma-separated string."""
        if isinstance(v, str):
            return [file_type.strip() for file_type in v.split(',')]
        return v
    
    @property
    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self.environment.lower() == "production"
    
    @property
    def is_development(self) -> bool:
        """Check if running in development environment."""
        return self.environment.lower() == "development"
    
    @property
    def openai_available(self) -> bool:
        """Check if OpenAI API is configured."""
        return bool(self.openai_api_key)
    
    @property
    def s3_available(self) -> bool:
        """Check if AWS S3 is configured."""
        return all([
            self.aws_access_key_id,
            self.aws_secret_access_key,
            self.aws_s3_bucket
        ])
    
    @property
    def redis_available(self) -> bool:
        """Check if Redis is configured."""
        return bool(self.redis_url)
    
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
        case_sensitive = False


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
            "url": settings.database_url
        },
        "security": {
            "status": "✅ Configured" if settings.secret_key != "your-super-secret-key-here-change-this-in-production" else "⚠️ Using default key",
            "algorithm": settings.algorithm
        },
        "openai": {
            "status": "✅ Configured" if settings.openai_available else "❌ Not configured",
            "model": settings.openai_model,
            "vision_model": settings.openai_vision_model
        },
        "aws_s3": {
            "status": "✅ Configured" if settings.s3_available else "⚠️ Not configured (optional)",
            "bucket": settings.aws_s3_bucket
        },
        "redis": {
            "status": "✅ Configured" if settings.redis_available else "⚠️ Not configured (optional)",
            "url": settings.redis_url
        },
        "ai_capabilities": {
            "image_analysis": "✅ Enabled" if settings.enable_image_analysis else "❌ Disabled",
            "voice_synthesis": "✅ Enabled" if settings.enable_voice_synthesis else "❌ Disabled",
            "memory_system": "✅ Enabled" if settings.enable_memory_system else "❌ Disabled",
            "personality_learning": "✅ Enabled" if settings.enable_personality_learning else "❌ Disabled"
        },
        "environment": {
            "mode": settings.environment,
            "debug": settings.debug,
            "log_level": settings.log_level
        }
    }
    
    return validation_results 