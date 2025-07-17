"""
CRUD operations for chat conversations and messages
"""
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.models.chat_db import Conversation, ChatMessage


async def get_conversation_by_id(db: AsyncSession, conversation_id: int, user_id: int) -> Optional[Conversation]:
    """Get conversation by ID for a specific user."""
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id, 
            Conversation.user_id == user_id
        )
    )
    return result.scalar_one_or_none()


async def get_conversations_by_user(db: AsyncSession, user_id: int) -> List[Conversation]:
    """Get all conversations for a specific user."""
    result = await db.execute(
        select(Conversation)
        .where(Conversation.user_id == user_id)
        .order_by(desc(Conversation.updated_at))
    )
    return list(result.scalars().all())


async def get_conversations_by_persona(db: AsyncSession, persona_id: int, user_id: int) -> List[Conversation]:
    """Get all conversations for a specific persona (user-scoped)."""
    result = await db.execute(
        select(Conversation)
        .where(
            Conversation.persona_id == persona_id,
            Conversation.user_id == user_id
        )
        .order_by(desc(Conversation.updated_at))
    )
    return list(result.scalars().all())


async def create_conversation(
    db: AsyncSession,
    title: str,
    persona_id: int,
    user_id: int
) -> Conversation:
    """Create a new conversation."""
    db_conversation = Conversation(
        title=title,
        persona_id=persona_id,
        user_id=user_id
    )
    
    db.add(db_conversation)
    await db.commit()
    await db.refresh(db_conversation)
    return db_conversation


async def update_conversation(db: AsyncSession, conversation: Conversation, **kwargs) -> Conversation:
    """Update conversation fields."""
    for field, value in kwargs.items():
        if hasattr(conversation, field):
            setattr(conversation, field, value)
    
    await db.commit()
    await db.refresh(conversation)
    return conversation


async def delete_conversation(db: AsyncSession, conversation_id: int, user_id: int) -> bool:
    """Delete a conversation (user-scoped)."""
    conversation = await get_conversation_by_id(db, conversation_id, user_id)
    if conversation:
        await db.delete(conversation)
        await db.commit()
        return True
    return False


async def get_messages_by_conversation(
    db: AsyncSession, 
    conversation_id: int, 
    user_id: int,
    limit: Optional[int] = None
) -> List[ChatMessage]:
    """Get messages for a specific conversation (user-scoped)."""
    # First verify the conversation belongs to the user
    conversation = await get_conversation_by_id(db, conversation_id, user_id)
    if not conversation:
        return []
    
    query = select(ChatMessage).where(
        ChatMessage.conversation_id == conversation_id
    ).order_by(ChatMessage.created_at)
    
    if limit:
        query = query.limit(limit)
    
    result = await db.execute(query)
    return list(result.scalars().all())


async def create_chat_message(
    db: AsyncSession,
    conversation_id: int,
    role: str,
    content: str,
    tokens_used: Optional[int] = None,
    model_used: Optional[str] = None,
    response_time_ms: Optional[int] = None
) -> ChatMessage:
    """Create a new chat message."""
    db_message = ChatMessage(
        conversation_id=conversation_id,
        role=role,
        content=content,
        tokens_used=tokens_used,
        model_used=model_used,
        response_time_ms=response_time_ms
    )
    
    db.add(db_message)
    await db.commit()
    await db.refresh(db_message)
    return db_message


async def get_message_by_id(db: AsyncSession, message_id: int, user_id: int) -> Optional[ChatMessage]:
    """Get message by ID (user-scoped through conversation)."""
    result = await db.execute(
        select(ChatMessage)
        .join(Conversation)
        .where(
            ChatMessage.id == message_id,
            Conversation.user_id == user_id
        )
    )
    return result.scalar_one_or_none()


async def delete_message(db: AsyncSession, message_id: int, user_id: int) -> bool:
    """Delete a message (user-scoped)."""
    message = await get_message_by_id(db, message_id, user_id)
    if message:
        await db.delete(message)
        await db.commit()
        return True
    return False


async def get_conversation_stats(db: AsyncSession, user_id: int) -> dict:
    """Get conversation statistics for a user."""
    # Get total conversations
    conversations_result = await db.execute(
        select(Conversation).where(Conversation.user_id == user_id)
    )
    total_conversations = len(conversations_result.scalars().all())
    
    # Get total messages
    messages_result = await db.execute(
        select(ChatMessage)
        .join(Conversation)
        .where(Conversation.user_id == user_id)
    )
    total_messages = len(messages_result.scalars().all())
    
    # Get total tokens used
    tokens_result = await db.execute(
        select(ChatMessage.tokens_used)
        .join(Conversation)
        .where(
            Conversation.user_id == user_id,
            ChatMessage.tokens_used.isnot(None)
        )
    )
    tokens_list = [t for t in tokens_result.scalars().all() if t is not None]
    total_tokens = sum(tokens_list)
    
    return {
        "total_conversations": total_conversations,
        "total_messages": total_messages,
        "total_tokens": total_tokens
    } 