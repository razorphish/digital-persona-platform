"""
Persona media upload router with file validation and security
"""
import os
import uuid
import mimetypes
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from app.models.user_db import User as DBUser
from app.models.media_db import MediaFile as DBMediaFile
from app.services.auth_db import get_current_active_user
from app.crud import media as media_crud, persona as persona_crud
from app.database import get_db
import aiofiles

router = APIRouter(prefix="/upload", tags=["upload"])

# File upload configuration
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB as requested

# Allowed file types (only JPEG, PNG, MP4 as requested)
ALLOWED_IMAGE_TYPES = {
    "image/jpeg", "image/jpg", "image/png"
}

ALLOWED_VIDEO_TYPES = {
    "video/mp4"
}

ALLOWED_EXTENSIONS = {
    ".jpg", ".jpeg", ".png", ".mp4"
}

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


def ensure_upload_directories(user_id: int, persona_id: int) -> Path:
    """Ensure upload directories exist with user/persona structure."""
    upload_base = Path("uploads")
    user_dir = upload_base / str(user_id)
    persona_dir = user_dir / str(persona_id)
    persona_dir.mkdir(parents=True, exist_ok=True)
    return persona_dir


def validate_file_size(file_size: int) -> None:
    """Validate file size (10MB limit)."""
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB"
        )


def validate_file_type(filename: str, mime_type: str) -> str:
    """Validate file type and return media type."""
    # Check file extension
    file_ext = Path(filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed extensions: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Check MIME type
    if mime_type in ALLOWED_IMAGE_TYPES:
        return "image"
    elif mime_type in ALLOWED_VIDEO_TYPES:
        return "video"
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed types: JPEG, PNG images and MP4 videos"
        )


def generate_unique_filename(original_filename: str) -> str:
    """Generate a unique filename to prevent conflicts."""
    ext = Path(original_filename).suffix.lower()
    unique_id = str(uuid.uuid4())
    return f"{unique_id}{ext}"


async def save_uploaded_file(
    file: UploadFile,
    persona_dir: Path
) -> tuple[str, str, int]:
    """
    Save uploaded file and return file info.
    
    Returns:
        Tuple of (filename, file_path, file_size)
    """
    # Validate file
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No filename provided"
        )
    
    # Read file content to get size
    content = await file.read()
    file_size = len(content)
    
    # Validate file size
    validate_file_size(file_size)
    
    # Validate file type
    mime_type = file.content_type or (mimetypes.guess_type(file.filename or "")[0] or "")
    if not mime_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not determine file type"
        )
    
    media_type = validate_file_type(file.filename, mime_type)
    
    # Generate unique filename
    filename = generate_unique_filename(file.filename)
    
    # Save file
    file_path = persona_dir / filename
    async with aiofiles.open(file_path, 'wb') as f:
        await f.write(content)
    
    return filename, str(file_path), file_size


