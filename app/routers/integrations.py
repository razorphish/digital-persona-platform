from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from pydantic import BaseModel

from app.database import get_db
from app.middleware.security import get_current_user
from app.models.user_db import User
from app.crud.integration import integration_crud, social_post_crud, analytics_crud
from app.services.social_media_service import social_media_service

router = APIRouter(prefix="/integrations", tags=["integrations"])


# Pydantic models
class IntegrationBase(BaseModel):
    platform: str
    platform_username: str


class IntegrationCreate(BaseModel):
    platform: str
    access_token: str
    access_token_secret: Optional[str] = None  # For Twitter
    refresh_token: Optional[str] = None


class IntegrationResponse(BaseModel):
    id: int
    platform: str
    platform_user_id: str
    platform_username: str
    is_active: bool
    last_sync_at: Optional[datetime]
    sync_frequency_hours: int
    platform_metadata: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SocialPostResponse(BaseModel):
    id: int
    platform_post_id: str
    post_type: str
    content: Optional[str]
    media_urls: Optional[List[str]]
    hashtags: Optional[List[str]]
    mentions: Optional[List[str]]
    likes_count: int
    comments_count: int
    shares_count: int
    engagement_score: float
    sentiment_score: Optional[float]
    posted_at: datetime
    platform_metadata: Dict[str, Any]

    class Config:
        from_attributes = True


class AnalyticsResponse(BaseModel):
    id: int
    date: datetime
    total_posts: int
    total_likes: int
    total_comments: int
    total_shares: int
    avg_engagement_rate: float
    top_hashtags: Optional[List[tuple]]
    top_mentions: Optional[List[tuple]]
    sentiment_distribution: Optional[Dict[str, int]]
    peak_activity_hours: Optional[Dict[str, Any]]

    class Config:
        from_attributes = True


class SyncRequest(BaseModel):
    force_full_sync: bool = False


