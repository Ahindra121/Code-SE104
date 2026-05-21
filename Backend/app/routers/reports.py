from sqlalchemy import func, select
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends

from app.core.database import get_db
from app.dependencies.auth import require_roles
from app.models.entities import (
    Certificate,
    Course,
    CourseDeletionRequest,
    CourseDeletionRequestStatus,
    CourseStatus,
    Enrollment,
    EnrollmentStatus,
    LearningProgress,
    QuizAttempt,
    ReactivationRequest,
    ReactivationRequestStatus,
    Review,
    User,
    UserRole,
)
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
        students = db.scalar(
            select(func.count(Enrollment.id)).where(
                Enrollment.course_id == course.id,
                Enrollment.status.in_([EnrollmentStatus.active, EnrollmentStatus.completed]),
            )
        ) or 0
        avg_score = db.scalar(select(func.coalesce(func.avg(QuizAttempt.score), 0)).where(QuizAttempt.course_id == course.id)) or 0
        total_lessons = db.scalar(select(func.count(LearningProgress.id)).where(LearningProgress.course_id == course.id)) or 0
        completed = db.scalar(select(func.count(LearningProgress.id)).where(LearningProgress.course_id == course.id, LearningProgress.is_completed.is_(True))) or 0
        revenue = float(course.price or 0) * students
        rating = db.scalar(
            select(func.coalesce(func.avg(Review.average_rating), 0)).where(
                Review.course_id == course.id,
                Review.is_visible.is_(True),
            )
        ) or 0
        data.append({
            "course_id": course.id,
            "title": course.title,
            "category": course.category,
            "students": students,
            "revenue": revenue,
            "rating": round(float(rating), 2),
            "completion_rate": 0 if total_lessons == 0 else round((completed / total_lessons) * 100, 2),
            "average_quiz_score": round(float(avg_score), 2),
        })
    return ok(data)


@router.get("/instructor/students")
def instructor_students(db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.instructor))):
    rows = db.execute(
        select(Enrollment, User, Course)
        .join(User, Enrollment.student_id == User.id)
        .join(Course, Enrollment.course_id == Course.id)
        .where(
            Course.instructor_id == current_user.id,
            Course.is_deleted.is_(False),
            Enrollment.status.in_([EnrollmentStatus.active, EnrollmentStatus.completed]),
        )
        .order_by(Enrollment.enrolled_at.desc())
    ).all()
    data = []
    for enrollment, student, course in rows:
        total_progress = db.scalar(
            select(func.count(LearningProgress.id)).where(
                LearningProgress.student_id == student.id,
                LearningProgress.course_id == course.id,
            )
        ) or 0
        completed = db.scalar(
            select(func.count(LearningProgress.id)).where(
                LearningProgress.student_id == student.id,
                LearningProgress.course_id == course.id,
                LearningProgress.is_completed.is_(True),
            )
        ) or 0
        progress = 0 if total_progress == 0 else round((completed / total_progress) * 100)
        data.append({
            "id": enrollment.id,
            "student_id": student.id,
            "name": student.full_name or student.username,
            "email": student.email,
            "course": course.title,
            "enrolled_at": enrollment.enrolled_at,
            "progress": progress,
            "status": enrollment.status.value,
        })
    return ok(data)


@router.get("/admin")
def admin_report(db: Session = Depends(get_db), _: User = Depends(require_roles(UserRole.admin))):
    category_rows = db.execute(
        select(Course.category, func.count(Course.id))
        .where(Course.is_deleted.is_(False))
        .group_by(Course.category)
        .order_by(func.count(Course.id).desc())
    ).all()
    course_rows = db.scalars(select(Course).where(Course.is_deleted.is_(False))).all()
    revenue = 0.0
    for course in course_rows:
        students = db.scalar(
            select(func.count(Enrollment.id)).where(
                Enrollment.course_id == course.id,
                Enrollment.status.in_([EnrollmentStatus.active, EnrollmentStatus.completed]),
            )
        ) or 0
        revenue += float(course.price or 0) * students
    pending_deletions = db.scalar(
        select(func.count(CourseDeletionRequest.id)).where(CourseDeletionRequest.status == CourseDeletionRequestStatus.pending)
    ) or 0
    pending_reactivations = db.scalar(
        select(func.count(ReactivationRequest.id)).where(ReactivationRequest.status == ReactivationRequestStatus.pending)
    ) or 0
    pending_courses = (
        db.scalar(
            select(func.count(Course.id)).where(
                Course.status.in_([CourseStatus.pending, CourseStatus.pending_review]),
                Course.is_deleted.is_(False),
            )
        )
        or 0
    )
    return ok({
        "users": db.scalar(select(func.count(User.id))) or 0,
        "instructors": db.scalar(select(func.count(User.id)).where(User.role == UserRole.instructor)) or 0,
        "courses": len(course_rows),
        "enrollments": db.scalar(select(func.count(Enrollment.id))) or 0,
        "certificates": db.scalar(select(func.count(Certificate.id))) or 0,
        "revenue": revenue,
        "pending_courses": pending_courses,
        "pending_deletions": pending_deletions,
        "pending_reactivations": pending_reactivations,
        "category_data": [{"name": name, "value": value} for name, value in category_rows],
        "revenue_data": [
            {"month": "Hiện tại", "revenue": revenue, "users": db.scalar(select(func.count(User.id))) or 0}
        ],
    })
