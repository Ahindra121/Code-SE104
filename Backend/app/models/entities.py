import enum
from datetime import datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class UserRole(str, enum.Enum):
    student = "student"
    instructor = "instructor"
    admin = "admin"


class ReactivationRequestStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class CourseDeletionRequestStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class CourseLevel(str, enum.Enum):
    basic = "basic"
    intermediate = "intermediate"
    advanced = "advanced"


class CourseStatus(str, enum.Enum):
    draft = "draft"
    pending = "pending"
    approved = "approved"
    rejected = "rejected"
    hidden = "hidden"
    archived = "archived"


class EnrollmentStatus(str, enum.Enum):
    active = "active"
    cancelled = "cancelled"
    completed = "completed"


class AnswerOption(str, enum.Enum):
    A = "A"
    B = "B"
    C = "C"
    D = "D"


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    username: Mapped[str] = mapped_column(String(80), unique=True, index=True, nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(255))
    phone: Mapped[str | None] = mapped_column(String(30))
    bio: Mapped[str | None] = mapped_column(Text)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole, name="user_role"), nullable=False, default=UserRole.student)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    admin_locked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    admin_locked_reason: Mapped[str | None] = mapped_column(Text)

    courses: Mapped[list["Course"]] = relationship(back_populates="instructor")
    enrollments: Mapped[list["Enrollment"]] = relationship(back_populates="student")
    progress_records: Mapped[list["LearningProgress"]] = relationship(back_populates="student")
    quiz_attempts: Mapped[list["QuizAttempt"]] = relationship(back_populates="student")
    certificates: Mapped[list["Certificate"]] = relationship(back_populates="student")
    reviews: Mapped[list["Review"]] = relationship(back_populates="student")
    reactivation_requests: Mapped[list["ReactivationRequest"]] = relationship(
        back_populates="user", foreign_keys="ReactivationRequest.user_id", cascade="all, delete-orphan"
    )


class ReactivationRequest(Base, TimestampMixin):
    __tablename__ = "reactivation_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[ReactivationRequestStatus] = mapped_column(
        Enum(ReactivationRequestStatus, name="reactivation_request_status"),
        nullable=False,
        default=ReactivationRequestStatus.pending,
    )
    admin_response: Mapped[str | None] = mapped_column(Text)
    reviewed_by_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    user: Mapped[User] = relationship(back_populates="reactivation_requests", foreign_keys=[user_id])
    reviewed_by: Mapped[User | None] = relationship(foreign_keys=[reviewed_by_id])


class Course(Base, TimestampMixin):
    __tablename__ = "courses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    category: Mapped[str] = mapped_column(String(120), index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    thumbnail_url: Mapped[str | None] = mapped_column(String(600))
    level: Mapped[CourseLevel] = mapped_column(Enum(CourseLevel, name="course_level"), nullable=False)
    status: Mapped[CourseStatus] = mapped_column(
        Enum(CourseStatus, name="course_status"), nullable=False, default=CourseStatus.draft
    )
    instructor_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    rejection_reason: Mapped[str | None] = mapped_column(Text)

    instructor: Mapped[User] = relationship(back_populates="courses")
    lessons: Mapped[list["Lesson"]] = relationship(back_populates="course", cascade="all, delete-orphan")
    enrollments: Mapped[list["Enrollment"]] = relationship(back_populates="course")
    progress_records: Mapped[list["LearningProgress"]] = relationship(back_populates="course")
    quiz_attempts: Mapped[list["QuizAttempt"]] = relationship(back_populates="course")
    certificates: Mapped[list["Certificate"]] = relationship(back_populates="course")
    reviews: Mapped[list["Review"]] = relationship(back_populates="course")
    deletion_requests: Mapped[list["CourseDeletionRequest"]] = relationship(
        back_populates="course", cascade="all, delete-orphan"
    )


class CourseDeletionRequest(Base, TimestampMixin):
    __tablename__ = "course_deletion_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    instructor_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    student_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    status: Mapped[CourseDeletionRequestStatus] = mapped_column(
        Enum(CourseDeletionRequestStatus, name="course_deletion_request_status"),
        nullable=False,
        default=CourseDeletionRequestStatus.pending,
    )
    admin_response: Mapped[str | None] = mapped_column(Text)
    reviewed_by_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    course: Mapped[Course] = relationship(back_populates="deletion_requests")
    instructor: Mapped[User] = relationship(foreign_keys=[instructor_id])
    reviewed_by: Mapped[User | None] = relationship(foreign_keys=[reviewed_by_id])


