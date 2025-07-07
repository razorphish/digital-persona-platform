import os
import requests
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from fastapi import HTTPException
import tweepy
import facebook
from app.config import settings
import logging
from app.models.integration_db import SocialMediaIntegration
from app.models.persona_db import Persona as DBPersona
from app.services.personality_learning import PersonalityLearningService
from app.crud import persona as persona_crud

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SocialMediaService:
    def __init__(self):
        self.twitter_api_key = os.getenv("TWITTER_API_KEY")
        self.twitter_api_secret = os.getenv("TWITTER_API_SECRET")
        self.twitter_bearer_token = os.getenv("TWITTER_BEARER_TOKEN")
        self.facebook_app_id = os.getenv("FACEBOOK_APP_ID")
        self.facebook_app_secret = os.getenv("FACEBOOK_APP_SECRET")
        
    def get_twitter_auth_url(self) -> str:
        """Generate Twitter OAuth URL for user authorization."""
        if not self.twitter_api_key or not self.twitter_api_secret:
            raise HTTPException(status_code=500, detail="Twitter API credentials not configured")
        
        # For now, return a placeholder URL - in production, implement proper OAuth flow
        return f"https://api.twitter.com/oauth/authorize?oauth_token=placeholder"
    
    def get_facebook_auth_url(self) -> str:
        """Generate Facebook OAuth URL for user authorization."""
        if not self.facebook_app_id:
            raise HTTPException(status_code=500, detail="Facebook App ID not configured")
        
        redirect_uri = f"{settings.BASE_URL}/auth/facebook/callback"
        scope = "public_profile,email,user_posts,user_photos,user_likes"
        
        return f"https://www.facebook.com/v12.0/dialog/oauth?client_id={self.facebook_app_id}&redirect_uri={redirect_uri}&scope={scope}"
    
    async def connect_twitter_account(self, access_token: str, access_token_secret: str) -> Dict[str, Any]:
        """Connect a Twitter account and fetch user data."""
        try:
            # Initialize Twitter API
            auth = tweepy.OAuthHandler(self.twitter_api_key, self.twitter_api_secret)
            auth.set_access_token(access_token, access_token_secret)
            api = tweepy.API(auth)
            
            # Get user info
            user = api.verify_credentials()
            
            return {
                "platform": "twitter",
                "platform_user_id": str(user.id),
                "platform_username": user.screen_name,
                "access_token": access_token,
                "access_token_secret": access_token_secret,
                "platform_metadata": {
                    "name": user.name,
                    "description": user.description,
                    "followers_count": user.followers_count,
                    "friends_count": user.friends_count,
                    "statuses_count": user.statuses_count,
                    "profile_image_url": user.profile_image_url_https,
                    "verified": user.verified
                }
            }
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to connect Twitter account: {str(e)}")
    
    async def connect_facebook_account(self, access_token: str) -> Dict[str, Any]:
        """Connect a Facebook account and fetch user data."""
        try:
            # Initialize Facebook Graph API
            graph = facebook.GraphAPI(access_token=access_token, version="12.0")
            
            # Get user info
            user_info = graph.get_object("me", fields="id,name,email,picture")
            
            return {
                "platform": "facebook",
                "platform_user_id": user_info["id"],
                "platform_username": user_info.get("name", ""),
                "access_token": access_token,
                "platform_metadata": {
                    "name": user_info.get("name"),
                    "email": user_info.get("email"),
                    "picture_url": user_info.get("picture", {}).get("data", {}).get("url"),
                }
            }
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to connect Facebook account: {str(e)}")
    
    async def sync_twitter_posts(self, integration_id: int, access_token: str, access_token_secret: str, since_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Sync Twitter posts for an integration."""
        try:
            auth = tweepy.OAuthHandler(self.twitter_api_key, self.twitter_api_secret)
            auth.set_access_token(access_token, access_token_secret)
            api = tweepy.API(auth)
            
            # Get user timeline
            tweets = api.user_timeline(
                count=200,
                since_id=since_id,
                tweet_mode="extended"
            )
            
            posts = []
            for tweet in tweets:
                # Extract hashtags
                hashtags = [hashtag["text"] for hashtag in tweet.entities.get("hashtags", [])]
                
                # Extract mentions
                mentions = [mention["screen_name"] for mention in tweet.entities.get("user_mentions", [])]
                
                # Extract media URLs
                media_urls = []
                if hasattr(tweet, "extended_entities") and "media" in tweet.extended_entities:
                    for media in tweet.extended_entities["media"]:
                        if media["type"] == "photo":
                            media_urls.append(media["media_url_https"])
                
                post_data = {
                    "integration_id": integration_id,
                    "platform_post_id": str(tweet.id),
                    "post_type": "post",
                    "content": tweet.full_text,
                    "media_urls": media_urls,
                    "hashtags": hashtags,
                    "mentions": mentions,
                    "likes_count": tweet.favorite_count,
                    "comments_count": tweet.retweet_count,  # Using retweet count as comments
                    "shares_count": tweet.retweet_count,
                    "engagement_score": (tweet.favorite_count + tweet.retweet_count) / 100.0,
                    "posted_at": tweet.created_at,
                    "platform_metadata": {
                        "retweeted": tweet.retweeted,
                        "favorited": tweet.favorited,
                        "lang": tweet.lang,
                        "source": tweet.source
                    }
                }
                posts.append(post_data)
            
            return posts
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to sync Twitter posts: {str(e)}")
    
    async def sync_facebook_posts(self, integration_id: int, access_token: str, since_date: Optional[datetime] = None) -> List[Dict[str, Any]]:
        """Sync Facebook posts for an integration."""
        try:
            graph = facebook.GraphAPI(access_token=access_token, version="12.0")
            
            # Get user posts
            posts = graph.get_object("me/posts", fields="id,message,created_time,likes.summary(true),comments.summary(true),shares")
            
            synced_posts = []
            for post in posts.get("data", []):
                post_data = {
                    "integration_id": integration_id,
                    "platform_post_id": post["id"],
                    "post_type": "post",
                    "content": post.get("message", ""),
                    "media_urls": [],  # Facebook posts don't include media URLs in basic fields
                    "hashtags": [],  # Would need to parse message for hashtags
                    "mentions": [],  # Would need to parse message for mentions
                    "likes_count": post.get("likes", {}).get("summary", {}).get("total_count", 0),
                    "comments_count": post.get("comments", {}).get("summary", {}).get("total_count", 0),
                    "shares_count": post.get("shares", {}).get("count", 0) if post.get("shares") else 0,
                    "engagement_score": 0.0,  # Calculate based on likes, comments, shares
                    "posted_at": datetime.fromisoformat(post["created_time"].replace("Z", "+00:00")),
                    "platform_metadata": {
                        "type": "post"
                    }
                }
                
                # Calculate engagement score
                total_engagement = post_data["likes_count"] + post_data["comments_count"] + post_data["shares_count"]
                post_data["engagement_score"] = total_engagement / 100.0
                
                synced_posts.append(post_data)
            
            return synced_posts
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to sync Facebook posts: {str(e)}")
    
    async def analyze_sentiment(self, content: str) -> float:
        """Analyze sentiment of social media content."""
        # This would integrate with OpenAI or another sentiment analysis service
        # For now, return a placeholder score
        return 0.0
    
    async def calculate_analytics(self, posts: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculate analytics from social media posts."""
        if not posts:
            return {}
        
        total_posts = len(posts)
        total_likes = sum(post.get("likes_count", 0) for post in posts)
        total_comments = sum(post.get("comments_count", 0) for post in posts)
        total_shares = sum(post.get("shares_count", 0) for post in posts)
        
        # Calculate engagement rate
        total_engagement = total_likes + total_comments + total_shares
        avg_engagement_rate = total_engagement / total_posts if total_posts > 0 else 0
        
        # Extract hashtags
        all_hashtags = []
        for post in posts:
            hashtags = post.get("hashtags", [])
            all_hashtags.extend(hashtags)
        
        # Count hashtag frequency
        hashtag_counts = {}
        for hashtag in all_hashtags:
            hashtag_counts[hashtag] = hashtag_counts.get(hashtag, 0) + 1
        
        top_hashtags = sorted(hashtag_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        
        # Extract mentions
        all_mentions = []
        for post in posts:
            mentions = post.get("mentions", [])
            all_mentions.extend(mentions)
        
        # Count mention frequency
        mention_counts = {}
        for mention in all_mentions:
            mention_counts[mention] = mention_counts.get(mention, 0) + 1
        
        top_mentions = sorted(mention_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        
        return {
            "total_posts": total_posts,
            "total_likes": total_likes,
            "total_comments": total_comments,
            "total_shares": total_shares,
            "avg_engagement_rate": avg_engagement_rate,
            "top_hashtags": top_hashtags,
            "top_mentions": top_mentions,
            "sentiment_distribution": {"positive": 0, "negative": 0, "neutral": 0},  # Placeholder
            "peak_activity_hours": {}  # Would need to analyze timestamps
        }

    async def learn_from_social_media_posts(
        self,
        db,
        user_id: int,
        posts_data: List[Dict[str, Any]],
        target_personas: Optional[List[int]] = None,
        update_self_persona: bool = True
    ) -> Dict[str, Any]:
        """
        Learn from social media posts and update personas.
        
        Args:
            db: Database session
            user_id: ID of the user who owns the posts
            posts_data: List of social media post data
            target_personas: List of specific persona IDs to update (optional)
            update_self_persona: Whether to update the 'self' persona (default: True)
        
        Returns:
            Dict with learning results
        """
        if not posts_data:
            return {"updated_personas": [], "learning_count": 0}
        
        try:
            # Get personas to update
            personas_to_update = []
            
            # Always update self persona if requested
            if update_self_persona:
                self_persona = await persona_crud.get_or_create_self_persona(db, user_id)
                if self_persona:
                    personas_to_update.append(self_persona)
            
            # Add specific target personas if provided
            if target_personas:
                for persona_id in target_personas:
                    persona = await persona_crud.get_persona_by_id(db, persona_id, user_id)
                    if persona and persona not in personas_to_update:
                        personas_to_update.append(persona)
            
            if not personas_to_update:
                logger.warning(f"No personas found to update for user {user_id}")
                return {"updated_personas": [], "learning_count": 0}
            
            # Aggregate post content for learning
            aggregated_content = self._aggregate_posts_for_learning(posts_data)
            
            # Initialize learning service
            learning_service = PersonalityLearningService()
            
            # Update each persona
            updated_personas = []
            total_learning_count = 0
            
            for persona in personas_to_update:
                if not persona.learning_enabled:
                    logger.info(f"Learning disabled for persona {persona.id}")
                    continue
                
                try:
                    # Create learning data from social media posts
                    learning_data = {
                        "text": aggregated_content,
                        "source": "social_media",
                        "post_count": len(posts_data),
                        "platforms": list(set(post.get("platform", "unknown") for post in posts_data)),
                        "date_range": {
                            "earliest": min(post.get("posted_at", datetime.now()) for post in posts_data).isoformat(),
                            "latest": max(post.get("posted_at", datetime.now()) for post in posts_data).isoformat()
                        }
                    }
                    
                    # Update persona with new learning data
                    current_context = persona.memory_context or ""
                    new_context = f"{current_context}\n\n[Social Media Learning - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}]\n{aggregated_content}" if current_context else f"[Social Media Learning - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}]\n{aggregated_content}"
                    
                    updated_persona = await persona_crud.update_persona_learning(
                        db=db,
                        persona=persona,
                        memory_context=new_context,
                        interaction_count=persona.interaction_count + 1
                    )
                    
                    updated_personas.append(updated_persona.id)
                    total_learning_count += 1
                    
                    logger.info(f"Updated persona {persona.id} ({persona.name}) with social media learning data")
                    
                except Exception as e:
                    logger.error(f"Failed to update persona {persona.id}: {e}")
                    continue
            
            return {
                "updated_personas": updated_personas,
                "learning_count": total_learning_count,
                "total_posts_processed": len(posts_data)
            }
            
        except Exception as e:
            logger.error(f"Failed to learn from social media posts: {e}")
            return {"updated_personas": [], "learning_count": 0, "error": str(e)}
    
    def _aggregate_posts_for_learning(self, posts_data: List[Dict[str, Any]]) -> str:
        """
        Aggregate social media posts into a format suitable for persona learning.
        """
        if not posts_data:
            return ""
        
        # Sort posts by date (newest first)
        sorted_posts = sorted(posts_data, key=lambda x: x.get("posted_at", datetime.now()), reverse=True)
        
        # Extract and format content
        content_parts = []
        
        for post in sorted_posts:
            content = post.get("content", "")
            if not content:
                continue
            
            # Add hashtags and mentions as context
            hashtags = post.get("hashtags", [])
            mentions = post.get("mentions", [])
            
            post_text = content
            
            if hashtags:
                post_text += f"\nHashtags: {', '.join(hashtags)}"
            
            if mentions:
                post_text += f"\nMentions: {', '.join(mentions)}"
            
            # Add engagement metrics as context
            likes = post.get("likes_count", 0)
            comments = post.get("comments_count", 0)
            shares = post.get("shares_count", 0)
            
            if likes > 0 or comments > 0 or shares > 0:
                post_text += f"\nEngagement: {likes} likes, {comments} comments, {shares} shares"
            
            content_parts.append(post_text)
        
        # Combine all content with separators
        aggregated_content = "\n\n---\n\n".join(content_parts)
        
        return aggregated_content

# Global instance
social_media_service = SocialMediaService() 