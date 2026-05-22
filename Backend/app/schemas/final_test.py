from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.entities import FinalTestQuestionType, FinalTestSubmissionStatus


class FinalTestQuestionBase(BaseModel):
    question_text: str = Field(..., min_length=1)
    question_type: FinalTestQuestionType
    options: dict[str, str] | None = None
    correct_answer: str | None = None
    max_score: float = Field(default=1, gt=0)
    order_index: int = Field(default=1, ge=1)

    @model_validator(mode="after")
    def validate_question(self):
        if self.question_type == FinalTestQuestionType.multiple_choice:
            if not self.options:
                raise ValueError("Multiple choice questions require options")
            if not self.correct_answer:
                raise ValueError("Multiple choice questions require a correct answer")
        return self


class FinalTestQuestionCreate(FinalTestQuestionBase):
    pass


class FinalTestQuestionUpdate(BaseModel):
    question_text: str | None = Field(default=None, min_length=1)
    question_type: FinalTestQuestionType | None = None
    options: dict[str, str] | None = None
    correct_answer: str | None = None
    max_score: float | None = Field(default=None, gt=0)
    order_index: int | None = Field(default=None, ge=1)

    @model_validator(mode="after")
    def validate_question(self):
        if self.question_type == FinalTestQuestionType.multiple_choice:
            if not self.options:
                raise ValueError("Multiple choice questions require options")
            if not self.correct_answer:
                raise ValueError("Multiple choice questions require a correct answer")
        return self


class FinalTestQuestionOut(FinalTestQuestionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    final_test_id: int
    created_at: datetime
    updated_at: datetime


class FinalTestQuestionForStudent(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    final_test_id: int
    question_text: str
    question_type: FinalTestQuestionType
    options: dict[str, str] | None
    max_score: float
    order_index: int


class FinalTestBase(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    is_active: bool = True


class FinalTestCreate(FinalTestBase):
    pass


class FinalTestUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    is_active: bool | None = None


class FinalTestOut(FinalTestBase):
    model_config = ConfigDict(from_attributes=True, extra="forbid")

    id: int
    course_id: int
    created_at: datetime
    updated_at: datetime
    questions: list[FinalTestQuestionOut] = []


class FinalTestForStudent(FinalTestBase):
    model_config = ConfigDict(from_attributes=True, extra="forbid")

    id: int
    course_id: int
    questions: list[FinalTestQuestionForStudent] = []


class FinalTestAnswerSubmit(BaseModel):
    question_id: int
    answer: Any


class FinalTestSubmit(BaseModel):
    answers: list[FinalTestAnswerSubmit] = Field(default_factory=list)


class FinalTestEligibilityOut(BaseModel):
    eligible: bool
    reason: str


class FinalTestSubmissionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    final_test_id: int
    course_id: int
    student_id: int
    attempt_number: int
    answers: list[Any]
    auto_score: float
    manual_score: float | None
    total_score: float | None
    max_score: float
    score_percent: float | None
    status: FinalTestSubmissionStatus
    instructor_feedback: str | None
    graded_by: int | None
    submitted_at: datetime
    graded_at: datetime | None


class InstructorSubmissionOut(FinalTestSubmissionOut):
    student_name: str | None = None
    student_email: str | None = None
    questions: list[FinalTestQuestionForStudent] = []


class FinalTestGrade(BaseModel):
    manual_score: float = Field(..., ge=0)
    instructor_feedback: str | None = None
