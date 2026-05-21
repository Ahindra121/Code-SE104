from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ReviewCreate(BaseModel):
    content_quality: int = Field(..., ge=1, le=5)
    video_quality: int = Field(..., ge=1, le=5)
    instructor_clarity: int = Field(..., ge=1, le=5)
    material_usefulness: int = Field(..., ge=1, le=5)
    assessment_quality: int = Field(..., ge=1, le=5)
    practical_value: int = Field(..., ge=1, le=5)
    overall_satisfaction: int = Field(..., ge=1, le=5)
    comment: str | None = None


class ReviewLegacyCreate(ReviewCreate):
    course_id: int


class ReviewEligibilityOut(BaseModel):
    eligible: bool
    reason: str
    already_reviewed: bool


class ReviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    student_id: int
    course_id: int
    rating: int
    content_quality: int
    video_quality: int
    instructor_clarity: int
    material_usefulness: int
    assessment_quality: int
    practical_value: int
    overall_satisfaction: int
    average_rating: float
    is_visible: bool
    comment: str | None
    created_at: datetime
    updated_at: datetime | None = None
    student_name: str | None = None


class ReviewPublicOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    student_id: int
    course_id: int
    average_rating: float
    comment: str | None
    created_at: datetime
    student_name: str | None = None


class ReviewVisibilityUpdate(BaseModel):
    is_visible: bool


class CourseReviewSummaryOut(BaseModel):
    course_id: int
    average_rating: float
    review_count: int
    criteria_average: dict[str, float]


class InstructorReviewSummaryOut(BaseModel):
    instructor_id: int
    average_rating: float
    review_count: int
    course_count_with_reviews: int
