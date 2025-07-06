"""
CRUD operations for MediaFile model
"""
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.media_db import MediaFile


async def get_media_file_by_id(db: AsyncSession, media_id: int, user_id: int) -> Optional[MediaFile]:
    """Get media file by ID for a specific user."""
    result = await db.execute(
        select(MediaFile).where(MediaFile.id == media_id, MediaFile.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def get_media_files_by_persona(db: AsyncSession, persona_id: int, user_id: int) -> List[MediaFile]:
    """Get all media files for a specific persona (user-scoped)."""
    result = await db.execute(
        select(MediaFile).where(
            MediaFile.persona_id == persona_id, 
            MediaFile.user_id == user_id
        )
    )
    return list(result.scalars().all())


async def get_media_files_by_user(db: AsyncSession, user_id: int) -> List[MediaFile]:
    """Get all media files for a specific user."""
    result = await db.execute(
        select(MediaFile).where(MediaFile.user_id == user_id)
    )
    return list(result.scalars().all())


async def create_media_file(
    db: AsyncSession,
    filename: str,
    original_filename: str,
    file_path: str,
    file_size: int,
    mime_type: str,
    media_type: str,
    persona_id: int,
    user_id: int,
    description: Optional[str] = None
) -> MediaFile:
    """Create a new media file record."""
    db_media = MediaFile(
        filename=filename,
        original_filename=original_filename,
        file_path=file_path,
        file_size=file_size,
        mime_type=mime_type,
        media_type=media_type,
        persona_id=persona_id,
        user_id=user_id,
        description=description
    )
    
    db.add(db_media)
    await db.commit()
    await db.refresh(db_media)
    return db_media


async def update_media_file(db: AsyncSession, media_file: MediaFile, **kwargs) -> MediaFile:
    """Update media file fields."""
    for field, value in kwargs.items():
        if hasattr(media_file, field):
            setattr(media_file, field, value)
    
    await db.commit()
    await db.refresh(media_file)
    return media_file


async def delete_media_file(db: AsyncSession, media_id: int, user_id: int) -> bool:
    """Delete a media file (user-scoped)."""
    media_file = await get_media_file_by_id(db, media_id, user_id)
    if media_file:
        await db.delete(media_file)
        await db.commit()
        return True
    return False


async def get_media_files_by_type(db: AsyncSession, user_id: int, media_type: str) -> List[MediaFile]:
    """Get media files by type (image/video) for a user."""
    result = await db.execute(
        select(MediaFile).where(
            MediaFile.user_id == user_id,
            MediaFile.media_type == media_type
        )
    )
    return list(result.scalars().all())


async def get_media_files_by_persona_and_type(db: AsyncSession, persona_id: int, user_id: int, media_type: str) -> List[MediaFile]:
    """Get media files by persona and type (image/video) for a user."""
    result = await db.execute(
        select(MediaFile).where(
            MediaFile.persona_id == persona_id,
            MediaFile.user_id == user_id,
            MediaFile.media_type == media_type
        )
    )
    return list(result.scalars().all()) 