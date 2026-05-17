from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.core.security import validate_password_strength, validate_username
from app.models.entities import UserRole


class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: str | None = None
    phone: str | None = None


class UserCreate(UserBase):
    password: str
    role: Literal["student", "instructor"] = "student"

    @field_validator("username")
    @classmethod
    def username_valid(cls, value: str) -> str:
        if not validate_username(value):
            raise ValueError("Username must be at least 6 chars and contain only letters, numbers, underscore")
        return value

    @field_validator("password")
    @classmethod
    def password_valid(cls, value: str) -> str:
        if not validate_password_strength(value):
            raise ValueError("Password must be at least 8 chars and include uppercase, lowercase and number")
        return value


class UserUpdate(BaseModel):
    email: EmailStr | None = None
    full_name: str | None = None
    phone: str | None = None
    password: str | None = None

    @field_validator("password")
    @classmethod
    def password_valid(cls, value: str | None) -> str | None:
        if value is not None and not validate_password_strength(value):
            raise ValueError("Password must be at least 8 chars and include uppercase, lowercase and number")
        return value


class UserStatusUpdate(BaseModel):
    is_active: bool


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    username: str
    full_name: str | None
    phone: str | None
    role: UserRole
    is_active: bool
    created_at: datetime
    updated_at: datetime


class LoginRequest(BaseModel):
    username: str = Field(..., description="Username or email")
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
