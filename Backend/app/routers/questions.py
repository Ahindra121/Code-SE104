from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user, require_roles
from app.models.entities import Enrollment, EnrollmentStatus, Lesson, Question, User, UserRole
from app.schemas.common import ok
from app.schemas.quiz import QuestionCreate, QuestionForStudent, QuestionOut, QuestionUpdate
from app.services.course_service import assert_course_owner

router = APIRouter(prefix="/questions", tags=["Questions"])
CONTENT_RESTORE_DAYS = 30


def _now() -> datetime:
    return datetime.now(UTC)


def _can_restore(deleted_at: datetime | None) -> bool:
    if deleted_at is None:
        return True
    if deleted_at.tzinfo is None:
        deleted_at = deleted_at.replace(tzinfo=UTC)
    return deleted_at >= _now() - timedelta(days=CONTENT_RESTORE_DAYS)


@router.get("/lesson/{lesson_id}")
def list_questions(
    lesson_id: int,
    include_inactive: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lesson = db.get(Lesson, lesson_id)
    if not lesson or (lesson.is_deleted and current_user.role not in [UserRole.instructor, UserRole.admin]):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")
    if current_user.role == UserRole.instructor and lesson.course.instructor_id == current_user.id:
        filters = [Question.lesson_id == lesson_id]
        if not include_inactive:
            filters.append(Question.is_active.is_(True))
        questions = db.scalars(select(Question).where(*filters)).all()
        return ok([QuestionOut.model_validate(question) for question in questions])
    if current_user.role == UserRole.admin:
        questions = db.scalars(select(Question).where(Question.lesson_id == lesson_id, Question.is_active.is_(True))).all()
        return ok([QuestionOut.model_validate(question) for question in questions])
    questions = db.scalars(select(Question).where(Question.lesson_id == lesson_id, Question.is_active.is_(True))).all()
    enrolled = db.scalar(
        select(Enrollment).where(
            Enrollment.student_id == current_user.id,
            Enrollment.course_id == lesson.course_id,
            Enrollment.status == EnrollmentStatus.active,
        )
    )
    if not enrolled:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Enrollment required")
    return ok([
        QuestionForStudent(
            id=q.id,
            lesson_id=q.lesson_id,
            content=q.content,
            options={"A": q.option_a, "B": q.option_b, "C": q.option_c, "D": q.option_d},
        )
        for q in questions
    ])


@router.post("")
def create_question(payload: QuestionCreate, db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.instructor))):
    lesson = db.get(Lesson, payload.lesson_id)
    if not lesson or lesson.is_deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")
    assert_course_owner(lesson.course, current_user)
    question = Question(**payload.model_dump())
    db.add(question)
    db.commit()
    db.refresh(question)
    return ok(QuestionOut.model_validate(question), "Question created")


@router.patch("/{question_id}")
def update_question(
    question_id: int,
    payload: QuestionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.instructor)),
):
    question = db.get(Question, question_id)
    if not question:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")
    assert_course_owner(question.lesson.course, current_user)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(question, field, value)
    db.commit()
    db.refresh(question)
    return ok(QuestionOut.model_validate(question), "Question updated")


@router.delete("/{question_id}")
def deactivate_question(question_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.instructor))):
    question = db.get(Question, question_id)
    if not question:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")
    assert_course_owner(question.lesson.course, current_user)
    question.is_active = False
    question.deleted_at = _now()
    db.commit()
    return ok(None, "Đã ẩn câu hỏi")


@router.patch("/{question_id}/restore")
def restore_question(question_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.instructor))):
    question = db.get(Question, question_id)
    if not question:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy câu hỏi")
    assert_course_owner(question.lesson.course, current_user)
    if question.is_active:
        return ok(QuestionOut.model_validate(question), "Câu hỏi đang hoạt động")
    if not _can_restore(question.deleted_at):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Câu hỏi đã quá thời hạn khôi phục")
    question.is_active = True
    question.deleted_at = None
    db.commit()
    db.refresh(question)
    return ok(QuestionOut.model_validate(question), "Đã khôi phục câu hỏi")
