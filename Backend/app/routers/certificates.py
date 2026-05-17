import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user, require_roles
from app.models.entities import Certificate, Enrollment, EnrollmentStatus, LearningProgress, Lesson, QuizAttempt, Question, User, UserRole
from app.schemas.certificate import CertificateOut
from app.schemas.common import ok

router = APIRouter(prefix="/certificates", tags=["Certificates"])


def eligibility(db: Session, student_id: int, course_id: int) -> None:
    enrolled = db.scalar(
        select(Enrollment).where(
            Enrollment.student_id == student_id,
            Enrollment.course_id == course_id,
            Enrollment.status.in_([EnrollmentStatus.active, EnrollmentStatus.completed]),
        )
    )
    if not enrolled:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Enrollment required")
    total_lessons = db.scalar(select(func.count(Lesson.id)).where(Lesson.course_id == course_id, Lesson.is_deleted.is_(False), Lesson.is_visible.is_(True))) or 0
    completed_lessons = db.scalar(
        select(func.count(LearningProgress.id)).where(
            LearningProgress.student_id == student_id,
            LearningProgress.course_id == course_id,
            LearningProgress.is_completed.is_(True),
        )
    ) or 0
    if total_lessons == 0 or completed_lessons < total_lessons:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Course lessons are not 100% completed")

    quiz_lessons = db.scalars(
        select(Lesson.id)
        .join(Question, Question.lesson_id == Lesson.id)
        .where(Lesson.course_id == course_id, Question.is_active.is_(True))
        .distinct()
    ).all()
    for lesson_id in quiz_lessons:
        passed = db.scalar(
            select(QuizAttempt).where(
                QuizAttempt.student_id == student_id,
                QuizAttempt.course_id == course_id,
                QuizAttempt.lesson_id == lesson_id,
                QuizAttempt.passed.is_(True),
            )
        )
        if not passed:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Required quizzes are not passed")


@router.post("/course/{course_id}")
def issue_certificate(course_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.student))):
    existing = db.scalar(select(Certificate).where(Certificate.student_id == current_user.id, Certificate.course_id == course_id))
    if existing:
        return ok(CertificateOut.model_validate(existing), "Certificate already issued")
    eligibility(db, current_user.id, course_id)
    cert = Certificate(certificate_code=f"LH-{uuid.uuid4().hex[:12].upper()}", student_id=current_user.id, course_id=course_id)
    db.add(cert)
    db.commit()
    db.refresh(cert)
    return ok(CertificateOut.model_validate(cert), "Certificate issued")


@router.get("/mine")
def my_certificates(db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.student))):
    certs = db.scalars(select(Certificate).where(Certificate.student_id == current_user.id).order_by(Certificate.issued_at.desc())).all()
    return ok([CertificateOut.model_validate(cert) for cert in certs])


@router.get("/{certificate_code}")
def verify_certificate(certificate_code: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    cert = db.scalar(select(Certificate).where(Certificate.certificate_code == certificate_code))
    if not cert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Certificate not found")
    return ok(CertificateOut.model_validate(cert))
