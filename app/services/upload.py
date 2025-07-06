"""
File upload service with validation and security
"""
import os
import uuid
import mimetypes
from pathlib import Path
from typing import Optional, Tuple
from fastapi import HTTPException, status, UploadFile
from fastapi.responses import FileResponse
import aiofiles


# File upload configuration
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10MB
MAX_VIDEO_SIZE = 100 * 1024 * 1024  # 100MB

# Allowed file types
ALLOWED_IMAGE_TYPES = {
    "image/jpeg", "image/jpg", "image/png", "image/gif", 
    "image/webp", "image/bmp", "image/tiff"
}

ALLOWED_VIDEO_TYPES = {
    "video/mp4", "video/avi", "video/mov", "video/wmv", 
    "video/flv", "video/webm", "video/mkv", "video/3gp"
}

# Upload directories
UPLOAD_BASE = Path("uploads")
IMAGE_UPLOAD_DIR = UPLOAD_BASE / "images"
VIDEO_UPLOAD_DIR = UPLOAD_BASE / "videos"


def ensure_upload_directories():
    """Ensure upload directories exist."""
    IMAGE_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    VIDEO_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def validate_file_size(file_size: int, media_type: str) -> None:
    """Validate file size based on media type."""
    if media_type == "image" and file_size > MAX_IMAGE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Image file too large. Maximum size is {MAX_IMAGE_SIZE // (1024*1024)}MB"
        )
    
    if media_type == "video" and file_size > MAX_VIDEO_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Video file too large. Maximum size is {MAX_VIDEO_SIZE // (1024*1024)}MB"
        )
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB"
        )


def validate_mime_type(mime_type: str, media_type: str) -> None:
    """Validate MIME type based on media type."""
    if media_type == "image" and mime_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid image type. Allowed types: {', '.join(ALLOWED_IMAGE_TYPES)}"
        )
    
    if media_type == "video" and mime_type not in ALLOWED_VIDEO_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid video type. Allowed types: {', '.join(ALLOWED_VIDEO_TYPES)}"
        )


def get_media_type_from_mime(mime_type: str) -> str:
    """Determine media type from MIME type."""
    if mime_type.startswith("image/"):
        return "image"
    elif mime_type.startswith("video/"):
        return "video"
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file type. Only images and videos are allowed."
        )


def generate_unique_filename(original_filename: str) -> str:
    """Generate a unique filename to prevent conflicts."""
    # Get file extension
    ext = Path(original_filename).suffix.lower()
    
    # Generate unique filename
    unique_id = str(uuid.uuid4())
    return f"{unique_id}{ext}"


async def save_uploaded_file(
    file: UploadFile, 
    media_type: str,
    persona_id: int,
    user_id: int
) -> Tuple[str, str, int]:
    """
    Save uploaded file and return file info.
    
    Returns:
        Tuple of (filename, file_path, file_size)
    """
    # Ensure upload directories exist
    ensure_upload_directories()
    
    # Validate file
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No filename provided"
        )
    
    # Get file size (read content to get size)
    content = await file.read()
    file_size = len(content)
    
    # Validate file size
    validate_file_size(file_size, media_type)
    
    # Validate MIME type
    mime_type = file.content_type or mimetypes.guess_type(file.filename)[0]
    if not mime_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not determine file type"
        )
    
    validate_mime_type(mime_type, media_type)
    
    # Generate unique filename
    filename = generate_unique_filename(file.filename)
    
    # Determine upload directory
    if media_type == "image":
        upload_dir = IMAGE_UPLOAD_DIR
    else:  # video
        upload_dir = VIDEO_UPLOAD_DIR
    
    # Create persona-specific subdirectory
    persona_dir = upload_dir / str(persona_id)
    persona_dir.mkdir(exist_ok=True)
    
    # Create user-specific subdirectory
    user_dir = persona_dir / str(user_id)
    user_dir.mkdir(exist_ok=True)
    
    # Save file
    file_path = user_dir / filename
    async with aiofiles.open(file_path, 'wb') as f:
        await f.write(content)
    
    return filename, str(file_path), file_size


async def get_file_response(file_path: str, filename: str) -> FileResponse:
    """Create a FileResponse for serving files."""
    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type=mimetypes.guess_type(filename)[0]
    )


async def delete_file(file_path: str) -> bool:
    """Delete a file from the filesystem."""
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            return True
        return False
    except Exception:
        return False


def get_file_info(file_path: str) -> Optional[dict]:
    """Get file information."""
    if not os.path.exists(file_path):
        return None
    
    stat = os.stat(file_path)
    return {
        "size": stat.st_size,
        "created": stat.st_ctime,
        "modified": stat.st_mtime
    } 