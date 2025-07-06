"""
Authentication schemas
"""
from pydantic import BaseModel, EmailStr
from typing import Optional


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    refresh_token: Optional[str] = None


class TokenData(BaseModel):
    username: Optional[str] = None
    user_id: Optional[int] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserRegister(BaseModel):
    email: EmailStr
    username: str
    password: str
    full_name: Optional[str] = None


class PasswordReset(BaseModel):
    email: EmailStr


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


class RefreshToken(BaseModel):
    refresh_token: str 