from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ProgressUpdate(BaseModel):
    lesson_id: int
    watched_seconds: int = Field(default=0, ge=0)
    max_watched_seconds: int = Field(default=0, ge=0)
    duration_seconds: int = Field(default=0, ge=0)
    progress_percent: float = Field(default=0, ge=0, le=100)
    document_viewed: bool = False


class ProgressOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    student_id: int
    course_id: int
    lesson_id: int
    progress_percent: float
    watched_seconds: int
    max_watched_seconds: int
    duration_seconds: int
    document_viewed: bool
    is_completed: bool
    completed_at: datetime | None
    updated_at: datetime


class LessonProgressUpdate(BaseModel):
    watched_seconds: int = Field(default=0, ge=0)
    max_watched_seconds: int = Field(default=0, ge=0)
    duration_seconds: int = Field(default=0, ge=0)
    progress_percent: float = Field(default=0, ge=0, le=100)


class CourseProgressOut(BaseModel):
    course_id: int
    completed_lessons: int
    total_lessons: int
    percent: float
    completed_lesson_ids: list[int] = []
