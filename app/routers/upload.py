"""
Persona media upload router with file validation and security
"""
import os
import uuid
import mimetypes
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, status, Body
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from app.models.user_db import User as DBUser
from app.models.media_db import MediaFile as DBMediaFile
from app.services.auth_db import get_current_active_user
from app.crud import media as media_crud, persona as persona_crud
from app.database import get_db
import aiofiles
from app.services.upload import save_uploaded_file
from app.utils.s3_util import get_file_download_url, delete_file_from_s3, get_file_upload_url

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


class RegisterFileRequest(BaseModel):
    file_id: str
    s3_key: str
    filename: str
    original_filename: str
    mime_type: str
    file_size: int
    media_type: str
    upload_method: Optional[str] = "presigned"
    description: Optional[str] = None


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


@router.post("/persona/{persona_id}/image", response_model=MediaFileResponse)
async def upload_persona_image(
    persona_id: int,
    file: UploadFile = File(...),
    description: Optional[str] = Form(None),
    current_user: DBUser = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Upload an image file for a specific persona (S3)."""
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
    # Save file to S3
    s3_result = await save_uploaded_file(
        file=file,
        media_type="image",
        persona_id=persona_id,
        user_id=current_user.id,
        description=description
    )
    # Create database record with S3 metadata
    db_media = await media_crud.create_media_file(
        db=db,
        file_id=s3_result["file_id"],
        filename=s3_result["s3_key"].split("/")[-1],
        original_filename=s3_result["original_filename"],
        file_path="",  # Not used for S3
        s3_key=s3_result["s3_key"],
        s3_bucket=s3_result.get("bucket", None),
        s3_url=s3_result["public_url"],
        file_size=s3_result["file_size"],
        mime_type=s3_result["mime_type"],
        media_type="image",
        upload_method=s3_result["upload_method"],
        is_s3_stored=True,
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
    """Upload a video file for a specific persona (S3)."""
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
    # Save file to S3
    s3_result = await save_uploaded_file(
        file=file,
        media_type="video",
        persona_id=persona_id,
        user_id=current_user.id,
        description=description
    )
    # Create database record with S3 metadata
    db_media = await media_crud.create_media_file(
        db=db,
        file_id=s3_result["file_id"],
        filename=s3_result["s3_key"].split("/")[-1],
        original_filename=s3_result["original_filename"],
        file_path="",  # Not used for S3
        s3_key=s3_result["s3_key"],
        s3_bucket=s3_result.get("bucket", None),
        s3_url=s3_result["public_url"],
        file_size=s3_result["file_size"],
        mime_type=s3_result["mime_type"],
        media_type="video",
        upload_method=s3_result["upload_method"],
        is_s3_stored=True,
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
    """Download a file from S3 (returns presigned URL)."""
    db_media = await media_crud.get_media_file_by_id(db, file_id, current_user.id)
    if not db_media or not db_media.s3_key:
        raise HTTPException(status_code=404, detail="File not found")
    url = await get_file_download_url(db_media.s3_key)
    return {"download_url": url}


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
    """Delete a file from S3 and the database."""
    db_media = await media_crud.get_media_file_by_id(db, file_id, current_user.id)
    if not db_media or not db_media.s3_key:
        raise HTTPException(status_code=404, detail="File not found")
    # Delete from S3
    await delete_file_from_s3(db_media.s3_key)
    # Delete from DB
    await media_crud.delete_media_file(db, file_id, current_user.id)
    return {"detail": "File deleted"}


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


@router.post("/persona/{persona_id}/presigned-upload")
async def get_presigned_upload_url(
    persona_id: int,
    filename: str = Body(...),
    mime_type: str = Body(...),
    current_user: DBUser = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Generate a presigned S3 upload URL for direct browser upload."""
    # Verify persona exists and belongs to user
    persona = await persona_crud.get_persona_by_id(db, persona_id, current_user.id)
    if not persona:
        raise HTTPException(
            status_code=404,
            detail=f"Persona {persona_id} not found"
        )
    # Validate file type
    file_ext = Path(filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed extensions: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    if mime_type not in ALLOWED_IMAGE_TYPES and mime_type not in ALLOWED_VIDEO_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid MIME type. Only JPEG, PNG, and MP4 allowed."
        )
    # Determine media type
    if mime_type in ALLOWED_IMAGE_TYPES:
        media_type = "images"
    else:
        media_type = "videos"
    import uuid
    file_id = str(uuid.uuid4())
    s3_key = f"uploads/{current_user.id}/{persona_id}/{media_type}/{file_id}_{filename}"
    url = await get_file_upload_url(s3_key, mime_type)
    return {
        "upload_url": url,
        "s3_key": s3_key,
        "file_id": file_id,
        "bucket": os.getenv("AWS_S3_BUCKET", "digital-persona-platform")
    }


@router.post("/persona/{persona_id}/register", response_model=MediaFileResponse)
async def register_uploaded_file(
    persona_id: int,
    req: RegisterFileRequest,
    current_user: DBUser = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Register file metadata after presigned S3 upload."""
    # Verify persona exists and belongs to user
    persona = await persona_crud.get_persona_by_id(db, persona_id, current_user.id)
    if not persona:
        raise HTTPException(
            status_code=404,
            detail=f"Persona {persona_id} not found"
        )
    # Validate file type
    file_ext = Path(req.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed extensions: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    if req.mime_type not in ALLOWED_IMAGE_TYPES and req.mime_type not in ALLOWED_VIDEO_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid MIME type. Only JPEG, PNG, and MP4 allowed."
        )
    # Determine media type
    if req.mime_type in ALLOWED_IMAGE_TYPES:
        media_type = "image"
    else:
        media_type = "video"
    # Persist metadata in DB
    db_media = await media_crud.create_media_file(
        db=db,
        file_id=req.file_id,
        filename=req.filename,
        original_filename=req.original_filename,
        file_path="",  # Not used for S3
        s3_key=req.s3_key,
        s3_bucket=os.getenv("AWS_S3_BUCKET", "digital-persona-platform"),
        s3_url=f"https://{os.getenv('AWS_S3_BUCKET', 'digital-persona-platform')}.s3.amazonaws.com/{req.s3_key}",
        file_size=req.file_size,
        mime_type=req.mime_type,
        media_type=media_type,
        upload_method=req.upload_method,
        is_s3_stored=True,
        persona_id=persona_id,
        user_id=current_user.id,
        description=req.description
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