"""
Protected personas router with authentication and database storage
"""
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, validator
from app.models.user_db import User as DBUser
from app.services.auth_db import get_current_active_user
from app.crud import persona as persona_crud
from app.database import get_db

router = APIRouter(prefix="/personas", tags=["personas"])

# Pydantic models (V1 syntax)
class PersonaCreate(BaseModel):
    name: str
    description: Optional[str] = None
    relation_type: str
    
    @validator('name')
    def validate_name(cls, v):
        if not v or not v.strip():
            raise ValueError('Name cannot be empty')
        return v.strip()
    
    @validator('relation_type')
    def validate_relation_type(cls, v):
        valid = ['parent', 'spouse', 'child', 'sibling', 'friend', 'colleague', 'other']
        if v.lower() not in valid:
            raise ValueError(f'Relation type must be one of: {", ".join(valid)}')
        return v.lower()

class PersonaResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    relation_type: str
    created_at: str
    status: str = "active"
    user_id: int


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
        user_id=db_persona.user_id
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
            user_id=persona.user_id
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
        user_id=db_persona.user_id
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
        user_id=updated_persona.user_id
    ) 