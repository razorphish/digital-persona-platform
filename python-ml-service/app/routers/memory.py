"""
Memory Service router (placeholder)
"""
import logging
from fastapi import APIRouter, HTTPException, status

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/status")
async def get_memory_status():
    """Get memory service status."""
    return {
        "status": "not_implemented",
        "message": "Memory service is a placeholder - to be implemented",
        "features": ["vector_embeddings", "chroma_db", "semantic_search"]
    } 