@router.post("/persona/{persona_id}/image", response_model=MediaFileResponse)
async def upload_persona_image(
    persona_id: int,
    file: UploadFile = File(...),
    description: Optional[str] = Form(None),
    current_user: DBUser = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Upload an image file for a specific persona."""
    
    # Verify persona exists and belongs to user
    persona = await persona_crud.get_persona_by_id(db, persona_id, current_user.id)
    if not persona:
        raise HTTPException(
            status_code=404,
            detail=f"Persona {persona_id} not found"
        )
    
    # Validate file is an image
    mime_type = file.content_type or (mimetypes.guess_type(file.filename or "")[0] or "")
    if not mime_type or mime_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPEG and PNG images are allowed"
        )
    
    # Ensure upload directory exists
    persona_dir = ensure_upload_directories(current_user.id, persona_id)
    
    # Save file
    filename, file_path, file_size = await save_uploaded_file(file, persona_dir)
    
    # Create database record
    db_media = await media_crud.create_media_file(
        db=db,
        filename=filename,
        original_filename=file.filename or "unknown",
        file_path=file_path,
        file_size=file_size,
        mime_type=mime_type,
        media_type="image",
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


@router.post("/persona/{persona_id}/video", response_model=MediaFileResponse)
async def upload_persona_video(
    persona_id: int,
    file: UploadFile = File(...),
    description: Optional[str] = Form(None),
    current_user: DBUser = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Upload a video file for a specific persona."""
    
    # Verify persona exists and belongs to user
    persona = await persona_crud.get_persona_by_id(db, persona_id, current_user.id)
    if not persona:
        raise HTTPException(
            status_code=404,
            detail=f"Persona {persona_id} not found"
        )
    
    # Validate file is a video
    mime_type = file.content_type or (mimetypes.guess_type(file.filename or "")[0] or "")
    if not mime_type or mime_type not in ALLOWED_VIDEO_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only MP4 videos are allowed"
        )
    
    # Ensure upload directory exists
    persona_dir = ensure_upload_directories(current_user.id, persona_id)
    
    # Save file
    filename, file_path, file_size = await save_uploaded_file(file, persona_dir)
    
    # Create database record
    db_media = await media_crud.create_media_file(
        db=db,
        filename=filename,
        original_filename=file.filename or "unknown",
        file_path=file_path,
        file_size=file_size,
        mime_type=mime_type,
        media_type="video",
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


@router.get("/persona/{persona_id}/files", response_model=List[MediaFileResponse])
async def list_persona_files(
    persona_id: int,
    media_type: Optional[str] = None,
    current_user: DBUser = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """List all media files for a specific persona."""
    
    # Verify persona exists and belongs to user
    persona = await persona_crud.get_persona_by_id(db, persona_id, current_user.id)
    if not persona:
        raise HTTPException(
            status_code=404,
            detail=f"Persona {persona_id} not found"
        )
    
    # Get files for persona
    if media_type:
        if media_type not in ["image", "video"]:
            raise HTTPException(
                status_code=400,
                detail="media_type must be 'image' or 'video'"
            )
        db_media_files = await media_crud.get_media_files_by_persona_and_type(
            db, persona_id, current_user.id, media_type
        )
    else:
        db_media_files = await media_crud.get_media_files_by_persona(db, persona_id, current_user.id)
    
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


@router.get("/files/{file_id}", response_model=MediaFileResponse)
async def get_file_info(
    file_id: int,
    current_user: DBUser = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get information about a specific media file."""
    
    db_media = await media_crud.get_media_file_by_id(db, file_id, current_user.id)
    if not db_media:
        raise HTTPException(
            status_code=404,
            detail=f"Media file {file_id} not found"
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


@router.get("/files/{file_id}/download")
async def download_file(
    file_id: int,
    current_user: DBUser = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Download a media file."""
    
    db_media = await media_crud.get_media_file_by_id(db, file_id, current_user.id)
    if not db_media:
        raise HTTPException(
            status_code=404,
            detail=f"Media file {file_id} not found"
        )
    
    # Check if file exists on filesystem
    if not os.path.exists(db_media.file_path):
        raise HTTPException(
            status_code=404,
            detail="File not found on filesystem"
        )
    
    return FileResponse(
        path=db_media.file_path,
        filename=db_media.original_filename,
        media_type=db_media.mime_type
    )


@router.put("/files/{file_id}", response_model=MediaFileResponse)
async def update_file_description(
    file_id: int,
    description: Optional[str] = Form(None),
    current_user: DBUser = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Update the description of a media file."""
    
    db_media = await media_crud.get_media_file_by_id(db, file_id, current_user.id)
    if not db_media:
        raise HTTPException(
            status_code=404,
            detail=f"Media file {file_id} not found"
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


@router.delete("/files/{file_id}")
async def delete_file(
    file_id: int,
    current_user: DBUser = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a media file."""
    
    db_media = await media_crud.get_media_file_by_id(db, file_id, current_user.id)
    if not db_media:
        raise HTTPException(
            status_code=404,
            detail=f"Media file {file_id} not found"
        )
    
    # Delete file from filesystem
    if os.path.exists(db_media.file_path):
        try:
            os.remove(db_media.file_path)
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to delete file from filesystem: {str(e)}"
            )
    
    # Delete database record
    success = await media_crud.delete_media_file(db, file_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=500,
            detail="Failed to delete file record from database"
        )
    
    return {"message": f"Media file {file_id} deleted successfully"}


@router.get("/stats")
async def get_upload_stats(
    current_user: DBUser = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get upload statistics for the current user."""
    
    # Get all user's media files
    media_files = await media_crud.get_media_files_by_user(db, current_user.id)
    
    # Calculate statistics
    total_files = len(media_files)
    total_size = sum(f.file_size for f in media_files)
    image_count = len([f for f in media_files if f.media_type == "image"])
    video_count = len([f for f in media_files if f.media_type == "video"])
    
    # Group by persona
    persona_stats = {}
    for file in media_files:
        if file.persona_id not in persona_stats:
            persona_stats[file.persona_id] = {"images": 0, "videos": 0, "total_size": 0}
        
        persona_stats[file.persona_id]["total_size"] += file.file_size
        if file.media_type == "image":
            persona_stats[file.persona_id]["images"] += 1
        else:
            persona_stats[file.persona_id]["videos"] += 1
    
    return {
        "total_files": total_files,
        "total_size_bytes": total_size,
        "total_size_mb": round(total_size / (1024 * 1024), 2),
        "image_count": image_count,
        "video_count": video_count,
        "persona_stats": persona_stats,
        "file_size_limit_mb": MAX_FILE_SIZE // (1024 * 1024)
    } 