from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_roles
from app.models.entities import Enrollment, EnrollmentStatus, LearningProgress, Lesson, Question, QuizAnswer, QuizAttempt, User, UserRole
from app.routers.progress import sync_lesson_completion
from app.schemas.common import ok
from app.schemas.quiz import QuizAttemptOut, QuizSubmit

router = APIRouter(prefix="/quizzes", tags=["Quizzes"])


@router.post("/submit")
def submit_quiz(payload: QuizSubmit, db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.student))):
    lesson = db.get(Lesson, payload.lesson_id)
    if not lesson or lesson.is_deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")
    enrolled = db.scalar(
        select(Enrollment).where(
            Enrollment.student_id == current_user.id,
            Enrollment.course_id == lesson.course_id,
            Enrollment.status == EnrollmentStatus.active,
        )
    )
    if not enrolled:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Enrollment required")
    questions = db.scalars(select(Question).where(Question.lesson_id == lesson.id, Question.is_active.is_(True))).all()
    if not questions:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No active questions for this lesson")

    selected_by_question = {answer.question_id: answer.selected_option for answer in payload.answers}
    correct_count = sum(1 for question in questions if selected_by_question.get(question.id) == question.correct_option)
    score = round((correct_count / len(questions)) * 10, 2)
    attempt = QuizAttempt(
        student_id=current_user.id,
        course_id=lesson.course_id,
        lesson_id=lesson.id,
        score=score,
        total_questions=len(questions),
        correct_count=correct_count,
        passed=score >= 5,
    )
    db.add(attempt)
    db.flush()
    for question in questions:
        selected = selected_by_question.get(question.id)
        if selected:
            db.add(
                QuizAnswer(
                    attempt_id=attempt.id,
                    question_id=question.id,
                    selected_option=selected,
                    is_correct=selected == question.correct_option,
                )
            )
    progress = db.scalar(
        select(LearningProgress).where(
            LearningProgress.student_id == current_user.id,
            LearningProgress.lesson_id == lesson.id,
        )
    )
    if not progress:
        progress = LearningProgress(
            student_id=current_user.id,
            course_id=lesson.course_id,
            lesson_id=lesson.id,
            watched_seconds=0,
            document_viewed=False,
            is_completed=False,
        )
        db.add(progress)
    sync_lesson_completion(db, progress, lesson)
    db.commit()
    db.refresh(attempt)
    return ok(QuizAttemptOut.model_validate(attempt), "Quiz submitted")


@router.get("/attempts/mine")
def my_attempts(db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.student))):
    attempts = db.scalars(select(QuizAttempt).where(QuizAttempt.student_id == current_user.id).order_by(QuizAttempt.submitted_at.desc())).all()
    return ok([QuizAttemptOut.model_validate(attempt) for attempt in attempts])
