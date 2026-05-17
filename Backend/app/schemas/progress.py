from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ProgressUpdate(BaseModel):
    lesson_id: int
    watched_seconds: int = Field(..., ge=0)


class ProgressOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    student_id: int
    course_id: int
    lesson_id: int
    watched_seconds: int
    is_completed: bool
    completed_at: datetime | None


class CourseProgressOut(BaseModel):
    course_id: int
    completed_lessons: int
    total_lessons: int
    percent: float
