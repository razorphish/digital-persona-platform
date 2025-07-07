from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, JSON, ForeignKey, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models.base import Base
from datetime import datetime
from typing import Optional, Dict, Any


class SocialMediaIntegration(Base):
    __tablename__ = "social_media_integrations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    platform = Column(String(50), nullable=False)  # 'twitter', 'facebook'
    platform_user_id = Column(String(255), nullable=False)
    platform_username = Column(String(255), nullable=False)
    access_token = Column(Text, nullable=False)
    refresh_token = Column(Text, nullable=True)
    token_expires_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    last_sync_at = Column(DateTime, nullable=True)
    sync_frequency_hours = Column(Integer, default=24)  # How often to sync
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Platform-specific metadata
    platform_metadata = Column(JSON, nullable=True)  # Store platform-specific data
    
    # Relationship
    user = relationship("User", back_populates="social_integrations")
    social_posts = relationship("SocialMediaPost", back_populates="integration", cascade="all, delete-orphan")


class SocialMediaPost(Base):
    __tablename__ = "social_media_posts"

    id = Column(Integer, primary_key=True, index=True)
    integration_id = Column(Integer, ForeignKey("social_media_integrations.id"), nullable=False)
    platform_post_id = Column(String(255), nullable=False, unique=True)
    post_type = Column(String(50), nullable=False)  # 'post', 'comment', 'like', 'share'
    content = Column(Text, nullable=True)
    media_urls = Column(JSON, nullable=True)  # Array of media URLs
    hashtags = Column(JSON, nullable=True)  # Array of hashtags
    mentions = Column(JSON, nullable=True)  # Array of mentioned users
    likes_count = Column(Integer, default=0)
    comments_count = Column(Integer, default=0)
    shares_count = Column(Integer, default=0)
    engagement_score = Column(Float, default=0.0)  # Calculated engagement metric
    sentiment_score = Column(Float, nullable=True)  # AI-analyzed sentiment
    posted_at = Column(DateTime, nullable=False)
    platform_metadata = Column(JSON, nullable=True)  # Platform-specific data
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationship
    integration = relationship("SocialMediaIntegration", back_populates="social_posts")


class IntegrationAnalytics(Base):
    __tablename__ = "integration_analytics"

    id = Column(Integer, primary_key=True, index=True)
    integration_id = Column(Integer, ForeignKey("social_media_integrations.id"), nullable=False)
    date = Column(DateTime, nullable=False)
    total_posts = Column(Integer, default=0)
    total_likes = Column(Integer, default=0)
    total_comments = Column(Integer, default=0)
    total_shares = Column(Integer, default=0)
    avg_engagement_rate = Column(Float, default=0.0)
    top_hashtags = Column(JSON, nullable=True)
    top_mentions = Column(JSON, nullable=True)
    sentiment_distribution = Column(JSON, nullable=True)  # Positive, negative, neutral counts
    peak_activity_hours = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=func.now())
    
    # Relationship
    integration = relationship("SocialMediaIntegration") 