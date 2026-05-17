from sqlalchemy import func, select
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends

from app.core.database import get_db
from app.dependencies.auth import require_roles
from app.models.entities import Certificate, Course, Enrollment, EnrollmentStatus, LearningProgress, QuizAttempt, User, UserRole
from app.schemas.common import ok

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/student")
def student_report(db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.student))):
    enrollments = db.scalars(
        select(Enrollment).where(
            Enrollment.student_id == current_user.id,
            Enrollment.status.in_([EnrollmentStatus.active, EnrollmentStatus.completed]),
        )
    ).all()
    attempts = db.scalars(select(QuizAttempt).where(QuizAttempt.student_id == current_user.id).order_by(QuizAttempt.submitted_at.desc())).all()
    certificates = db.scalars(select(Certificate).where(Certificate.student_id == current_user.id)).all()
    progress = db.scalars(select(LearningProgress).where(LearningProgress.student_id == current_user.id)).all()
    return ok({
        "enrollments": len(enrollments),
        "progress_records": [{"course_id": p.course_id, "lesson_id": p.lesson_id, "is_completed": p.is_completed} for p in progress],
        "quiz_attempts": [{"lesson_id": a.lesson_id, "score": a.score, "passed": a.passed} for a in attempts],
        "certificates": [{"course_id": c.course_id, "certificate_code": c.certificate_code} for c in certificates],
    })


@router.get("/instructor")
def instructor_report(db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.instructor))):
    courses = db.scalars(select(Course).where(Course.instructor_id == current_user.id, Course.is_deleted.is_(False))).all()
    data = []
    for course in courses:
        students = db.scalar(select(func.count(Enrollment.id)).where(Enrollment.course_id == course.id)) or 0
        avg_score = db.scalar(select(func.coalesce(func.avg(QuizAttempt.score), 0)).where(QuizAttempt.course_id == course.id)) or 0
        total_lessons = db.scalar(select(func.count(LearningProgress.id)).where(LearningProgress.course_id == course.id)) or 0
        completed = db.scalar(select(func.count(LearningProgress.id)).where(LearningProgress.course_id == course.id, LearningProgress.is_completed.is_(True))) or 0
        data.append({
            "course_id": course.id,
            "title": course.title,
            "students": students,
            "completion_rate": 0 if total_lessons == 0 else round((completed / total_lessons) * 100, 2),
            "average_quiz_score": round(float(avg_score), 2),
        })
    return ok(data)


@router.get("/admin")
def admin_report(db: Session = Depends(get_db), _: User = Depends(require_roles(UserRole.admin))):
    return ok({
        "users": db.scalar(select(func.count(User.id))) or 0,
        "courses": db.scalar(select(func.count(Course.id)).where(Course.is_deleted.is_(False))) or 0,
        "enrollments": db.scalar(select(func.count(Enrollment.id))) or 0,
        "certificates": db.scalar(select(func.count(Certificate.id))) or 0,
    })
