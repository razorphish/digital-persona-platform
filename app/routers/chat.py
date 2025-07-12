"""
Enhanced chat router for OpenAI-powered conversations with digital personas
"""
import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, field_validator
from app.models.user_db import User as DBUser
from app.models.persona_db import Persona as DBPersona
from app.models.chat_db import Conversation as DBConversation, ChatMessage as DBChatMessage
from app.services.auth_db import get_current_active_user
from app.services.openai_service import openai_service
from app.crud import chat as chat_crud, persona as persona_crud
from app.database import get_db

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["chat"])

# Pydantic models
class ConversationCreate(BaseModel):
    title: str
    persona_id: int
    
    @field_validator('title')
    def validate_title(cls, v):
        if not v or not v.strip():
            raise ValueError('Title cannot be empty')
        return v.strip()

class ConversationResponse(BaseModel):
    id: int
    title: str
    persona_id: int
    user_id: int
    is_active: bool
    created_at: str
    updated_at: str

class MessageCreate(BaseModel):
    content: str
    
    @field_validator('content')
    def validate_content(cls, v):
        if not v or not v.strip():
            raise ValueError('Message content cannot be empty')
        if len(v.strip()) > 4000:  # Reasonable message length limit
            raise ValueError('Message content too long (max 4000 characters)')
        return v.strip()

class MessageResponse(BaseModel):
    model_config = {"protected_namespaces": ()}
    
    id: int
    conversation_id: int
    role: str
    content: str
    tokens_used: Optional[int] = None
    model_used: Optional[str] = None
    response_time_ms: Optional[int] = None
    created_at: str

class ChatResponse(BaseModel):
    conversation: ConversationResponse
    user_message: MessageResponse
    assistant_message: MessageResponse

class ChatErrorResponse(BaseModel):
    error: str
    error_type: str
    suggestion: Optional[str] = None


