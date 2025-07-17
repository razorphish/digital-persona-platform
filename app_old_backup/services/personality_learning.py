"""
Personality Learning Service for adapting persona personalities
"""
import os
import time
import logging
import json
from typing import Dict, List, Any, Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc
from fastapi import HTTPException, status
from app.models.persona_db import Persona as DBPersona
from app.models.ai_capabilities import PersonalityLearning as DBPersonalityLearning
from app.models.chat_db import ChatMessage as DBChatMessage
from app.models.media_db import MediaFile as DBMediaFile
from app.services.openai_service import openai_service

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class PersonalityLearningService:
    """Service for learning and adapting persona personalities from interactions."""
    
    def __init__(self):
        self.learning_patterns = {
            "communication_style": ["formal", "casual", "empathetic", "direct", "humorous"],
            "emotional_traits": ["optimistic", "pessimistic", "calm", "excitable", "caring"],
            "interests": ["technology", "art", "sports", "music", "books", "travel"],
            "values": ["family", "career", "health", "education", "adventure"]
        }
    
    async def learn_from_conversation(
        self,
        db: AsyncSession,
        persona: DBPersona,
        conversation_history: List[DBChatMessage]
    ) -> List[DBPersonalityLearning]:
        """Learn personality traits from a conversation."""
        
        if not persona.learning_enabled or not conversation_history:
            return []
        
        try:
            learnings = []
            
            # Analyze conversation for personality insights
            conversation_text = " ".join([msg.content for msg in conversation_history])
            
            # Use OpenAI to analyze personality traits
            if openai_service.is_available():
                personality_insights = await self._analyze_personality_from_text(
                    conversation_text, persona.name
                )
                
                for insight_type, insights in personality_insights.items():
                    if insights:
                        learning = DBPersonalityLearning(
                            persona_id=persona.id,
                            learning_type=insight_type,
                            data=json.dumps(insights),
                            confidence=0.8,
                            source_conversation_id=conversation_history[0].conversation_id if conversation_history else None
                        )
                        
                        db.add(learning)
                        learnings.append(learning)
            
            # Learn from user preferences and patterns
            user_patterns = await self._extract_user_patterns(conversation_history)
            if user_patterns:
                learning = DBPersonalityLearning(
                    persona_id=persona.id,
                    learning_type="user_patterns",
                    data=json.dumps(user_patterns),
                    confidence=0.7,
                    source_conversation_id=conversation_history[0].conversation_id if conversation_history else None
                )
                
                db.add(learning)
                learnings.append(learning)
            
            await db.commit()
            
            # Update persona with learned traits
            await self._update_persona_traits(db, persona, learnings)
            
            return learnings
            
        except Exception as e:
            logger.error(f"Failed to learn from conversation: {e}")
            await db.rollback()
            return []
    
    async def learn_from_uploaded_content(
        self,
        db: AsyncSession,
        persona: DBPersona,
        media_file: DBMediaFile
    ) -> Optional[DBPersonalityLearning]:
        """Learn personality traits from uploaded content."""
        
        if not persona.learning_enabled:
            return None
        
        try:
            # Analyze content based on file type
            if media_file.media_type == "images":
                return await self._learn_from_image(db, persona, media_file)
            elif media_file.media_type == "videos":
                return await self._learn_from_video(db, persona, media_file)
            else:
                return await self._learn_from_document(db, persona, media_file)
                
        except Exception as e:
            logger.error(f"Failed to learn from uploaded content: {e}")
            return None
    
    async def _analyze_personality_from_text(
        self, 
        text: str, 
        persona_name: str
    ) -> Dict[str, List[str]]:
        """Analyze personality traits from text using OpenAI."""
        try:
            prompt = f"""Analyze the following conversation and identify personality traits for {persona_name}. 
            Focus on communication style, emotional traits, interests, and values.
            
            Conversation: {text}
            
            Return a JSON object with the following structure:
            {{
                "communication_style": ["trait1", "trait2"],
                "emotional_traits": ["trait1", "trait2"],
                "interests": ["interest1", "interest2"],
                "values": ["value1", "value2"]
            }}
            
            Only include traits that are clearly evident from the conversation."""
            
            response = await openai_service.analyze_text_for_personality(text, prompt)
            
            try:
                return json.loads(response.get("analysis", "{}"))
            except json.JSONDecodeError:
                return {}
                
        except Exception as e:
            logger.error(f"Failed to analyze personality from text: {e}")
            return {}
    
    async def _extract_user_patterns(
        self, 
        conversation_history: List[DBChatMessage]
    ) -> Dict[str, Any]:
        """Extract user interaction patterns from conversation."""
        patterns = {
            "response_length": [],
            "topics": [],
            "emotional_state": [],
            "interaction_frequency": 0
        }
        
        try:
            user_messages = [msg for msg in conversation_history if msg.role == "user"]
            
            if not user_messages:
                return patterns
            
            # Analyze response lengths
            response_lengths = [len(msg.content) for msg in user_messages]
            patterns["response_length"] = {
                "average": sum(response_lengths) / len(response_lengths),
                "min": min(response_lengths),
                "max": max(response_lengths)
            }
            
            # Extract common topics
            all_text = " ".join([msg.content.lower() for msg in user_messages])
            topics = self._extract_topics(all_text)
            patterns["topics"] = topics
            
            # Analyze emotional patterns
            emotional_words = self._extract_emotional_words(all_text)
            patterns["emotional_state"] = emotional_words
            
            # Interaction frequency
            patterns["interaction_frequency"] = len(user_messages)
            
            return patterns
            
        except Exception as e:
            logger.error(f"Failed to extract user patterns: {e}")
            return patterns
    
    def _extract_topics(self, text: str) -> List[str]:
        """Extract common topics from text."""
        topics = []
        
        # Simple keyword-based topic extraction
        topic_keywords = {
            "technology": ["computer", "phone", "app", "software", "tech", "digital"],
            "family": ["family", "parent", "child", "spouse", "sibling", "home"],
            "work": ["work", "job", "career", "office", "meeting", "project"],
            "health": ["health", "exercise", "diet", "doctor", "medical", "fitness"],
            "entertainment": ["movie", "music", "game", "book", "show", "entertainment"],
            "travel": ["travel", "vacation", "trip", "destination", "hotel", "flight"]
        }
        
        text_lower = text.lower()
        for topic, keywords in topic_keywords.items():
            if any(keyword in text_lower for keyword in keywords):
                topics.append(topic)
        
        return topics
    
    def _extract_emotional_words(self, text: str) -> List[str]:
        """Extract emotional words from text."""
        emotional_words = []
        
        emotion_keywords = {
            "happy": ["happy", "joy", "excited", "great", "wonderful", "amazing"],
            "sad": ["sad", "depressed", "unhappy", "disappointed", "upset"],
            "angry": ["angry", "mad", "frustrated", "annoyed", "irritated"],
            "anxious": ["anxious", "worried", "nervous", "stressed", "concerned"],
            "calm": ["calm", "peaceful", "relaxed", "content", "satisfied"]
        }
        
        text_lower = text.lower()
        for emotion, keywords in emotion_keywords.items():
            if any(keyword in text_lower for keyword in keywords):
                emotional_words.append(emotion)
        
        return emotional_words
    
    async def _learn_from_image(
        self, 
        db: AsyncSession, 
        persona: DBPersona, 
        media_file: DBMediaFile
    ) -> Optional[DBPersonalityLearning]:
        """Learn personality traits from image content."""
        try:
            # Use computer vision to analyze image
            from app.services.computer_vision import computer_vision_service
            
            analysis = await computer_vision_service.analyze_image(
                media_file, persona, ["objects", "emotions", "scene"]
            )
            
            # Extract personality insights from image analysis
            insights = {
                "visual_interests": [],
                "emotional_preferences": [],
                "lifestyle_indicators": []
            }
            
            results = analysis.get("results", {})
            
            # Analyze objects for interests
            if "objects" in results:
                objects_desc = results["objects"].get("objects", "")
                insights["visual_interests"] = self._extract_interests_from_description(objects_desc)
            
            # Analyze emotions
            if "emotions" in results:
                emotion_desc = results["emotions"].get("emotion_analysis", "")
                insights["emotional_preferences"] = self._extract_emotions_from_description(emotion_desc)
            
            # Analyze scene for lifestyle
            if "scene" in results:
                scene_desc = results["scene"].get("scene_description", "")
                insights["lifestyle_indicators"] = self._extract_lifestyle_from_description(scene_desc)
            
            if any(insights.values()):
                learning = DBPersonalityLearning(
                    persona_id=persona.id,
                    learning_type="visual_preferences",
                    data=json.dumps(insights),
                    confidence=0.6
                )
                
                db.add(learning)
                await db.commit()
                
                return learning
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to learn from image: {e}")
            return None
    
    async def _learn_from_video(
        self, 
        db: AsyncSession, 
        persona: DBPersona, 
        media_file: DBMediaFile
    ) -> Optional[DBPersonalityLearning]:
        """Learn personality traits from video content."""
        # For now, treat videos similar to images
        # In the future, this could include audio analysis and temporal patterns
        return await self._learn_from_image(db, persona, media_file)
    
    async def _learn_from_document(
        self, 
        db: AsyncSession, 
        persona: DBPersona, 
        media_file: DBMediaFile
    ) -> Optional[DBPersonalityLearning]:
        """Learn personality traits from document content."""
        try:
            # Extract text from document (simplified for now)
            # In a full implementation, this would use OCR or document parsing
            
            insights = {
                "document_type": media_file.mime_type,
                "content_analysis": "Document content analysis would be implemented here"
            }
            
            learning = DBPersonalityLearning(
                persona_id=persona.id,
                learning_type="document_preferences",
                data=json.dumps(insights),
                confidence=0.5
            )
            
            db.add(learning)
            await db.commit()
            
            return learning
            
        except Exception as e:
            logger.error(f"Failed to learn from document: {e}")
            return None
    
    def _extract_interests_from_description(self, description: str) -> List[str]:
        """Extract interests from object description."""
        interests = []
        
        interest_keywords = {
            "sports": ["ball", "racket", "gym", "exercise", "fitness"],
            "art": ["painting", "drawing", "sculpture", "art", "creative"],
            "technology": ["computer", "phone", "device", "tech", "electronic"],
            "nature": ["tree", "flower", "animal", "outdoor", "nature"],
            "food": ["food", "meal", "cooking", "restaurant", "kitchen"]
        }
        
        description_lower = description.lower()
        for interest, keywords in interest_keywords.items():
            if any(keyword in description_lower for keyword in keywords):
                interests.append(interest)
        
        return interests
    
    def _extract_emotions_from_description(self, description: str) -> List[str]:
        """Extract emotions from description."""
        return self._extract_emotional_words(description)
    
    def _extract_lifestyle_from_description(self, description: str) -> List[str]:
        """Extract lifestyle indicators from description."""
        lifestyle = []
        
        lifestyle_keywords = {
            "outdoor": ["outdoor", "park", "beach", "mountain", "nature"],
            "urban": ["city", "building", "street", "urban", "downtown"],
            "luxury": ["luxury", "expensive", "elegant", "sophisticated"],
            "minimalist": ["simple", "minimal", "clean", "basic"],
            "active": ["active", "dynamic", "energetic", "movement"]
        }
        
        description_lower = description.lower()
        for lifestyle_type, keywords in lifestyle_keywords.items():
            if any(keyword in description_lower for keyword in keywords):
                lifestyle.append(lifestyle_type)
        
        return lifestyle
    
    async def _update_persona_traits(
        self, 
        db: AsyncSession, 
        persona: DBPersona, 
        learnings: List[DBPersonalityLearning]
    ):
        """Update persona with learned traits."""
        try:
            # Collect all learned traits
            all_traits = {}
            
            for learning in learnings:
                try:
                    data = json.loads(learning.data)
                    for trait_type, traits in data.items():
                        if trait_type not in all_traits:
                            all_traits[trait_type] = []
                        if isinstance(traits, list):
                            all_traits[trait_type].extend(traits)
                        elif isinstance(traits, dict):
                            all_traits[trait_type].append(traits)
                except json.JSONDecodeError:
                    continue
            
            # Update persona personality traits
            if all_traits:
                current_traits = {}
                if persona.personality_traits:
                    try:
                        current_traits = json.loads(persona.personality_traits)
                    except json.JSONDecodeError:
                        current_traits = {}
                
                # Merge new traits with existing ones
                for trait_type, new_traits in all_traits.items():
                    if trait_type not in current_traits:
                        current_traits[trait_type] = []
                    current_traits[trait_type].extend(new_traits)
                
                # Remove duplicates
                for trait_type in current_traits:
                    if isinstance(current_traits[trait_type], list):
                        current_traits[trait_type] = list(set(current_traits[trait_type]))
                
                persona.personality_traits = json.dumps(current_traits)
                await db.commit()
                
        except Exception as e:
            logger.error(f"Failed to update persona traits: {e}")


# Global personality learning service instance
personality_learning_service = PersonalityLearningService() 