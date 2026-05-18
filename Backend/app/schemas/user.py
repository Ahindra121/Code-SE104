from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.core.security import validate_password_strength, validate_username
from app.models.entities import ReactivationRequestStatus, UserRole


class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: str | None = None
    phone: str | None = None
    bio: str | None = None


class UserCreate(UserBase):
    password: str
    role: Literal["student", "instructor"] = "student"

    @field_validator("username")
    @classmethod
    def username_valid(cls, value: str) -> str:
        if not validate_username(value):
            raise ValueError("Tên tài khoản phải có ít nhất 6 ký tự và chỉ gồm chữ cái, số hoặc dấu gạch dưới")
        return value

    @field_validator("password")
    @classmethod
    def password_valid(cls, value: str) -> str:
        if not validate_password_strength(value):
            raise ValueError("Mật khẩu phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường và số")
        return value


class UserUpdate(BaseModel):
    email: EmailStr | None = None
    full_name: str | None = None
    phone: str | None = None
    bio: str | None = None
    current_password: str | None = None
    password: str | None = None

    @field_validator("password")
    @classmethod
    def password_valid(cls, value: str | None) -> str | None:
        if value is not None and not validate_password_strength(value):
            raise ValueError("Mật khẩu phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường và số")
        return value


class UserStatusUpdate(BaseModel):
    is_active: bool
    reason: str | None = None


class ReactivationRequestCreate(BaseModel):
    username: str = Field(..., description="Username or email")
    password: str
    reason: str = Field(..., min_length=10, max_length=2000)


class ReactivationReview(BaseModel):
    response: str | None = Field(default=None, max_length=2000)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    username: str
    full_name: str | None
    phone: str | None
    bio: str | None
    role: UserRole
    is_active: bool
    deleted_at: datetime | None
    admin_locked_at: datetime | None
    admin_locked_reason: str | None
    created_at: datetime
    updated_at: datetime


class LoginRequest(BaseModel):
    username: str = Field(..., description="Username or email")
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class ReactivationRequestOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    reason: str
    status: ReactivationRequestStatus
    admin_response: str | None
    reviewed_by_id: int | None
    reviewed_at: datetime | None
    created_at: datetime
    updated_at: datetime
    user: UserOut
