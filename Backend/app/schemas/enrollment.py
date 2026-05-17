from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.entities import EnrollmentStatus
from app.schemas.course import CourseOut


class EnrollmentCreate(BaseModel):
    course_id: int


class EnrollmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    student_id: int
    course_id: int
    status: EnrollmentStatus
    enrolled_at: datetime
    course: CourseOut | None = None
