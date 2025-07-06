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