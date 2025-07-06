"""
Authentication router with JWT endpoints and database storage
"""
from datetime import timedelta
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import UserCreate
from app.models.user_db import User as DBUser
from app.schemas.auth import (
    Token, UserLogin, UserRegister, PasswordChange, 
    RefreshToken, PasswordReset
)
from app.services.auth_db import (
    authenticate_user, create_user, create_access_token, 
    create_refresh_token, verify_token, get_current_active_user,
    get_user_by_email, get_password_hash, verify_password
)
from app.database import get_db

router = APIRouter(prefix="/auth", tags=["authentication"])
security = HTTPBearer()


@router.post("/register", response_model=Token)
async def register(user_data: UserRegister, db: AsyncSession = Depends(get_db)):
    """Register a new user and return access token."""
    try:
        # Create user
        user_create = UserCreate(
            email=user_data.email,
            username=user_data.username,
            password=user_data.password,
            full_name=user_data.full_name
        )
        user = await create_user(db, user_create)
        
        # Create tokens
        access_token_expires = timedelta(minutes=30)
        access_token = create_access_token(
            data={"sub": user.username, "user_id": user.id},
            expires_delta=access_token_expires
        )
        refresh_token = create_refresh_token(
            data={"sub": user.username, "user_id": user.id}
        )
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            expires_in=30 * 60,  # 30 minutes in seconds
            refresh_token=refresh_token
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed"
        )


@router.post("/login", response_model=Token)
async def login(user_credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    """Login user and return access token."""
    user = await authenticate_user(db, user_credentials.email, user_credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    # Create tokens
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user.username, "user_id": user.id},
        expires_delta=access_token_expires
    )
    refresh_token = create_refresh_token(
        data={"sub": user.username, "user_id": user.id}
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        expires_in=30 * 60,  # 30 minutes in seconds
        refresh_token=refresh_token
    )


@router.post("/refresh", response_model=Token)
async def refresh_token(refresh_data: RefreshToken):
    """Refresh access token using refresh token."""
    try:
        # Verify refresh token
        token_data = verify_token(refresh_data.refresh_token)
        
        # Create new access token
        access_token_expires = timedelta(minutes=30)
        access_token = create_access_token(
            data={"sub": token_data.username, "user_id": token_data.user_id},
            expires_delta=access_token_expires
        )
        
        # Create new refresh token
        new_refresh_token = create_refresh_token(
            data={"sub": token_data.username, "user_id": token_data.user_id}
        )
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            expires_in=30 * 60,  # 30 minutes in seconds
            refresh_token=new_refresh_token
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )


@router.get("/me")
async def get_current_user_info(current_user: DBUser = Depends(get_current_active_user)):
    """Get current user information."""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "username": current_user.username,
        "full_name": current_user.full_name,
        "is_active": current_user.is_active,
        "created_at": current_user.created_at,
        "updated_at": current_user.updated_at
    }


@router.post("/change-password")
async def change_password(
    password_data: PasswordChange,
    current_user: DBUser = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Change user password."""
    # Verify current password
    if not verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Update password
    new_hashed_password = get_password_hash(password_data.new_password)
    current_user.hashed_password = new_hashed_password
    await db.commit()
    
    return {"message": "Password changed successfully"}


@router.post("/reset-password")
async def reset_password_request(reset_data: PasswordReset, db: AsyncSession = Depends(get_db)):
    """Request password reset (placeholder for email functionality)."""
    user = await get_user_by_email(db, reset_data.email)
    if not user:
        # Don't reveal if email exists or not
        return {"message": "If the email exists, a reset link has been sent"}
    
    # In a real application, you would:
    # 1. Generate a reset token
    # 2. Send email with reset link
    # 3. Store reset token with expiration
    
    return {"message": "If the email exists, a reset link has been sent"}


@router.post("/logout")
async def logout(current_user: DBUser = Depends(get_current_active_user)):
    """Logout user (client should discard tokens)."""
    # In a real application, you might want to:
    # 1. Add token to blacklist
    # 2. Track logout events
    
    return {"message": "Successfully logged out"}


@router.get("/verify")
async def verify_token_endpoint(current_user: DBUser = Depends(get_current_active_user)):
    """Verify if the current token is valid."""
    return {
        "valid": True,
        "user_id": current_user.id,
        "username": current_user.username,
        "email": current_user.email
    } 