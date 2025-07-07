from sqlalchemy.orm import Session
from sqlalchemy import and_, desc
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from app.models.integration_db import SocialMediaIntegration, SocialMediaPost, IntegrationAnalytics
from app.models.user_db import User


class IntegrationCRUD:
    def create_integration(
        self, 
        db: Session, 
        user_id: int, 
        platform: str, 
        platform_user_id: str, 
        platform_username: str, 
        access_token: str, 
        refresh_token: Optional[str] = None,
        platform_metadata: Optional[Dict[str, Any]] = None
    ) -> SocialMediaIntegration:
        """Create a new social media integration."""
        db_integration = SocialMediaIntegration(
            user_id=user_id,
            platform=platform,
            platform_user_id=platform_user_id,
            platform_username=platform_username,
            access_token=access_token,
            refresh_token=refresh_token,
            platform_metadata=platform_metadata or {},
            last_sync_at=datetime.utcnow()
        )
        db.add(db_integration)
        db.commit()
        db.refresh(db_integration)
        return db_integration
    
    def get_integration_by_id(self, db: Session, integration_id: int) -> Optional[SocialMediaIntegration]:
        """Get integration by ID."""
        return db.query(SocialMediaIntegration).filter(SocialMediaIntegration.id == integration_id).first()
    
    def get_integrations_by_user(self, db: Session, user_id: int) -> List[SocialMediaIntegration]:
        """Get all integrations for a user."""
        return db.query(SocialMediaIntegration).filter(
            SocialMediaIntegration.user_id == user_id,
            SocialMediaIntegration.is_active == True
        ).all()
    
    def get_integration_by_platform(self, db: Session, user_id: int, platform: str) -> Optional[SocialMediaIntegration]:
        """Get integration by user and platform."""
        return db.query(SocialMediaIntegration).filter(
            and_(
                SocialMediaIntegration.user_id == user_id,
                SocialMediaIntegration.platform == platform,
                SocialMediaIntegration.is_active == True
            )
        ).first()
    
    def update_integration(
        self, 
        db: Session, 
        integration_id: int, 
        updates: Dict[str, Any]
    ) -> Optional[SocialMediaIntegration]:
        """Update an integration."""
        db_integration = self.get_integration_by_id(db, integration_id)
        if not db_integration:
            return None
        
        for key, value in updates.items():
            if hasattr(db_integration, key):
                setattr(db_integration, key, value)
        
        db_integration.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_integration)
        return db_integration
    
    def delete_integration(self, db: Session, integration_id: int) -> bool:
        """Delete an integration (soft delete by setting is_active to False)."""
        db_integration = self.get_integration_by_id(db, integration_id)
        if not db_integration:
            return False
        
        db_integration.is_active = False
        db_integration.updated_at = datetime.utcnow()
        db.commit()
        return True
    
    def update_last_sync(self, db: Session, integration_id: int) -> None:
        """Update the last sync timestamp for an integration."""
        db_integration = self.get_integration_by_id(db, integration_id)
        if db_integration:
            db_integration.last_sync_at = datetime.utcnow()
            db.commit()


class SocialPostCRUD:
    def create_post(self, db: Session, post_data: Dict[str, Any]) -> SocialMediaPost:
        """Create a new social media post."""
        db_post = SocialMediaPost(**post_data)
        db.add(db_post)
        db.commit()
        db.refresh(db_post)
        return db_post
    
    def get_posts_by_integration(
        self, 
        db: Session, 
        integration_id: int, 
        limit: int = 100,
        offset: int = 0
    ) -> List[SocialMediaPost]:
        """Get posts for an integration."""
        return db.query(SocialMediaPost).filter(
            SocialMediaPost.integration_id == integration_id
        ).order_by(desc(SocialMediaPost.posted_at)).offset(offset).limit(limit).all()
    
    def get_post_by_platform_id(
        self, 
        db: Session, 
        integration_id: int, 
        platform_post_id: str
    ) -> Optional[SocialMediaPost]:
        """Get post by platform post ID."""
        return db.query(SocialMediaPost).filter(
            and_(
                SocialMediaPost.integration_id == integration_id,
                SocialMediaPost.platform_post_id == platform_post_id
            )
        ).first()
    
    def bulk_create_posts(self, db: Session, posts_data: List[Dict[str, Any]]) -> List[SocialMediaPost]:
        """Bulk create posts."""
        db_posts = []
        for post_data in posts_data:
            db_post = SocialMediaPost(**post_data)
            db.add(db_post)
            db_posts.append(db_post)
        
        db.commit()
        for post in db_posts:
            db.refresh(post)
        
        return db_posts
    
    def update_post_sentiment(
        self, 
        db: Session, 
        post_id: int, 
        sentiment_score: float
    ) -> Optional[SocialMediaPost]:
        """Update sentiment score for a post."""
        db_post = db.query(SocialMediaPost).filter(SocialMediaPost.id == post_id).first()
        if not db_post:
            return None
        
        db_post.sentiment_score = sentiment_score
        db_post.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_post)
        return db_post
    
    def get_posts_for_analytics(
        self, 
        db: Session, 
        integration_id: int, 
        start_date: datetime,
        end_date: datetime
    ) -> List[SocialMediaPost]:
        """Get posts for analytics within a date range."""
        return db.query(SocialMediaPost).filter(
            and_(
                SocialMediaPost.integration_id == integration_id,
                SocialMediaPost.posted_at >= start_date,
                SocialMediaPost.posted_at <= end_date
            )
        ).all()


class AnalyticsCRUD:
    def create_analytics(
        self, 
        db: Session, 
        integration_id: int, 
        analytics_data: Dict[str, Any]
    ) -> IntegrationAnalytics:
        """Create analytics entry."""
        db_analytics = IntegrationAnalytics(
            integration_id=integration_id,
            date=datetime.utcnow().date(),
            **analytics_data
        )
        db.add(db_analytics)
        db.commit()
        db.refresh(db_analytics)
        return db_analytics
    
    def get_analytics_by_integration(
        self, 
        db: Session, 
        integration_id: int, 
        days: int = 30
    ) -> List[IntegrationAnalytics]:
        """Get analytics for an integration over a period."""
        start_date = datetime.utcnow().date() - timedelta(days=days)
        return db.query(IntegrationAnalytics).filter(
            and_(
                IntegrationAnalytics.integration_id == integration_id,
                IntegrationAnalytics.date >= start_date
            )
        ).order_by(desc(IntegrationAnalytics.date)).all()
    
    def get_latest_analytics(
        self, 
        db: Session, 
        integration_id: int
    ) -> Optional[IntegrationAnalytics]:
        """Get the latest analytics for an integration."""
        return db.query(IntegrationAnalytics).filter(
            IntegrationAnalytics.integration_id == integration_id
        ).order_by(desc(IntegrationAnalytics.date)).first()


# Global instances
integration_crud = IntegrationCRUD()
social_post_crud = SocialPostCRUD()
analytics_crud = AnalyticsCRUD() 