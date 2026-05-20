from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.entities import InstructorQualificationStatus, InstructorVerificationStatus
from app.schemas.user import UserOut


class InstructorQualificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    verification_id: int
    major: str
    university_name: str
    graduation_year: int
    degree_url: str
    status: InstructorQualificationStatus
    admin_note: str | None
    reviewed_by_id: int | None
    reviewed_at: datetime | None
    created_at: datetime
    updated_at: datetime


class InstructorVerificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    full_name: str
    cccd_number: str
    cccd_front_url: str
    cccd_back_url: str
    degree_url: str
    major: str
    university_name: str
    graduation_year: int
    status: InstructorVerificationStatus
    admin_note: str | None
    reviewed_by_id: int | None
    reviewed_at: datetime | None
    pending_full_name: str | None = None
    pending_cccd_number: str | None = None
    pending_cccd_front_url: str | None = None
    pending_cccd_back_url: str | None = None
    has_pending_changes: bool = False
    created_at: datetime
    updated_at: datetime
    user: UserOut | None = None
    qualifications: list[InstructorQualificationOut] = Field(default_factory=list)


class InstructorVerificationReject(BaseModel):
    admin_note: str = Field(..., min_length=1, max_length=2000)
