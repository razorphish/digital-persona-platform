"""
Personality Learning router (placeholder)
"""
import logging
from fastapi import APIRouter, HTTPException, status

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/status")
async def get_learning_status():
    """Get personality learning service status."""
    return {
        "status": "not_implemented",
        "message": "Personality learning service is a placeholder - to be implemented",
        "features": ["conversation_analysis", "trait_extraction", "personality_adaptation"]
    } 