# Routes
@router.get("/auth-urls")
async def get_auth_urls():
    """Get OAuth URLs for supported platforms."""
    try:
        return {
            "twitter": social_media_service.get_twitter_auth_url(),
            "facebook": social_media_service.get_facebook_auth_url()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/connect", response_model=IntegrationResponse)
async def connect_social_account(
    integration_data: IntegrationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Connect a social media account."""
    try:
        # Check if integration already exists
        existing = integration_crud.get_integration_by_platform(
            db, current_user.id, integration_data.platform
        )
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"Account already connected for {integration_data.platform}"
            )

        # Connect account based on platform
        if integration_data.platform == "twitter":
            if not integration_data.access_token_secret:
                raise HTTPException(
                    status_code=400,
                    detail="Twitter requires both access_token and access_token_secret"
                )
            
            platform_data = await social_media_service.connect_twitter_account(
                integration_data.access_token,
                integration_data.access_token_secret
            )
        elif integration_data.platform == "facebook":
            platform_data = await social_media_service.connect_facebook_account(
                integration_data.access_token
            )
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported platform: {integration_data.platform}"
            )

        # Create integration in database
        integration = integration_crud.create_integration(
            db=db,
            user_id=current_user.id,
            platform=platform_data["platform"],
            platform_user_id=platform_data["platform_user_id"],
            platform_username=platform_data["platform_username"],
            access_token=platform_data["access_token"],
            refresh_token=integration_data.refresh_token,
            platform_metadata=platform_data["platform_metadata"]
        )

        return integration
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/", response_model=List[IntegrationResponse])
async def get_integrations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all integrations for the current user."""
    integrations = integration_crud.get_integrations_by_user(db, current_user.id)
    return integrations


@router.get("/{integration_id}", response_model=IntegrationResponse)
async def get_integration(
    integration_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific integration."""
    integration = integration_crud.get_integration_by_id(db, integration_id)
    if not integration or integration.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Integration not found")
    
    return integration


@router.post("/{integration_id}/sync")
async def sync_integration(
    integration_id: int,
    sync_request: SyncRequest = SyncRequest(),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Sync posts from a social media integration."""
    integration = integration_crud.get_integration_by_id(db, integration_id)
    if not integration or integration.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Integration not found")

    try:
        # Sync based on platform
        if integration.platform == "twitter":
            # For Twitter, we need both access token and secret
            # This is a simplified version - in production, you'd store both securely
            posts_data = await social_media_service.sync_twitter_posts(
                integration_id=integration.id,
                access_token=integration.access_token,
                access_token_secret="",  # You'd get this from secure storage
                since_id=None if sync_request.force_full_sync else None
            )
        elif integration.platform == "facebook":
            posts_data = await social_media_service.sync_facebook_posts(
                integration_id=integration.id,
                access_token=integration.access_token,
                since_date=None if sync_request.force_full_sync else integration.last_sync_at
            )
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported platform: {integration.platform}"
            )

        # Filter out posts that already exist
        new_posts = []
        for post_data in posts_data:
            existing = social_post_crud.get_post_by_platform_id(
                db, integration.id, post_data["platform_post_id"]
            )
            if not existing:
                new_posts.append(post_data)

        # Bulk create new posts
        if new_posts:
            created_posts = social_post_crud.bulk_create_posts(db, new_posts)
        else:
            created_posts = []

        # Update last sync time
        integration_crud.update_last_sync(db, integration.id)

        # Calculate analytics
        if new_posts:
            analytics_data = await social_media_service.calculate_analytics(new_posts)
            analytics_crud.create_analytics(db, integration.id, analytics_data)

        return {
            "message": "Sync completed successfully",
            "new_posts_count": len(created_posts),
            "total_posts_synced": len(posts_data)
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Sync failed: {str(e)}")


@router.get("/{integration_id}/posts", response_model=List[SocialPostResponse])
async def get_integration_posts(
    integration_id: int,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get posts for a specific integration."""
    integration = integration_crud.get_integration_by_id(db, integration_id)
    if not integration or integration.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Integration not found")

    posts = social_post_crud.get_posts_by_integration(
        db, integration_id, limit, offset
    )
    return posts


@router.get("/{integration_id}/analytics", response_model=List[AnalyticsResponse])
async def get_integration_analytics(
    integration_id: int,
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get analytics for a specific integration."""
    integration = integration_crud.get_integration_by_id(db, integration_id)
    if not integration or integration.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Integration not found")

    analytics = analytics_crud.get_analytics_by_integration(
        db, integration_id, days
    )
    return analytics


@router.put("/{integration_id}")
async def update_integration(
    integration_id: int,
    updates: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update integration settings."""
    integration = integration_crud.get_integration_by_id(db, integration_id)
    if not integration or integration.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Integration not found")

    # Only allow updating certain fields
    allowed_updates = {"sync_frequency_hours", "is_active"}
    filtered_updates = {k: v for k, v in updates.items() if k in allowed_updates}

    updated_integration = integration_crud.update_integration(
        db, integration_id, filtered_updates
    )
    
    if not updated_integration:
        raise HTTPException(status_code=404, detail="Integration not found")
    
    return updated_integration


@router.delete("/{integration_id}")
async def delete_integration(
    integration_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an integration."""
    integration = integration_crud.get_integration_by_id(db, integration_id)
    if not integration or integration.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Integration not found")

    success = integration_crud.delete_integration(db, integration_id)
    if not success:
        raise HTTPException(status_code=404, detail="Integration not found")

    return {"message": "Integration deleted successfully"}


@router.post("/{integration_id}/analyze-sentiment")
async def analyze_posts_sentiment(
    integration_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Analyze sentiment for posts in an integration."""
    integration = integration_crud.get_integration_by_id(db, integration_id)
    if not integration or integration.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Integration not found")

    # Get posts without sentiment analysis
    posts = social_post_crud.get_posts_by_integration(db, integration_id, limit=1000)
    posts_without_sentiment = [post for post in posts if post.sentiment_score is None]

    analyzed_count = 0
    for post in posts_without_sentiment:
        if post.content:
            sentiment_score = await social_media_service.analyze_sentiment(post.content)
            social_post_crud.update_post_sentiment(db, post.id, sentiment_score)
            analyzed_count += 1

    return {
        "message": "Sentiment analysis completed",
        "posts_analyzed": analyzed_count
    } 