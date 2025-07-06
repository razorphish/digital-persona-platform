"""
Chat router for OpenAI-powered conversations with digital personas
"""
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, validator
from app.models.user_db import User as DBUser
from app.models.persona_db import Persona as DBPersona
from app.models.chat_db import Conversation as DBConversation, ChatMessage as DBChatMessage
from app.services.auth_db import get_current_active_user
from app.services.openai_service import openai_service
from app.crud import chat as chat_crud, persona as persona_crud
from app.database import get_db

router = APIRouter(prefix="/chat", tags=["chat"])

# Pydantic models
class ConversationCreate(BaseModel):
    title: str
    persona_id: int
    
    @validator('title')
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
    
    @validator('content')
    def validate_content(cls, v):
        if not v or not v.strip():
            raise ValueError('Message content cannot be empty')
        return v.strip()

class MessageResponse(BaseModel):
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


@router.post("/conversations", response_model=ConversationResponse)
async def create_conversation(
    conversation_data: ConversationCreate,
    current_user: DBUser = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new conversation with a persona."""
    
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
    
    return ConversationResponse(
        id=db_conversation.id,
        title=db_conversation.title,
        persona_id=db_conversation.persona_id,
        user_id=db_conversation.user_id,
        is_active=db_conversation.is_active,
        created_at=db_conversation.created_at.isoformat(),
        updated_at=db_conversation.updated_at.isoformat()
    )


@router.get("/conversations", response_model=List[ConversationResponse])
async def list_conversations(
    persona_id: Optional[int] = None,
    current_user: DBUser = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """List conversations for the current user, optionally filtered by persona."""
    
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


@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(
    conversation_id: int,
    current_user: DBUser = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get specific conversation information."""
    
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


@router.get("/conversations/{conversation_id}/messages", response_model=List[MessageResponse])
async def get_conversation_messages(
    conversation_id: int,
    limit: Optional[int] = None,
    current_user: DBUser = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get messages for a specific conversation."""
    
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


@router.post("/conversations/{conversation_id}/send", response_model=ChatResponse)
async def send_message(
    conversation_id: int,
    message_data: MessageCreate,
    current_user: DBUser = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Send a message to a persona and get AI response."""
    
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
    
    # Generate AI response
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
        
    except Exception as e:
        # If AI response fails, still save the user message but return error
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate AI response: {str(e)}"
        )


@router.put("/conversations/{conversation_id}", response_model=ConversationResponse)
async def update_conversation(
    conversation_id: int,
    conversation_update: ConversationCreate,
    current_user: DBUser = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Update conversation title."""
    
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
    
    return ConversationResponse(
        id=updated_conversation.id,
        title=updated_conversation.title,
        persona_id=updated_conversation.persona_id,
        user_id=updated_conversation.user_id,
        is_active=updated_conversation.is_active,
        created_at=updated_conversation.created_at.isoformat(),
        updated_at=updated_conversation.updated_at.isoformat()
    )


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: int,
    current_user: DBUser = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a conversation and all its messages."""
    
    success = await chat_crud.delete_conversation(db, conversation_id, current_user.id)
    
    if not success:
        raise HTTPException(
            status_code=404,
            detail=f"Conversation {conversation_id} not found"
        )
    
    return {"message": f"Conversation {conversation_id} deleted successfully"}


@router.delete("/messages/{message_id}")
async def delete_message(
    message_id: int,
    current_user: DBUser = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a specific message."""
    
    success = await chat_crud.delete_message(db, message_id, current_user.id)
    
    if not success:
        raise HTTPException(
            status_code=404,
            detail=f"Message {message_id} not found"
        )
    
    return {"message": f"Message {message_id} deleted successfully"}


@router.get("/stats")
async def get_chat_stats(
    current_user: DBUser = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get chat statistics for the current user."""
    
    stats = await chat_crud.get_conversation_stats(db, current_user.id)
    
    return {
        "total_conversations": stats["total_conversations"],
        "total_messages": stats["total_messages"],
        "total_tokens": stats["total_tokens"],
        "estimated_cost_usd": round(stats["total_tokens"] * 0.000002, 4)  # GPT-3.5-turbo pricing
    }


@router.get("/health")
async def check_openai_health():
    """Check if OpenAI API is working."""
    
    try:
        is_valid = openai_service.validate_api_key()
        return {
            "status": "healthy" if is_valid else "unhealthy",
            "openai_api": "connected" if is_valid else "disconnected"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "openai_api": "error",
            "error": str(e)
        } 