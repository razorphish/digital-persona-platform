"""
CRUD operations for Persona model
"""
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.persona_db import Persona
from app.models.user_db import User

async def get_persona_by_id(db: AsyncSession, persona_id: int, user_id: int) -> Optional[Persona]:
    """Get persona by ID for a specific user."""
    result = await db.execute(
        select(Persona).where(Persona.id == persona_id, Persona.user_id == user_id)
    )
    return result.scalar_one_or_none()

async def get_personas_by_user(db: AsyncSession, user_id: int) -> List[Persona]:
    """Get all personas for a specific user."""
    result = await db.execute(
        select(Persona).where(Persona.user_id == user_id)
    )
    return list(result.scalars().all())

async def get_or_create_self_persona(db: AsyncSession, user_id: int) -> Persona:
    """Get or create the default 'self' persona for a user."""
    # First try to find existing self personas
    result = await db.execute(
        select(Persona).where(Persona.user_id == user_id, Persona.relation_type == "self")
    )
    existing_personas = list(result.scalars().all())
    
    if existing_personas:
        # If there are multiple self personas, keep the first one and delete the rest
        if len(existing_personas) > 1:
            # Keep the first one, delete the rest
            for persona in existing_personas[1:]:
                await db.delete(persona)
            await db.commit()
        
        return existing_personas[0]
    
    # Create default self persona if it doesn't exist
    default_persona = Persona(
        name="My Digital Self",
        description="Your personal AI persona that learns and adapts to your personality, memories, and communication style.",
        relation_type="self",
        user_id=user_id,
        personality_traits={},
        voice_settings={},
        memory_enabled=True,
        learning_enabled=True,
        image_analysis_enabled=True,
        voice_synthesis_enabled=True,
        learned_preferences={},
        conversation_patterns={},
        emotional_responses={},
        memory_context="",
        interaction_count=0
    )
    
    db.add(default_persona)
    await db.commit()
    await db.refresh(default_persona)
    return default_persona

async def create_persona(db: AsyncSession, name: str, description: Optional[str], 
                        relation_type: str, user_id: int) -> Persona:
    """Create a new persona."""
    db_persona = Persona(
        name=name,
        description=description,
        relation_type=relation_type,
        user_id=user_id
    )
    
    db.add(db_persona)
    await db.commit()
    await db.refresh(db_persona)
    return db_persona

async def update_persona(db: AsyncSession, persona: Persona, **kwargs) -> Persona:
    """Update persona fields."""
    for field, value in kwargs.items():
        if hasattr(persona, field):
            setattr(persona, field, value)
    
    await db.commit()
    await db.refresh(persona)
    return persona

async def delete_persona(db: AsyncSession, persona_id: int, user_id: int) -> bool:
    """Delete a persona."""
    persona = await get_persona_by_id(db, persona_id, user_id)
    if persona:
        await db.delete(persona)
        await db.commit()
        return True
    return False

async def update_persona_learning(db: AsyncSession, persona: Persona, memory_context: str, interaction_count: int) -> Persona:
    """Update persona with new learning data."""
    from datetime import datetime
    
    persona.memory_context = memory_context
    persona.interaction_count = interaction_count
    persona.last_interaction = datetime.utcnow()
    
    await db.commit()
    await db.refresh(persona)
    return persona

async def generate_persona_summary(db: AsyncSession, persona: Persona) -> str:
    """Generate AI summary of the persona based on its data."""
    # For now, create a simple summary based on available data
    # In a real implementation, this would use OpenAI or another AI service
    
    summary_parts = []
    
    # Basic info
    summary_parts.append(f"{persona.name} is a digital persona created {persona.created_at.strftime('%B %d, %Y')}.")
    
    # Description
    if persona.description:
        summary_parts.append(f"Description: {persona.description}")
    
    # Interaction stats
    summary_parts.append(f"Has engaged in {persona.interaction_count} interactions.")
    
    # Memory context (if available)
    if persona.memory_context and len(persona.memory_context.strip()) > 0:
        # Truncate long memory context for summary
        context_preview = persona.memory_context[:200] + "..." if len(persona.memory_context) > 200 else persona.memory_context
        summary_parts.append(f"Learning context: {context_preview}")
    
    # Personality traits (if available)
    if persona.personality_traits and len(persona.personality_traits) > 0:
        traits_summary = ", ".join([f"{k.replace('_', ' ')}: {v}" for k, v in persona.personality_traits.items()])
        summary_parts.append(f"Personality traits: {traits_summary}")
    
    # Capabilities
    capabilities = []
    if persona.memory_enabled:
        capabilities.append("memory and learning")
    if persona.image_analysis_enabled:
        capabilities.append("image analysis")
    if persona.voice_synthesis_enabled:
        capabilities.append("voice synthesis")
    
    if capabilities:
        summary_parts.append(f"Capabilities: {', '.join(capabilities)}.")
    
    # Age calculation
    from datetime import datetime
    age_days = (datetime.utcnow() - persona.created_at).days
    if age_days == 0:
        summary_parts.append("Created today.")
    elif age_days == 1:
        summary_parts.append("Created yesterday.")
    else:
        summary_parts.append(f"Age: {age_days} days old.")
    
    return " ".join(summary_parts) 