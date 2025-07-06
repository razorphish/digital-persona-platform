"""
AI Capabilities Router for advanced features
"""
import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.persona_db import Persona as DBPersona
from app.models.media_db import MediaFile as DBMediaFile
from app.models.chat_db import ChatMessage as DBChatMessage
from app.services.computer_vision import computer_vision_service
from app.services.voice_synthesis import voice_synthesis_service
from app.services.memory_service import memory_service
from app.services.personality_learning import personality_learning_service
from app.services.openai_service import openai_service
from app.services.auth_db import get_current_user
from app.models.user_db import User as DBUser
from app.crud.persona import get_persona_by_id
from app.crud.media import get_media_file_by_id
from app.crud.chat import get_message_by_id, get_messages_by_conversation

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai", tags=["AI Capabilities"])


@router.post("/analyze-image/{media_file_id}")
async def analyze_image(
    media_file_id: int,
    analysis_types: Optional[List[str]] = None,
    current_user: DBUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Analyze an uploaded image with computer vision."""
    try:
        # Get media file
        media_file = await get_media_file_by_id(db, media_file_id, current_user.id)
        if not media_file:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Media file not found"
            )
        
        # Get persona
        persona = await get_persona_by_id(db, media_file.persona_id, current_user.id)
        if not persona:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Persona not found"
            )
        
        # Check if image analysis is enabled
        if not persona.image_analysis_enabled:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Image analysis is disabled for this persona"
            )
        
        # Check if OpenAI is available
        if not openai_service.is_available():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Image analysis service is currently unavailable. Please check your OpenAI API configuration."
            )
        
        # Perform analysis with timeout
        import asyncio
        try:
            analysis_results = await asyncio.wait_for(
                computer_vision_service.analyze_image(
                    media_file, persona, analysis_types
                ),
                timeout=60.0  # 60 second timeout
            )
        except asyncio.TimeoutError:
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="Image analysis timed out. Please try again with a smaller image or different analysis types."
            )
        
        # Save analysis results
        await computer_vision_service.save_analysis_results(
            db, media_file, persona, analysis_results
        )
        
        # Learn from the image if learning is enabled
        if persona.learning_enabled:
            try:
                await personality_learning_service.learn_from_uploaded_content(
                    db, persona, media_file
                )
            except Exception as learning_error:
                logger.warning(f"Learning from image failed: {learning_error}")
                # Don't fail the entire request if learning fails
        
        return {
            "success": True,
            "analysis": analysis_results,
            "media_file_id": media_file_id,
            "processing_time_ms": analysis_results.get("processing_time_ms", 0)
        }
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        logger.error(f"Image analysis failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Image analysis failed. Please try again later."
        )


@router.post("/synthesize-voice/{message_id}")
async def synthesize_voice(
    message_id: int,
    current_user: DBUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Synthesize voice for a chat message."""
    try:
        # Get message
        message = await get_message_by_id(db, message_id, current_user.id)
        if not message:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Message not found"
            )
        
        # Only synthesize assistant messages
        if message.role != "assistant":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Can only synthesize assistant messages"
            )
        
        # Get persona
        persona = await get_persona_by_id(db, message.conversation.persona_id, current_user.id)
        if not persona:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Persona not found"
            )
        
        # Synthesize voice
        synthesis_result = await voice_synthesis_service.synthesize_speech(
            message.content, persona, message, db
        )
        
        return {
            "success": True,
            "synthesis": synthesis_result,
            "message_id": message_id
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Voice synthesis failed: {str(e)}"
        )