class Lesson(Base, TimestampMixin):
    __tablename__ = "lessons"
    __table_args__ = (UniqueConstraint("course_id", "order_index", name="uq_lesson_course_order"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    video_url: Mapped[str | None] = mapped_column(String(600))
    document_url: Mapped[str | None] = mapped_column(String(600))
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    duration_seconds: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_visible: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    course: Mapped[Course] = relationship(back_populates="lessons")
    progress_records: Mapped[list["LearningProgress"]] = relationship(back_populates="lesson")
    questions: Mapped[list["Question"]] = relationship(back_populates="lesson", cascade="all, delete-orphan")
    quiz_attempts: Mapped[list["QuizAttempt"]] = relationship(back_populates="lesson")


class Enrollment(Base):
    __tablename__ = "enrollments"
    __table_args__ = (UniqueConstraint("student_id", "course_id", name="uq_enrollment_student_course"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    status: Mapped[EnrollmentStatus] = mapped_column(
        Enum(EnrollmentStatus, name="enrollment_status"), nullable=False, default=EnrollmentStatus.active
    )
    enrolled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    student: Mapped[User] = relationship(back_populates="enrollments")
    course: Mapped[Course] = relationship(back_populates="enrollments")


class LearningProgress(Base):
    __tablename__ = "learning_progress"
    __table_args__ = (UniqueConstraint("student_id", "lesson_id", name="uq_progress_student_lesson"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False)
    watched_seconds: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    document_viewed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    student: Mapped[User] = relationship(back_populates="progress_records")
    course: Mapped[Course] = relationship(back_populates="progress_records")
    lesson: Mapped[Lesson] = relationship(back_populates="progress_records")


class Question(Base, TimestampMixin):
    __tablename__ = "questions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    option_a: Mapped[str] = mapped_column(String(500), nullable=False)
    option_b: Mapped[str] = mapped_column(String(500), nullable=False)
    option_c: Mapped[str] = mapped_column(String(500), nullable=False)
    option_d: Mapped[str] = mapped_column(String(500), nullable=False)
    correct_option: Mapped[AnswerOption] = mapped_column(Enum(AnswerOption, name="answer_option"), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    lesson: Mapped[Lesson] = relationship(back_populates="questions")
    answers: Mapped[list["QuizAnswer"]] = relationship(back_populates="question")


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False)
    score: Mapped[float] = mapped_column(Float, nullable=False)
    total_questions: Mapped[int] = mapped_column(Integer, nullable=False)
    correct_count: Mapped[int] = mapped_column(Integer, nullable=False)
    passed: Mapped[bool] = mapped_column(Boolean, nullable=False)
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    student: Mapped[User] = relationship(back_populates="quiz_attempts")
    course: Mapped[Course] = relationship(back_populates="quiz_attempts")
    lesson: Mapped[Lesson] = relationship(back_populates="quiz_attempts")
    answers: Mapped[list["QuizAnswer"]] = relationship(back_populates="attempt", cascade="all, delete-orphan")


class QuizAnswer(Base):
    __tablename__ = "quiz_answers"
    __table_args__ = (UniqueConstraint("attempt_id", "question_id", name="uq_answer_attempt_question"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    attempt_id: Mapped[int] = mapped_column(ForeignKey("quiz_attempts.id", ondelete="CASCADE"), nullable=False)
    question_id: Mapped[int] = mapped_column(ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    selected_option: Mapped[AnswerOption] = mapped_column(Enum(AnswerOption, name="answer_option"), nullable=False)
    is_correct: Mapped[bool] = mapped_column(Boolean, nullable=False)

    attempt: Mapped[QuizAttempt] = relationship(back_populates="answers")
    question: Mapped[Question] = relationship(back_populates="answers")


class Certificate(Base):
    __tablename__ = "certificates"
    __table_args__ = (UniqueConstraint("student_id", "course_id", name="uq_certificate_student_course"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    certificate_code: Mapped[str] = mapped_column(String(80), unique=True, index=True, nullable=False)
    student_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    issued_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    student: Mapped[User] = relationship(back_populates="certificates")
    course: Mapped[Course] = relationship(back_populates="certificates")


class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = (
        UniqueConstraint("student_id", "course_id", name="uq_review_student_course"),
        CheckConstraint("rating >= 1 AND rating <= 5", name="ck_review_rating_range"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    comment: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    student: Mapped[User] = relationship(back_populates="reviews")
    course: Mapped[Course] = relationship(back_populates="reviews")
