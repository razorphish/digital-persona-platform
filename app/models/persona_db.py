from sqlalchemy import String, Integer, DateTime, ForeignKey, Text, Boolean, JSON, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from app.models.base import Base

class Persona(Base):
    __tablename__ = "personas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    description: Mapped[str] = mapped_column(String(255), nullable=True)
    relation_type: Mapped[str] = mapped_column(String(32), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    status: Mapped[str] = mapped_column(String(32), default="active")
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Enhanced AI capabilities
    personality_traits: Mapped[str] = mapped_column(JSON, nullable=True)  # JSON object with personality traits
    voice_settings: Mapped[str] = mapped_column(JSON, nullable=True)  # Voice synthesis settings
    memory_enabled: Mapped[bool] = mapped_column(Boolean, default=True)  # Whether memory is enabled
    learning_enabled: Mapped[bool] = mapped_column(Boolean, default=True)  # Whether personality learning is enabled
    image_analysis_enabled: Mapped[bool] = mapped_column(Boolean, default=True)  # Whether image analysis is enabled
    voice_synthesis_enabled: Mapped[bool] = mapped_column(Boolean, default=True)  # Whether voice synthesis is enabled
    
    # Personality learning data
    learned_preferences: Mapped[str] = mapped_column(JSON, nullable=True)  # Learned user preferences
    conversation_patterns: Mapped[str] = mapped_column(JSON, nullable=True)  # Learned conversation patterns
    emotional_responses: Mapped[str] = mapped_column(JSON, nullable=True)  # Learned emotional responses
    
    # Memory and context
    memory_context: Mapped[str] = mapped_column(Text, nullable=True)  # Current memory context
    last_interaction: Mapped[datetime] = mapped_column(DateTime, nullable=True)  # Last interaction timestamp
    interaction_count: Mapped[int] = mapped_column(Integer, default=0)  # Total interactions

    user = relationship("User", back_populates="personas")
    media_files = relationship("MediaFile", back_populates="persona", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="persona", cascade="all, delete-orphan")
    memories = relationship("PersonaMemory", back_populates="persona", cascade="all, delete-orphan") 