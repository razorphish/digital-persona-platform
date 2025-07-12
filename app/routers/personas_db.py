"""
Protected personas router with authentication and database storage
"""
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, field_validator
from app.models.user_db import User as DBUser
from app.services.auth_db import get_current_active_user
from app.crud import persona as persona_crud
from app.database import get_db
from datetime import datetime

router = APIRouter(prefix="/personas", tags=["personas"])

# Pydantic models (V1 syntax)
class PersonaCreate(BaseModel):
    name: str
    description: Optional[str] = None
    relation_type: str
    
    @field_validator('name')
    def validate_name(cls, v):
        if not v or not v.strip():
            raise ValueError('Name cannot be empty')
        return v.strip()
    
    @field_validator('relation_type')
    def validate_relation_type(cls, v):
        valid = ['self', 'parent', 'spouse', 'child', 'sibling', 'friend', 'colleague', 'other']
        if v.lower() not in valid:
            raise ValueError(f'Relation type must be one of: {", ".join(valid)}')
        return v.lower()

class PersonaLearningData(BaseModel):
    text: str
    
    @field_validator('text')
    def validate_text(cls, v):
        if not v or not v.strip():
            raise ValueError('Text cannot be empty')
        return v.strip()

class PersonaResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    relation_type: str
    created_at: str
    status: str = "active"
    user_id: int
    personality_traits: Optional[dict] = None
    voice_settings: Optional[dict] = None
    memory_enabled: bool = True
    learning_enabled: bool = True
    image_analysis_enabled: bool = True
    voice_synthesis_enabled: bool = True
    learned_preferences: Optional[dict] = None
    conversation_patterns: Optional[dict] = None
    emotional_responses: Optional[dict] = None
    memory_context: Optional[str] = None
    last_interaction: Optional[str] = None
    interaction_count: int = 0


