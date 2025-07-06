"""
AI Capabilities database models for advanced features
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import Integer, String, DateTime, ForeignKey, Text, Boolean, JSON, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base


class PersonaMemory(Base):
    """Database model for storing persona memories and context."""
    __tablename__ = "persona_memories"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    persona_id: Mapped[int] = mapped_column(Integer, ForeignKey("personas.id", ondelete="CASCADE"), nullable=False)
    memory_type: Mapped[str] = mapped_column(String(50), nullable=False)  # 'conversation', 'preference', 'fact', 'emotion'
    content: Mapped[str] = mapped_column(Text, nullable=False)  # The actual memory content
    context: Mapped[str] = mapped_column(JSON, nullable=True)  # Additional context as JSON
    importance: Mapped[float] = mapped_column(Float, default=1.0)  # Memory importance (0.0 to 1.0)
    last_accessed: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)  # For temporary memories
    
    # Relationships
    persona = relationship("Persona", back_populates="memories")


class ImageAnalysis(Base):
    """Database model for storing image analysis results."""
    __tablename__ = "image_analyses"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    media_file_id: Mapped[int] = mapped_column(Integer, ForeignKey("media_files.id", ondelete="CASCADE"), nullable=False)
    persona_id: Mapped[int] = mapped_column(Integer, ForeignKey("personas.id", ondelete="CASCADE"), nullable=False)
    analysis_type: Mapped[str] = mapped_column(String(50), nullable=False)  # 'objects', 'faces', 'text', 'emotions'
    results: Mapped[str] = mapped_column(JSON, nullable=False)  # Analysis results as JSON
    confidence: Mapped[float] = mapped_column(Float, nullable=True)  # Confidence score
    model_used: Mapped[str] = mapped_column(String(100), nullable=True)  # AI model used for analysis
    processing_time_ms: Mapped[int] = mapped_column(Integer, nullable=True)  # Processing time in milliseconds
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Relationships
    media_file = relationship("MediaFile", back_populates="analyses")
    persona = relationship("Persona")


class VoiceSynthesis(Base):
    """Database model for storing voice synthesis data."""
    __tablename__ = "voice_syntheses"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    persona_id: Mapped[int] = mapped_column(Integer, ForeignKey("personas.id", ondelete="CASCADE"), nullable=False)
    message_id: Mapped[int] = mapped_column(Integer, ForeignKey("chat_messages.id", ondelete="CASCADE"), nullable=False)
    audio_file_path: Mapped[str] = mapped_column(String(500), nullable=False)  # Path to generated audio file
    s3_key: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)  # S3 key if stored in cloud
    voice_settings: Mapped[str] = mapped_column(JSON, nullable=True)  # Voice settings used
    processing_time_ms: Mapped[int] = mapped_column(Integer, nullable=True)  # Processing time in milliseconds
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Relationships
    persona = relationship("Persona")
    message = relationship("ChatMessage")


class PersonalityLearning(Base):
    """Database model for tracking personality learning from interactions."""
    __tablename__ = "personality_learnings"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    persona_id: Mapped[int] = mapped_column(Integer, ForeignKey("personas.id", ondelete="CASCADE"), nullable=False)
    learning_type: Mapped[str] = mapped_column(String(50), nullable=False)  # 'preference', 'pattern', 'emotion', 'context'
    data: Mapped[str] = mapped_column(JSON, nullable=False)  # Learning data as JSON
    confidence: Mapped[float] = mapped_column(Float, default=1.0)  # Confidence in the learning
    source_conversation_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("conversations.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Relationships
    persona = relationship("Persona")
    source_conversation = relationship("Conversation") 