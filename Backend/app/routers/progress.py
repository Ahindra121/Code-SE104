from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_roles
from app.models.entities import Enrollment, EnrollmentStatus, LearningProgress, Lesson, User, UserRole
from app.schemas.common import ok
from app.schemas.progress import CourseProgressOut, ProgressOut, ProgressUpdate

router = APIRouter(prefix="/progress", tags=["Progress"])


def require_enrollment(db: Session, student_id: int, course_id: int) -> Enrollment:
    enrollment = db.scalar(
        select(Enrollment).where(
            Enrollment.student_id == student_id,
            Enrollment.course_id == course_id,
            Enrollment.status == EnrollmentStatus.active,
        )
    )
    if not enrollment:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Enrollment required")
    return enrollment


def calculate_course_progress(db: Session, student_id: int, course_id: int) -> CourseProgressOut:
    total = db.scalar(select(func.count(Lesson.id)).where(Lesson.course_id == course_id, Lesson.is_deleted.is_(False), Lesson.is_visible.is_(True))) or 0
    completed = db.scalar(
        select(func.count(LearningProgress.id)).where(
            LearningProgress.student_id == student_id,
            LearningProgress.course_id == course_id,
            LearningProgress.is_completed.is_(True),
        )
    ) or 0
    percent = 100.0 if total == 0 else round((completed / total) * 100, 2)
    return CourseProgressOut(course_id=course_id, completed_lessons=completed, total_lessons=total, percent=percent)


@router.post("")
def update_progress(payload: ProgressUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.student))):
    lesson = db.get(Lesson, payload.lesson_id)
    if not lesson or lesson.is_deleted or not lesson.is_visible:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")
    require_enrollment(db, current_user.id, lesson.course_id)
    progress = db.scalar(select(LearningProgress).where(LearningProgress.student_id == current_user.id, LearningProgress.lesson_id == lesson.id))
    if not progress:
        progress = LearningProgress(
            student_id=current_user.id,
            course_id=lesson.course_id,
            lesson_id=lesson.id,
            watched_seconds=0,
            is_completed=False,
        )
        db.add(progress)
    progress.watched_seconds = max(progress.watched_seconds or 0, payload.watched_seconds)
    if lesson.duration_seconds > 0 and progress.watched_seconds >= lesson.duration_seconds * 0.9:
        progress.is_completed = True
        progress.completed_at = progress.completed_at or datetime.now(UTC)
    db.commit()
    db.refresh(progress)
    return ok(ProgressOut.model_validate(progress), "Progress updated")


@router.get("/course/{course_id}")
def course_progress(course_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.student))):
    require_enrollment(db, current_user.id, course_id)
    return ok(calculate_course_progress(db, current_user.id, course_id))
