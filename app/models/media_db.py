"""
Media file database model for tracking uploaded images and videos with S3 support
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import Integer, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base


class MediaFile(Base):
    """Database model for tracking uploaded media files with S3 support."""
    __tablename__ = "media_files"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    file_id: Mapped[str] = mapped_column(String(36), nullable=False, unique=True)  # UUID for S3 key generation
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)  # Local path (legacy)
    s3_key: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)  # S3 object key
    s3_bucket: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # S3 bucket name
    s3_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)  # S3 URL
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    media_type: Mapped[str] = mapped_column(String(20), nullable=False)  # 'images', 'videos', or 'other'
    upload_method: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)  # 'simple', 'multipart', 'presigned'
    is_s3_stored: Mapped[bool] = mapped_column(Boolean, default=False)  # Whether file is stored in S3
    persona_id: Mapped[int] = mapped_column(Integer, ForeignKey("personas.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    persona = relationship("Persona", back_populates="media_files")
    user = relationship("User", back_populates="media_files") 