from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.dependencies.auth import require_roles
from app.models.entities import Course, CourseStatus, Enrollment, EnrollmentStatus, LearningProgress, User, UserRole
from app.schemas.common import ok
from app.schemas.enrollment import EnrollmentCreate, EnrollmentOut
from app.services.course_service import course_to_out

router = APIRouter(prefix="/enrollments", tags=["Enrollments"])


@router.get("/mine")
def my_enrollments(db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.student))):
    rows = db.scalars(
        select(Enrollment)
        .options(joinedload(Enrollment.course).joinedload(Course.instructor), joinedload(Enrollment.course).joinedload(Course.lessons))
        .where(Enrollment.student_id == current_user.id)
    ).unique().all()
    return ok([
        {
            "id": row.id,
            "student_id": row.student_id,
            "course_id": row.course_id,
            "status": row.status,
            "enrolled_at": row.enrolled_at,
            "course": course_to_out(db, row.course) if row.course else None,
        }
        for row in rows
    ])


@router.post("")
def enroll(payload: EnrollmentCreate, db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.student))):
    course = db.get(Course, payload.course_id)
    if not course or course.is_deleted or course.status != CourseStatus.approved:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Course is not available for enrollment")
    existing = db.scalar(select(Enrollment).where(Enrollment.student_id == current_user.id, Enrollment.course_id == payload.course_id))
    if existing and existing.status == EnrollmentStatus.active:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already enrolled")
    if existing:
        existing.status = EnrollmentStatus.active
        db.commit()
        db.refresh(existing)
        return ok(EnrollmentOut.model_validate(existing), "Enrollment reactivated")
    enrollment = Enrollment(student_id=current_user.id, course_id=payload.course_id)
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    return ok(EnrollmentOut.model_validate(enrollment), "Enrolled successfully")


@router.patch("/{enrollment_id}/cancel")
def cancel_enrollment(enrollment_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.student))):
    enrollment = db.get(Enrollment, enrollment_id)
    if not enrollment or enrollment.student_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Enrollment not found")
    started = db.scalar(
        select(LearningProgress).where(LearningProgress.student_id == current_user.id, LearningProgress.course_id == enrollment.course_id)
    )
    if started:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot cancel after learning has started")
    enrollment.status = EnrollmentStatus.cancelled
    db.commit()
    db.refresh(enrollment)
    return ok(EnrollmentOut.model_validate(enrollment), "Enrollment cancelled")
