from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ProgressUpdate(BaseModel):
    lesson_id: int
    watched_seconds: int = Field(default=0, ge=0)
    document_viewed: bool = False


class ProgressOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    student_id: int
    course_id: int
    lesson_id: int
    watched_seconds: int
    document_viewed: bool
    is_completed: bool
    completed_at: datetime | None


class CourseProgressOut(BaseModel):
    course_id: int
    completed_lessons: int
    total_lessons: int
    percent: float
    completed_lesson_ids: list[int] = []
