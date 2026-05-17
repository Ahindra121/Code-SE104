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


@router.get("/lesson/{lesson_id}")
def list_questions(lesson_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    lesson = db.get(Lesson, lesson_id)
    if not lesson or lesson.is_deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")
    questions = db.scalars(select(Question).where(Question.lesson_id == lesson_id, Question.is_active.is_(True))).all()
    if current_user.role == UserRole.instructor and lesson.course.instructor_id == current_user.id:
        return ok([QuestionOut.model_validate(question) for question in questions])
    if current_user.role == UserRole.admin:
        return ok([QuestionOut.model_validate(question) for question in questions])
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
    db.commit()
    return ok(None, "Question hidden")
