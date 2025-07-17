"""
Media file upload and management router
"""
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from app.models.user_db import User as DBUser
from app.models.media_db import MediaFile as DBMediaFile
from app.services.auth_db import get_current_active_user
from app.services.upload import (
    save_uploaded_file, get_file_response, delete_file, 
    get_media_type_from_mime, get_file_info
)
from app.crud import media as media_crud, persona as persona_crud
from app.database import get_db

router = APIRouter(prefix="/media", tags=["media"])

# Pydantic models
class MediaFileResponse(BaseModel):
    id: int
    filename: str
    original_filename: str
    file_size: int
    mime_type: str
    media_type: str
    persona_id: int
    user_id: int
    description: Optional[str] = None
    created_at: str
    updated_at: str


@router.post("/upload/{persona_id}", response_model=MediaFileResponse)
async def upload_media_file(
    persona_id: int,
    file: UploadFile = File(...),
    description: Optional[str] = Form(None),
    current_user: DBUser = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Upload a media file (image or video) for a specific persona."""
    
    # Verify persona exists and belongs to user
    persona = await persona_crud.get_persona_by_id(db, persona_id, current_user.id)
    if not persona:
        raise HTTPException(
            status_code=404,
            detail=f"Persona {persona_id} not found"
        )
    
    # Determine media type from file
    mime_type = file.content_type or "application/octet-stream"
    media_type = get_media_type_from_mime(mime_type)
    
    # Save file to filesystem
    filename, file_path, file_size = await save_uploaded_file(
        file=file,
        media_type=media_type,
        persona_id=persona_id,
        user_id=current_user.id
    )
    
    # Create database record
    db_media = await media_crud.create_media_file(
        db=db,
        filename=filename,
        original_filename=file.filename or "unknown",
        file_path=file_path,
        file_size=file_size,
        mime_type=mime_type,
        media_type=media_type,
        persona_id=persona_id,
        user_id=current_user.id,
        description=description
    )
    
    return MediaFileResponse(
        id=db_media.id,
        filename=db_media.filename,
        original_filename=db_media.original_filename,
        file_size=db_media.file_size,
        mime_type=db_media.mime_type,
        media_type=db_media.media_type,
        persona_id=db_media.persona_id,
        user_id=db_media.user_id,
        description=db_media.description,
        created_at=db_media.created_at.isoformat(),
        updated_at=db_media.updated_at.isoformat()
    )


@router.get("/files", response_model=List[MediaFileResponse])
async def list_media_files(
    persona_id: Optional[int] = None,
    media_type: Optional[str] = None,
    current_user: DBUser = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """List media files for the current user, optionally filtered by persona or type."""
    
    if persona_id:
        # Verify persona exists and belongs to user
        persona = await persona_crud.get_persona_by_id(db, persona_id, current_user.id)
        if not persona:
            raise HTTPException(
                status_code=404,
                detail=f"Persona {persona_id} not found"
            )
        
        # Get files for specific persona
        db_media_files = await media_crud.get_media_files_by_persona(db, persona_id, current_user.id)
    elif media_type:
        # Validate media type
        if media_type not in ["image", "video"]:
            raise HTTPException(
                status_code=400,
                detail="media_type must be 'image' or 'video'"
            )
        
        # Get files by type
        db_media_files = await media_crud.get_media_files_by_type(db, current_user.id, media_type)
    else:
        # Get all files for user
        db_media_files = await media_crud.get_media_files_by_user(db, current_user.id)
    
    return [
        MediaFileResponse(
            id=media.id,
            filename=media.filename,
            original_filename=media.original_filename,
            file_size=media.file_size,
            mime_type=media.mime_type,
            media_type=media.media_type,
            persona_id=media.persona_id,
            user_id=media.user_id,
            description=media.description,
            created_at=media.created_at.isoformat(),
            updated_at=media.updated_at.isoformat()
        )
        for media in db_media_files
    ]


@router.get("/files/{media_id}", response_model=MediaFileResponse)
async def get_media_file(
    media_id: int,
    current_user: DBUser = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get specific media file information."""
    
    db_media = await media_crud.get_media_file_by_id(db, media_id, current_user.id)
    if not db_media:
        raise HTTPException(
            status_code=404,
            detail=f"Media file {media_id} not found"
        )
    
    return MediaFileResponse(
        id=db_media.id,
        filename=db_media.filename,
        original_filename=db_media.original_filename,
        file_size=db_media.file_size,
        mime_type=db_media.mime_type,
        media_type=db_media.media_type,
        persona_id=db_media.persona_id,
        user_id=db_media.user_id,
        description=db_media.description,
        created_at=db_media.created_at.isoformat(),
        updated_at=db_media.updated_at.isoformat()
    )


@router.get("/download/{media_id}")
async def download_media_file(
    media_id: int,
    current_user: DBUser = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Download a media file."""
    
    db_media = await media_crud.get_media_file_by_id(db, media_id, current_user.id)
    if not db_media:
        raise HTTPException(
            status_code=404,
            detail=f"Media file {media_id} not found"
        )
    
    # Check if file exists on filesystem
    file_info = get_file_info(db_media.file_path)
    if not file_info:
        raise HTTPException(
            status_code=404,
            detail="File not found on filesystem"
        )
    
    return await get_file_response(db_media.file_path, db_media.original_filename)


@router.put("/files/{media_id}", response_model=MediaFileResponse)
async def update_media_file(
    media_id: int,
    description: Optional[str] = Form(None),
    current_user: DBUser = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Update media file description."""
    
    db_media = await media_crud.get_media_file_by_id(db, media_id, current_user.id)
    if not db_media:
        raise HTTPException(
            status_code=404,
            detail=f"Media file {media_id} not found"
        )
    
    # Update description
    updated_media = await media_crud.update_media_file(
        db=db,
        media_file=db_media,
        description=description
    )
    
    return MediaFileResponse(
        id=updated_media.id,
        filename=updated_media.filename,
        original_filename=updated_media.original_filename,
        file_size=updated_media.file_size,
        mime_type=updated_media.mime_type,
        media_type=updated_media.media_type,
        persona_id=updated_media.persona_id,
        user_id=updated_media.user_id,
        description=updated_media.description,
        created_at=updated_media.created_at.isoformat(),
        updated_at=updated_media.updated_at.isoformat()
    )


@router.delete("/files/{media_id}")
async def delete_media_file(
    media_id: int,
    current_user: DBUser = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a media file (removes from database and filesystem)."""
    
    db_media = await media_crud.get_media_file_by_id(db, media_id, current_user.id)
    if not db_media:
        raise HTTPException(
            status_code=404,
            detail=f"Media file {media_id} not found"
        )
    
    # Delete from filesystem first
    file_deleted = await delete_file(db_media.file_path)
    
    # Delete from database
    success = await media_crud.delete_media_file(db, media_id, current_user.id)
    
    if not success:
        raise HTTPException(
            status_code=500,
            detail="Failed to delete media file from database"
        )
    
    return {
        "message": f"Media file {media_id} deleted successfully",
        "file_deleted": file_deleted
    }


@router.get("/stats")
async def get_media_stats(
    current_user: DBUser = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get media file statistics for the current user."""
    
    # Get all user's media files
    all_files = await media_crud.get_media_files_by_user(db, current_user.id)
    image_files = await media_crud.get_media_files_by_type(db, current_user.id, "image")
    video_files = await media_crud.get_media_files_by_type(db, current_user.id, "video")
    
    # Calculate totals
    total_files = len(all_files)
    total_images = len(image_files)
    total_videos = len(video_files)
    total_size = sum(f.file_size for f in all_files)
    
    # Group by persona
    persona_files = {}
    for file in all_files:
        if file.persona_id not in persona_files:
            persona_files[file.persona_id] = []
        persona_files[file.persona_id].append(file)
    
    return {
        "total_files": total_files,
        "total_images": total_images,
        "total_videos": total_videos,
        "total_size_bytes": total_size,
        "total_size_mb": round(total_size / (1024 * 1024), 2),
        "files_per_persona": {str(pid): len(files) for pid, files in persona_files.items()}
    } 