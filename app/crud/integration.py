from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import and_, desc, select
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from app.models.integration_db import SocialMediaIntegration, SocialMediaPost, IntegrationAnalytics
from app.models.user_db import User


class IntegrationCRUD:
    async def create_integration(
        self, 
        db: AsyncSession, 
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
        await db.commit()
        await db.refresh(db_integration)
        return db_integration
    
    async def get_integration_by_id(self, db: AsyncSession, integration_id: int) -> Optional[SocialMediaIntegration]:
        """Get integration by ID."""
        result = await db.execute(
            select(SocialMediaIntegration).where(SocialMediaIntegration.id == integration_id)
        )
        return result.scalar_one_or_none()
    
    async def get_integrations_by_user(self, db: AsyncSession, user_id: int) -> List[SocialMediaIntegration]:
        """Get all integrations for a user."""
        result = await db.execute(
            select(SocialMediaIntegration).where(
                SocialMediaIntegration.user_id == user_id,
                SocialMediaIntegration.is_active == True
            )
        )
        return list(result.scalars().all())
    
    async def get_integration_by_platform(self, db: AsyncSession, user_id: int, platform: str) -> Optional[SocialMediaIntegration]:
        """Get integration by user and platform."""
        result = await db.execute(
            select(SocialMediaIntegration).where(
                and_(
                    SocialMediaIntegration.user_id == user_id,
                    SocialMediaIntegration.platform == platform,
                    SocialMediaIntegration.is_active == True
                )
            )
        )
        return result.scalar_one_or_none()
    
    async def update_integration(
        self, 
        db: AsyncSession, 
        integration_id: int, 
        updates: Dict[str, Any]
    ) -> Optional[SocialMediaIntegration]:
        """Update an integration."""
        db_integration = await self.get_integration_by_id(db, integration_id)
        if not db_integration:
            return None
        
        for key, value in updates.items():
            if hasattr(db_integration, key):
                setattr(db_integration, key, value)
        
        db_integration.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(db_integration)
        return db_integration
    
    async def delete_integration(self, db: AsyncSession, integration_id: int) -> bool:
        """Delete an integration (soft delete by setting is_active to False)."""
        db_integration = await self.get_integration_by_id(db, integration_id)
        if not db_integration:
            return False
        
        db_integration.is_active = False
        db_integration.updated_at = datetime.utcnow()
        await db.commit()
        return True
    
    async def update_last_sync(self, db: AsyncSession, integration_id: int) -> None:
        """Update the last sync timestamp for an integration."""
        db_integration = await self.get_integration_by_id(db, integration_id)
        if db_integration:
            db_integration.last_sync_at = datetime.utcnow()
            await db.commit()


class SocialPostCRUD:
    async def create_post(self, db: AsyncSession, post_data: Dict[str, Any]) -> SocialMediaPost:
        """Create a new social media post."""
        db_post = SocialMediaPost(**post_data)
        db.add(db_post)
        await db.commit()
        await db.refresh(db_post)
        return db_post
    
    async def get_posts_by_integration(
        self, 
        db: AsyncSession, 
        integration_id: int, 
        limit: int = 100,
        offset: int = 0
    ) -> List[SocialMediaPost]:
        """Get posts for an integration."""
        result = await db.execute(
            select(SocialMediaPost).where(
                SocialMediaPost.integration_id == integration_id
            ).order_by(desc(SocialMediaPost.posted_at)).offset(offset).limit(limit)
        )
        return list(result.scalars().all())
    
    async def get_post_by_platform_id(
        self, 
        db: AsyncSession, 
        integration_id: int, 
        platform_post_id: str
    ) -> Optional[SocialMediaPost]:
        """Get post by platform post ID."""
        result = await db.execute(
            select(SocialMediaPost).where(
                and_(
                    SocialMediaPost.integration_id == integration_id,
                    SocialMediaPost.platform_post_id == platform_post_id
                )
            )
        )
        return result.scalar_one_or_none()
    
    async def bulk_create_posts(self, db: AsyncSession, posts_data: List[Dict[str, Any]]) -> List[SocialMediaPost]:
        """Bulk create posts."""
        db_posts = []
        for post_data in posts_data:
            db_post = SocialMediaPost(**post_data)
            db.add(db_post)
            db_posts.append(db_post)
        
        await db.commit()
        for post in db_posts:
            await db.refresh(post)
        
        return db_posts
    
    async def update_post_sentiment(
        self, 
        db: AsyncSession, 
        post_id: int, 
        sentiment_score: float
    ) -> Optional[SocialMediaPost]:
        """Update sentiment score for a post."""
        result = await db.execute(
            select(SocialMediaPost).where(SocialMediaPost.id == post_id)
        )
        db_post = result.scalar_one_or_none()
        if not db_post:
            return None
        
        db_post.sentiment_score = sentiment_score
        db_post.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(db_post)
        return db_post
    
    async def get_posts_for_analytics(
        self, 
        db: AsyncSession, 
        integration_id: int, 
        start_date: datetime,
        end_date: datetime
    ) -> List[SocialMediaPost]:
        """Get posts for analytics within a date range."""
        result = await db.execute(
            select(SocialMediaPost).where(
                and_(
                    SocialMediaPost.integration_id == integration_id,
                    SocialMediaPost.posted_at >= start_date,
                    SocialMediaPost.posted_at <= end_date
                )
            )
        )
        return list(result.scalars().all())


class AnalyticsCRUD:
    async def create_analytics(
        self, 
        db: AsyncSession, 
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
        await db.commit()
        await db.refresh(db_analytics)
        return db_analytics
    
    async def get_analytics_by_integration(
        self, 
        db: AsyncSession, 
        integration_id: int, 
        days: int = 30
    ) -> List[IntegrationAnalytics]:
        """Get analytics for an integration over a period."""
        start_date = datetime.utcnow().date() - timedelta(days=days)
        result = await db.execute(
            select(IntegrationAnalytics).where(
                and_(
                    IntegrationAnalytics.integration_id == integration_id,
                    IntegrationAnalytics.date >= start_date
                )
            ).order_by(desc(IntegrationAnalytics.date))
        )
        return list(result.scalars().all())
    
    async def get_latest_analytics(
        self, 
        db: AsyncSession, 
        integration_id: int
    ) -> Optional[IntegrationAnalytics]:
        """Get the latest analytics for an integration."""
        result = await db.execute(
            select(IntegrationAnalytics).where(
                IntegrationAnalytics.integration_id == integration_id
            ).order_by(desc(IntegrationAnalytics.date))
        )
        return result.scalar_one_or_none()


# Global instances
integration_crud = IntegrationCRUD()
social_post_crud = SocialPostCRUD()
analytics_crud = AnalyticsCRUD() 