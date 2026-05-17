from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_roles
from app.models.entities import Enrollment, EnrollmentStatus, Review, User, UserRole
from app.schemas.common import ok
from app.schemas.review import ReviewCreate, ReviewOut

router = APIRouter(prefix="/reviews", tags=["Reviews"])


@router.get("/course/{course_id}")
def list_reviews(course_id: int, db: Session = Depends(get_db)):
    reviews = db.scalars(select(Review).where(Review.course_id == course_id).order_by(Review.created_at.desc())).all()
    return ok([ReviewOut.model_validate(review) for review in reviews])


@router.post("")
def create_review(payload: ReviewCreate, db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.student))):
    enrolled = db.scalar(
        select(Enrollment).where(
            Enrollment.student_id == current_user.id,
            Enrollment.course_id == payload.course_id,
            Enrollment.status.in_([EnrollmentStatus.active, EnrollmentStatus.completed]),
        )
    )
    if not enrolled:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Enrollment required")
    if db.scalar(select(Review).where(Review.student_id == current_user.id, Review.course_id == payload.course_id)):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="You already reviewed this course")
    review = Review(student_id=current_user.id, **payload.model_dump())
    db.add(review)
    db.commit()
    db.refresh(review)
    return ok(ReviewOut.model_validate(review), "Review created")
