from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class LessonBase(BaseModel):
    title: str = Field(..., min_length=2)
    video_url: str | None = None
    document_url: str | None = None
    order_index: int = Field(default=1, ge=1)
    duration_seconds: int = Field(default=0, ge=0)
    is_visible: bool = True


class LessonCreate(LessonBase):
    course_id: int


class LessonUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2)
    video_url: str | None = None
    document_url: str | None = None
    order_index: int | None = Field(default=None, ge=1)
    duration_seconds: int | None = Field(default=None, ge=0)
    is_visible: bool | None = None


class LessonReorderItem(BaseModel):
    id: int
    order_index: int = Field(..., ge=1)


class LessonReorder(BaseModel):
    items: list[LessonReorderItem] = Field(..., min_length=1)


class LessonOut(LessonBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    course_id: int
    is_deleted: bool
    deleted_at: datetime | None
    created_at: datetime
    updated_at: datetime
