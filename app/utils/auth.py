"""
Authentication utilities and middleware
"""
from typing import Optional
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user_db import User as DBUser
from app.services.auth_db import verify_token, get_user_by_id
from app.database import get_db

# Security scheme
security = HTTPBearer()


async def get_current_user_from_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> DBUser:
    """Get the current authenticated user from token."""
    token = credentials.credentials
    token_data = verify_token(token)
    
    if token_data.user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = await get_user_by_id(db, token_data.user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user


async def get_current_active_user_from_token(
    current_user: DBUser = Depends(get_current_user_from_token)
) -> DBUser:
    """Get the current active user from token."""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user


def require_authentication():
    """Decorator to require authentication for endpoints."""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # This is a placeholder - the actual authentication is handled
            # by the Depends(get_current_active_user) in the router
            return await func(*args, **kwargs)
        return wrapper
    return decorator 