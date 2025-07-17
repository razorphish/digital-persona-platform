"""
Voice Synthesis router (placeholder)
"""
import logging
from fastapi import APIRouter, HTTPException, status

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/status")
async def get_voice_status():
    """Get voice synthesis service status."""
    return {
        "status": "not_implemented",
        "message": "Voice synthesis service is a placeholder - to be implemented"
    }


@router.get("/engines")
async def get_voice_engines():
    """Get available voice synthesis engines."""
    return {
        "available_engines": ["edge", "gtts"],
        "default_engine": "edge",
        "status": "not_implemented"
    } 