@router.post("/conversations", response_model=ConversationResponse)
async def create_conversation(
    conversation_data: ConversationCreate,
    current_user: DBUser = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new conversation with a persona."""
    
    try:
        # Verify persona exists and belongs to user
        persona = await persona_crud.get_persona_by_id(db, conversation_data.persona_id, current_user.id)
        if not persona:
            raise HTTPException(
                status_code=404,
                detail=f"Persona {conversation_data.persona_id} not found"
            )
        
        # Create conversation
        db_conversation = await chat_crud.create_conversation(
            db=db,
            title=conversation_data.title,
            persona_id=conversation_data.persona_id,
            user_id=current_user.id
        )
        
        logger.info(f"Created conversation '{conversation_data.title}' for user {current_user.id} with persona {persona.name}")
        
        return ConversationResponse(
            id=db_conversation.id,
            title=db_conversation.title,
            persona_id=db_conversation.persona_id,
            user_id=db_conversation.user_id,
            is_active=db_conversation.is_active,
            created_at=db_conversation.created_at.isoformat(),
            updated_at=db_conversation.updated_at.isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating conversation: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to create conversation"
        )


@router.get("/conversations", response_model=List[ConversationResponse])
async def list_conversations(
    persona_id: Optional[int] = None,
    current_user: DBUser = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """List conversations for the current user, optionally filtered by persona."""
    
    try:
        if persona_id:
            # Verify persona exists and belongs to user
            persona = await persona_crud.get_persona_by_id(db, persona_id, current_user.id)
            if not persona:
                raise HTTPException(
                    status_code=404,
                    detail=f"Persona {persona_id} not found"
                )
            
            # Get conversations for specific persona
            db_conversations = await chat_crud.get_conversations_by_persona(db, persona_id, current_user.id)
        else:
            # Get all conversations for user
            db_conversations = await chat_crud.get_conversations_by_user(db, current_user.id)
        
        return [
            ConversationResponse(
                id=conv.id,
                title=conv.title,
                persona_id=conv.persona_id,
                user_id=conv.user_id,
                is_active=conv.is_active,
                created_at=conv.created_at.isoformat(),
                updated_at=conv.updated_at.isoformat()
            )
            for conv in db_conversations
        ]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing conversations: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve conversations"
        )


@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(
    conversation_id: int,
    current_user: DBUser = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get specific conversation information."""
    
    try:
        db_conversation = await chat_crud.get_conversation_by_id(db, conversation_id, current_user.id)
        if not db_conversation:
            raise HTTPException(
                status_code=404,
                detail=f"Conversation {conversation_id} not found"
            )
        
        return ConversationResponse(
            id=db_conversation.id,
            title=db_conversation.title,
            persona_id=db_conversation.persona_id,
            user_id=db_conversation.user_id,
            is_active=db_conversation.is_active,
            created_at=db_conversation.created_at.isoformat(),
            updated_at=db_conversation.updated_at.isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting conversation {conversation_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve conversation"
        )


@router.get("/conversations/{conversation_id}/messages", response_model=List[MessageResponse])
async def get_conversation_messages(
    conversation_id: int,
    limit: Optional[int] = None,
    current_user: DBUser = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get messages for a specific conversation."""
    
    try:
        # Validate limit parameter
        if limit is not None and (limit < 1 or limit > 100):
            raise HTTPException(
                status_code=400,
                detail="Limit must be between 1 and 100"
            )
        
        db_messages = await chat_crud.get_messages_by_conversation(
            db, conversation_id, current_user.id, limit
        )
        
        return [
            MessageResponse(
                id=msg.id,
                conversation_id=msg.conversation_id,
                role=msg.role,
                content=msg.content,
                tokens_used=msg.tokens_used,
                model_used=msg.model_used,
                response_time_ms=msg.response_time_ms,
                created_at=msg.created_at.isoformat()
            )
            for msg in db_messages
        ]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting messages for conversation {conversation_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve messages"
        )


@router.post("/conversations/{conversation_id}/send", response_model=ChatResponse)
async def send_message(
    conversation_id: int,
    message_data: MessageCreate,
    current_user: DBUser = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Send a message to a persona and get AI response with enhanced error handling."""
    
    try:
        # Get conversation and verify ownership
        db_conversation = await chat_crud.get_conversation_by_id(db, conversation_id, current_user.id)
        if not db_conversation:
            raise HTTPException(
                status_code=404,
                detail=f"Conversation {conversation_id} not found"
            )
        
        # Get persona
        persona = await persona_crud.get_persona_by_id(db, db_conversation.persona_id, current_user.id)
        if not persona:
            raise HTTPException(
                status_code=404,
                detail="Persona not found"
            )
        
        # Get conversation history (last 20 messages for context)
        conversation_history = await chat_crud.get_messages_by_conversation(
            db, conversation_id, current_user.id, limit=20
        )
        
        # Save user message
        user_message = await chat_crud.create_chat_message(
            db=db,
            conversation_id=conversation_id,
            role="user",
            content=message_data.content
        )
        
        logger.info(f"User {current_user.id} sent message to persona '{persona.name}' in conversation {conversation_id}")
        
        # Generate AI response with enhanced error handling
        try:
            ai_response = await openai_service.generate_response(
                persona=persona,
                user_message=message_data.content,
                conversation_history=conversation_history
            )
            
            # Save assistant message
            assistant_message = await chat_crud.create_chat_message(
                db=db,
                conversation_id=conversation_id,
                role="assistant",
                content=ai_response["content"],
                tokens_used=ai_response["tokens_used"],
                model_used=ai_response["model_used"],
                response_time_ms=ai_response["response_time_ms"]
            )
            
            # Update conversation timestamp
            await chat_crud.update_conversation(db, db_conversation)
            
            logger.info(f"Generated AI response for persona '{persona.name}' in {ai_response['response_time_ms']}ms")
            
            return ChatResponse(
                conversation=ConversationResponse(
                    id=db_conversation.id,
                    title=db_conversation.title,
                    persona_id=db_conversation.persona_id,
                    user_id=db_conversation.user_id,
                    is_active=db_conversation.is_active,
                    created_at=db_conversation.created_at.isoformat(),
                    updated_at=db_conversation.updated_at.isoformat()
                ),
                user_message=MessageResponse(
                    id=user_message.id,
                    conversation_id=user_message.conversation_id,
                    role=user_message.role,
                    content=user_message.content,
                    tokens_used=user_message.tokens_used,
                    model_used=user_message.model_used,
                    response_time_ms=user_message.response_time_ms,
                    created_at=user_message.created_at.isoformat()
                ),
                assistant_message=MessageResponse(
                    id=assistant_message.id,
                    conversation_id=assistant_message.conversation_id,
                    role=assistant_message.role,
                    content=assistant_message.content,
                    tokens_used=assistant_message.tokens_used,
                    model_used=assistant_message.model_used,
                    response_time_ms=assistant_message.response_time_ms,
                    created_at=assistant_message.created_at.isoformat()
                )
            )
            
        except HTTPException as e:
            # If AI response fails, still save the user message but return error
            logger.error(f"AI response generation failed for conversation {conversation_id}: {e.detail}")
            raise HTTPException(
                status_code=e.status_code,
                detail=e.detail
            )
            
        except Exception as e:
            logger.error(f"Unexpected error generating AI response: {e}")
            raise HTTPException(
                status_code=500,
                detail="Failed to generate AI response. Please try again."
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in send_message: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to process message"
        )


@router.put("/conversations/{conversation_id}", response_model=ConversationResponse)
async def update_conversation(
    conversation_id: int,
    conversation_update: ConversationCreate,
    current_user: DBUser = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Update conversation title."""
    
    try:
        db_conversation = await chat_crud.get_conversation_by_id(db, conversation_id, current_user.id)
        if not db_conversation:
            raise HTTPException(
                status_code=404,
                detail=f"Conversation {conversation_id} not found"
            )
        
        # Verify persona exists and belongs to user
        persona = await persona_crud.get_persona_by_id(db, conversation_update.persona_id, current_user.id)
        if not persona:
            raise HTTPException(
                status_code=404,
                detail=f"Persona {conversation_update.persona_id} not found"
            )
        
        # Update conversation
        updated_conversation = await chat_crud.update_conversation(
            db=db,
            conversation=db_conversation,
            title=conversation_update.title,
            persona_id=conversation_update.persona_id
        )
        
        logger.info(f"Updated conversation {conversation_id} for user {current_user.id}")
        
        return ConversationResponse(
            id=updated_conversation.id,
            title=updated_conversation.title,
            persona_id=updated_conversation.persona_id,
            user_id=updated_conversation.user_id,
            is_active=updated_conversation.is_active,
            created_at=updated_conversation.created_at.isoformat(),
            updated_at=updated_conversation.updated_at.isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating conversation {conversation_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to update conversation"
        )


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: int,
    current_user: DBUser = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a conversation and all its messages."""
    
    try:
        success = await chat_crud.delete_conversation(db, conversation_id, current_user.id)
        
        if not success:
            raise HTTPException(
                status_code=404,
                detail=f"Conversation {conversation_id} not found"
            )
        
        logger.info(f"Deleted conversation {conversation_id} for user {current_user.id}")
        
        return {"message": f"Conversation {conversation_id} deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting conversation {conversation_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to delete conversation"
        )


@router.delete("/messages/{message_id}")
async def delete_message(
    message_id: int,
    current_user: DBUser = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a specific message."""
    
    try:
        success = await chat_crud.delete_message(db, message_id, current_user.id)
        
        if not success:
            raise HTTPException(
                status_code=404,
                detail=f"Message {message_id} not found"
            )
        
        logger.info(f"Deleted message {message_id} for user {current_user.id}")
        
        return {"message": f"Message {message_id} deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting message {message_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to delete message"
        )


@router.get("/stats")
async def get_chat_stats(
    current_user: DBUser = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get chat statistics for the current user."""
    
    try:
        stats = await chat_crud.get_conversation_stats(db, current_user.id)
        
        return {
            "total_conversations": stats["total_conversations"],
            "total_messages": stats["total_messages"],
            "total_tokens": stats["total_tokens"],
            "estimated_cost_usd": round(stats["total_tokens"] * 0.000002, 4),  # GPT-3.5-turbo pricing
            "user_id": current_user.id
        }
        
    except Exception as e:
        logger.error(f"Error getting chat stats for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve chat statistics"
        )


@router.get("/health")
async def check_openai_health():
    """Check if OpenAI API is working with detailed status."""
    
    try:
        api_status = openai_service.get_api_status()
        return api_status
    except Exception as e:
        logger.error(f"Error checking OpenAI health: {e}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "api_key_configured": bool(openai_service.api_key)
        }


@router.get("/models")
async def list_available_models():
    """List available OpenAI models."""
    
    try:
        if not openai_service.is_available():
            raise HTTPException(
                status_code=503,
                detail="OpenAI service is not available"
            )
        
        openai_service._initialize_client()
        if openai_service.client is None:
            raise HTTPException(
                status_code=503,
                detail="OpenAI client not initialized"
            )
        
        models = openai_service.client.models.list()
        
        # Filter for chat models
        chat_models = [
            {
                "id": model.id,
                "created": model.created,
                "owned_by": model.owned_by
            }
            for model in models.data
            if "gpt" in model.id.lower() or "claude" in model.id.lower()
        ]
        
        return {
            "models": chat_models,
            "default_model": openai_service.default_model,
            "total_models": len(chat_models)
        }
        
    except Exception as e:
        logger.error(f"Error listing models: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve available models"
        ) 