@router.get("/self", response_model=PersonaResponse)
async def get_self_persona(
    current_user: DBUser = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get or create the user's self persona (requires authentication)."""
    db_persona = await persona_crud.get_or_create_self_persona(db, current_user.id)
    
    return PersonaResponse(
        id=db_persona.id,
        name=db_persona.name,
        description=db_persona.description,
        relation_type=db_persona.relation_type,
        created_at=db_persona.created_at.isoformat(),
        status=db_persona.status,
        user_id=db_persona.user_id,
        personality_traits=db_persona.personality_traits,
        voice_settings=db_persona.voice_settings,
        memory_enabled=db_persona.memory_enabled,
        learning_enabled=db_persona.learning_enabled,
        image_analysis_enabled=db_persona.image_analysis_enabled,
        voice_synthesis_enabled=db_persona.voice_synthesis_enabled,
        learned_preferences=db_persona.learned_preferences,
        conversation_patterns=db_persona.conversation_patterns,
        emotional_responses=db_persona.emotional_responses,
        memory_context=db_persona.memory_context,
        last_interaction=db_persona.last_interaction.isoformat() if db_persona.last_interaction else None,
        interaction_count=db_persona.interaction_count
    )


@router.post("/", response_model=PersonaResponse)
async def create_persona(
    persona: PersonaCreate,
    current_user: DBUser = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new digital persona (requires authentication)."""
    db_persona = await persona_crud.create_persona(
        db=db,
        name=persona.name,
        description=persona.description,
        relation_type=persona.relation_type,
        user_id=current_user.id
    )
    
    return PersonaResponse(
        id=db_persona.id,
        name=db_persona.name,
        description=db_persona.description,
        relation_type=db_persona.relation_type,
        created_at=db_persona.created_at.isoformat(),
        status=db_persona.status,
        user_id=db_persona.user_id,
        personality_traits=db_persona.personality_traits,
        voice_settings=db_persona.voice_settings,
        memory_enabled=db_persona.memory_enabled,
        learning_enabled=db_persona.learning_enabled,
        image_analysis_enabled=db_persona.image_analysis_enabled,
        voice_synthesis_enabled=db_persona.voice_synthesis_enabled,
        learned_preferences=db_persona.learned_preferences,
        conversation_patterns=db_persona.conversation_patterns,
        emotional_responses=db_persona.emotional_responses,
        memory_context=db_persona.memory_context,
        last_interaction=db_persona.last_interaction.isoformat() if db_persona.last_interaction else None,
        interaction_count=db_persona.interaction_count
    )


@router.get("/", response_model=List[PersonaResponse])
async def list_personas(
    current_user: DBUser = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """List all personas for the current user (requires authentication)."""
    db_personas = await persona_crud.get_personas_by_user(db, current_user.id)
    
    return [
        PersonaResponse(
            id=persona.id,
            name=persona.name,
            description=persona.description,
            relation_type=persona.relation_type,
            created_at=persona.created_at.isoformat(),
            status=persona.status,
            user_id=persona.user_id,
            personality_traits=persona.personality_traits,
            voice_settings=persona.voice_settings,
            memory_enabled=persona.memory_enabled,
            learning_enabled=persona.learning_enabled,
            image_analysis_enabled=persona.image_analysis_enabled,
            voice_synthesis_enabled=persona.voice_synthesis_enabled,
            learned_preferences=persona.learned_preferences,
            conversation_patterns=persona.conversation_patterns,
            emotional_responses=persona.emotional_responses,
            memory_context=persona.memory_context,
            last_interaction=persona.last_interaction.isoformat() if persona.last_interaction else None,
            interaction_count=persona.interaction_count
        )
        for persona in db_personas
    ]


@router.get("/{persona_id}", response_model=PersonaResponse)
async def get_persona(
    persona_id: int,
    current_user: DBUser = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get specific persona (requires authentication and ownership)."""
    db_persona = await persona_crud.get_persona_by_id(db, persona_id, current_user.id)
    
    if not db_persona:
        raise HTTPException(status_code=404, detail=f"Persona {persona_id} not found")
    
    return PersonaResponse(
        id=db_persona.id,
        name=db_persona.name,
        description=db_persona.description,
        relation_type=db_persona.relation_type,
        created_at=db_persona.created_at.isoformat(),
        status=db_persona.status,
        user_id=db_persona.user_id,
        personality_traits=db_persona.personality_traits,
        voice_settings=db_persona.voice_settings,
        memory_enabled=db_persona.memory_enabled,
        learning_enabled=db_persona.learning_enabled,
        image_analysis_enabled=db_persona.image_analysis_enabled,
        voice_synthesis_enabled=db_persona.voice_synthesis_enabled,
        learned_preferences=db_persona.learned_preferences,
        conversation_patterns=db_persona.conversation_patterns,
        emotional_responses=db_persona.emotional_responses,
        memory_context=db_persona.memory_context,
        last_interaction=db_persona.last_interaction.isoformat() if db_persona.last_interaction else None,
        interaction_count=db_persona.interaction_count
    )


@router.delete("/{persona_id}")
async def delete_persona(
    persona_id: int,
    current_user: DBUser = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a persona (requires authentication and ownership)."""
    success = await persona_crud.delete_persona(db, persona_id, current_user.id)
    
    if not success:
        raise HTTPException(status_code=404, detail=f"Persona {persona_id} not found")
    
    return {"message": f"Persona {persona_id} deleted successfully"}


@router.put("/{persona_id}", response_model=PersonaResponse)
async def update_persona(
    persona_id: int,
    persona_update: PersonaCreate,
    current_user: DBUser = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a persona (requires authentication and ownership)."""
    db_persona = await persona_crud.get_persona_by_id(db, persona_id, current_user.id)
    
    if not db_persona:
        raise HTTPException(status_code=404, detail=f"Persona {persona_id} not found")
    
    updated_persona = await persona_crud.update_persona(
        db=db,
        persona=db_persona,
        name=persona_update.name,
        description=persona_update.description,
        relation_type=persona_update.relation_type
    )
    
    return PersonaResponse(
        id=updated_persona.id,
        name=updated_persona.name,
        description=updated_persona.description,
        relation_type=updated_persona.relation_type,
        created_at=updated_persona.created_at.isoformat(),
        status=updated_persona.status,
        user_id=updated_persona.user_id,
        personality_traits=updated_persona.personality_traits,
        voice_settings=updated_persona.voice_settings,
        memory_enabled=updated_persona.memory_enabled,
        learning_enabled=updated_persona.learning_enabled,
        image_analysis_enabled=updated_persona.image_analysis_enabled,
        voice_synthesis_enabled=updated_persona.voice_synthesis_enabled,
        learned_preferences=updated_persona.learned_preferences,
        conversation_patterns=updated_persona.conversation_patterns,
        emotional_responses=updated_persona.emotional_responses,
        memory_context=updated_persona.memory_context,
        last_interaction=updated_persona.last_interaction.isoformat() if updated_persona.last_interaction else None,
        interaction_count=updated_persona.interaction_count
    )


@router.post("/{persona_id}/learn", response_model=PersonaResponse)
async def add_learning_data(
    persona_id: int,
    learning_data: PersonaLearningData,
    current_user: DBUser = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Add learning data to a persona and generate AI summary (requires authentication and ownership)."""
    db_persona = await persona_crud.get_persona_by_id(db, persona_id, current_user.id)
    
    if not db_persona:
        raise HTTPException(status_code=404, detail=f"Persona {persona_id} not found")
    
    # Add the learning data to the persona's memory context
    current_context = db_persona.memory_context or ""
    new_context = f"{current_context}\n\n{learning_data.text}" if current_context else learning_data.text
    
    # Update the persona with new learning data
    updated_persona = await persona_crud.update_persona_learning(
        db=db,
        persona=db_persona,
        memory_context=new_context,
        interaction_count=db_persona.interaction_count + 1
    )
    
    return PersonaResponse(
        id=updated_persona.id,
        name=updated_persona.name,
        description=updated_persona.description,
        relation_type=updated_persona.relation_type,
        created_at=updated_persona.created_at.isoformat(),
        status=updated_persona.status,
        user_id=updated_persona.user_id,
        personality_traits=updated_persona.personality_traits,
        voice_settings=updated_persona.voice_settings,
        memory_enabled=updated_persona.memory_enabled,
        learning_enabled=updated_persona.learning_enabled,
        image_analysis_enabled=updated_persona.image_analysis_enabled,
        voice_synthesis_enabled=updated_persona.voice_synthesis_enabled,
        learned_preferences=updated_persona.learned_preferences,
        conversation_patterns=updated_persona.conversation_patterns,
        emotional_responses=updated_persona.emotional_responses,
        memory_context=updated_persona.memory_context,
        last_interaction=updated_persona.last_interaction.isoformat() if updated_persona.last_interaction else None,
        interaction_count=updated_persona.interaction_count
    )


@router.get("/{persona_id}/summary")
async def get_persona_summary(
    persona_id: int,
    current_user: DBUser = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get AI-generated summary of the persona (requires authentication and ownership)."""
    db_persona = await persona_crud.get_persona_by_id(db, persona_id, current_user.id)
    
    if not db_persona:
        raise HTTPException(status_code=404, detail=f"Persona {persona_id} not found")
    
    # Generate AI summary based on persona data
    summary = await persona_crud.generate_persona_summary(db, db_persona)
    
    return {
        "persona_id": persona_id,
        "summary": summary,
        "created_at": db_persona.created_at.isoformat(),
        "age_days": (datetime.utcnow() - db_persona.created_at).days,
        "interaction_count": db_persona.interaction_count
    } 