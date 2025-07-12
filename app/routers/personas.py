"""
Protected personas router with authentication
"""
import time
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, field_validator
from app.models.user import UserInDB
from app.services.auth_db import get_current_active_user

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

# In-memory storage (in production, use a database)
personas_storage: List[PersonaResponse] = []
persona_counter = 1


@router.post("/", response_model=PersonaResponse)
async def create_persona(
    persona: PersonaCreate,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Create a new digital persona (requires authentication)."""
    global persona_counter
    
    new_persona = PersonaResponse(
        id=persona_counter,
        name=persona.name,
        description=persona.description,
        relation_type=persona.relation_type,
        created_at=time.strftime("%Y-%m-%d %H:%M:%S"),
        status="active",
        user_id=current_user.id
    )
    
    personas_storage.append(new_persona)
    persona_counter += 1
    
    return new_persona


@router.get("/", response_model=List[PersonaResponse])
async def list_personas(
    current_user: UserInDB = Depends(get_current_active_user)
):
    """List all personas for the current user (requires authentication)."""
    user_personas = [p for p in personas_storage if p.user_id == current_user.id]
    return user_personas


@router.get("/{persona_id}", response_model=PersonaResponse)
async def get_persona(
    persona_id: int,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Get specific persona (requires authentication and ownership)."""
    for persona in personas_storage:
        if persona.id == persona_id and persona.user_id == current_user.id:
            return persona
    
    raise HTTPException(status_code=404, detail=f"Persona {persona_id} not found")


@router.delete("/{persona_id}")
async def delete_persona(
    persona_id: int,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Delete a persona (requires authentication and ownership)."""
    global personas_storage
    
    original_count = len(personas_storage)
    personas_storage = [
        p for p in personas_storage 
        if not (p.id == persona_id and p.user_id == current_user.id)
    ]
    
    if len(personas_storage) == original_count:
        raise HTTPException(status_code=404, detail=f"Persona {persona_id} not found")
    
    return {"message": f"Persona {persona_id} deleted successfully"}


@router.put("/{persona_id}", response_model=PersonaResponse)
async def update_persona(
    persona_id: int,
    persona_update: PersonaCreate,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Update a persona (requires authentication and ownership)."""
    for i, persona in enumerate(personas_storage):
        if persona.id == persona_id and persona.user_id == current_user.id:
            updated_persona = PersonaResponse(
                id=persona.id,
                name=persona.name,
                description=persona.description,
                relation_type=persona_update.relation_type,
                created_at=persona.created_at,
                status=persona.status,
                user_id=persona.user_id
            )
            personas_storage[i] = updated_persona
            return updated_persona
    
    raise HTTPException(status_code=404, detail=f"Persona {persona_id} not found") 