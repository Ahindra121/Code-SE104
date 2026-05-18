from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.entities import AnswerOption


class QuestionBase(BaseModel):
    lesson_id: int
    content: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_option: AnswerOption


class QuestionCreate(QuestionBase):
    pass


class QuestionUpdate(BaseModel):
    content: str | None = None
    option_a: str | None = None
    option_b: str | None = None
    option_c: str | None = None
    option_d: str | None = None
    correct_option: AnswerOption | None = None
    is_active: bool | None = None


class QuestionOut(QuestionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_active: bool
    deleted_at: datetime | None
    created_at: datetime
    updated_at: datetime


class QuestionForStudent(BaseModel):
    id: int
    lesson_id: int
    content: str
    options: dict[str, str]


class QuizAnswerSubmit(BaseModel):
    question_id: int
    selected_option: AnswerOption


class QuizSubmit(BaseModel):
    lesson_id: int
    answers: list[QuizAnswerSubmit] = Field(default_factory=list)


class QuizAnswerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    question_id: int
    selected_option: AnswerOption
    is_correct: bool


class QuizAttemptOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    student_id: int
    course_id: int
    lesson_id: int
    score: float
    total_questions: int
    correct_count: int
    passed: bool
    submitted_at: datetime
    answers: list[QuizAnswerOut] = []