@router.get("/memories/{persona_id}")
async def get_persona_memories(
    persona_id: int,
    query: Optional[str] = None,
    memory_types: Optional[List[str]] = None,
    limit: int = 10,
    current_user: DBUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get relevant memories for a persona."""
    try:
        # Get persona
        persona = await get_persona_by_id(db, persona_id, current_user.id)
        if not persona:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Persona not found"
            )
        
        # Get memories
        memories = await memory_service.retrieve_relevant_memories(
            db, persona, query or "", memory_types, limit
        )
        
        return {
            "success": True,
            "memories": [
                {
                    "id": memory.id,
                    "type": memory.memory_type,
                    "content": memory.content,
                    "importance": memory.importance,
                    "created_at": memory.created_at,
                    "last_accessed": memory.last_accessed
                }
                for memory in memories
            ],
            "count": len(memories)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve memories: {str(e)}"
        )


@router.post("/memories/{persona_id}")
async def store_memory(
    persona_id: int,
    memory_type: str,
    content: str,
    importance: float = 1.0,
    context: Optional[dict] = None,
    current_user: DBUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Store a new memory for a persona."""
    try:
        # Get persona
        persona = await get_persona_by_id(db, persona_id, current_user.id)
        if not persona:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Persona not found"
            )
        
        # Store memory
        memory = await memory_service.store_memory(
            db, persona, memory_type, content, context, importance
        )
        
        return {
            "success": True,
            "memory": {
                "id": memory.id,
                "type": memory.memory_type,
                "content": memory.content,
                "importance": memory.importance,
                "created_at": memory.created_at
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to store memory: {str(e)}"
        )


@router.get("/personality/{persona_id}")
async def get_personality_insights(
    persona_id: int,
    current_user: DBUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get personality insights for a persona."""
    try:
        # Get persona
        persona = await get_persona_by_id(db, persona_id, current_user.id)
        if not persona:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Persona not found"
            )
        
        return {
            "success": True,
            "personality": {
                "traits": persona.personality_traits,
                "voice_settings": persona.voice_settings,
                "learned_preferences": persona.learned_preferences,
                "conversation_patterns": persona.conversation_patterns,
                "emotional_responses": persona.emotional_responses,
                "interaction_count": persona.interaction_count,
                "last_interaction": persona.last_interaction
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get personality insights: {str(e)}"
        )


@router.get("/voices/available")
async def get_available_voices():
    """Get available voices for text-to-speech."""
    try:
        voices = await voice_synthesis_service.get_available_voices()
        return {
            "success": True,
            "voices": voices
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get available voices: {str(e)}"
        )


@router.put("/personas/{persona_id}/voice-settings")
async def update_persona_voice_settings(
    persona_id: int,
    voice_settings: dict,
    current_user: DBUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update voice settings for a persona."""
    try:
        # Get persona
        persona = await get_persona_by_id(db, persona_id, current_user.id)
        if not persona:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Persona not found"
            )
        
        # Update voice settings
        updated_persona = await voice_synthesis_service.update_persona_voice_settings(
            persona, voice_settings, db
        )
        
        return {
            "success": True,
            "persona_id": persona_id,
            "voice_settings": updated_persona.voice_settings
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update voice settings: {str(e)}"
        )


@router.post("/learn-from-conversation/{conversation_id}")
async def learn_from_conversation(
    conversation_id: int,
    current_user: DBUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Learn personality traits from a conversation."""
    try:
        # Get conversation and messages
        from app.crud.chat import get_conversation_by_id
        
        conversation = await get_conversation_by_id(db, conversation_id, current_user.id)
        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )
        
        # Get messages
        messages = await get_messages_by_conversation(db, conversation_id, current_user.id)
        
        # Get persona
        persona = await get_persona_by_id(db, conversation.persona_id, current_user.id)
        if not persona:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Persona not found"
            )
        
        # Learn from conversation
        learnings = await personality_learning_service.learn_from_conversation(
            db, persona, messages
        )
        
        # Store memories from conversation
        await memory_service.learn_from_conversation(db, persona, messages)
        
        return {
            "success": True,
            "learnings_count": len(learnings),
            "conversation_id": conversation_id
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to learn from conversation: {str(e)}"
        )


@router.get("/health")
async def ai_health_check():
    """Check the health of AI services."""
    try:
        health_status = {
            "computer_vision": {
                "status": "available" if computer_vision_service.models_loaded else "unavailable",
                "models_loaded": computer_vision_service.models_loaded
            },
            "voice_synthesis": {
                "status": "available",
                "engines": list(voice_synthesis_service.engines.keys())
            },
            "memory_service": {
                "status": "available" if memory_service.embedding_model else "unavailable",
                "vector_db": "available" if memory_service.chroma_client else "unavailable"
            },
            "personality_learning": {
                "status": "available"
            }
        }
        
        return {
            "success": True,
            "ai_services": health_status
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Health check failed: {str(e)}"
        ) 