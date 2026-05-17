from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.entities import CourseLevel, CourseStatus
from app.schemas.user import UserOut


class CourseBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    category: str
    description: str | None = None
    price: float = Field(default=0, ge=0)
    thumbnail_url: str | None = None
    level: CourseLevel


class CourseCreate(CourseBase):
    status: CourseStatus = CourseStatus.draft


class CourseUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=255)
    category: str | None = None
    description: str | None = None
    price: float | None = Field(default=None, ge=0)
    thumbnail_url: str | None = None
    level: CourseLevel | None = None
    status: CourseStatus | None = None


class CourseModeration(BaseModel):
    status: CourseStatus
    rejection_reason: str | None = None


class CourseOut(CourseBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: CourseStatus
    instructor_id: int
    is_deleted: bool
    rejection_reason: str | None
    created_at: datetime
    updated_at: datetime
    instructor: UserOut | None = None
    rating: float = 0
    reviews_count: int = 0
    students_count: int = 0
    lessons_count: int = 0


class CourseListOut(BaseModel):
    items: list[CourseOut]
    total: int
    page: int
    page_size: int
