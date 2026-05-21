from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import distinct, func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_roles
from app.models.entities import Course, CourseProgress, Review, User, UserRole
from app.schemas.common import ok
from app.schemas.review import (
    CourseReviewSummaryOut,
    InstructorReviewSummaryOut,
    ReviewCreate,
    ReviewEligibilityOut,
    ReviewLegacyCreate,
    ReviewOut,
    ReviewPublicOut,
    ReviewVisibilityUpdate,
)

router = APIRouter(prefix="/reviews", tags=["Reviews"])
course_router = APIRouter(prefix="/courses", tags=["Course Reviews"])
instructor_router = APIRouter(prefix="/instructors", tags=["Instructor Reviews"])
instructor_manage_router = APIRouter(prefix="/instructor", tags=["Instructor Course Reviews"])
admin_router = APIRouter(prefix="/admin", tags=["Admin Course Reviews"])

REVIEW_CRITERIA = [
    "content_quality",
    "video_quality",
    "instructor_clarity",
    "material_usefulness",
    "assessment_quality",
    "practical_value",
    "overall_satisfaction",
]


def _review_average(payload: ReviewCreate) -> float:
    values = [getattr(payload, field) for field in REVIEW_CRITERIA]
    return round(sum(values) / len(values), 2)


def _review_out(review: Review) -> ReviewOut:
    data = ReviewOut.model_validate(review)
    data.student_name = review.student.full_name or review.student.username if review.student else None
    return data


def _review_public_out(review: Review) -> ReviewPublicOut:
    data = ReviewPublicOut.model_validate(review)
    data.student_name = review.student.full_name or review.student.username if review.student else None
    return data


def _has_completed_course(db: Session, student_id: int, course_id: int) -> bool:
    return bool(
        db.scalar(
            select(CourseProgress.id).where(
                CourseProgress.student_id == student_id,
                CourseProgress.course_id == course_id,
                CourseProgress.is_completed.is_(True),
            )
        )
    )


def _assert_can_review(db: Session, student_id: int, course_id: int) -> None:
    if not _has_completed_course(db, student_id, course_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You must complete this course before reviewing")
    if db.scalar(select(Review.id).where(Review.student_id == student_id, Review.course_id == course_id)):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="You have already reviewed this course")


@router.get("/course/{course_id}")
def list_reviews(course_id: int, db: Session = Depends(get_db)):
    return list_course_reviews(course_id, db)


@router.post("")
def create_legacy_review(
    payload: ReviewLegacyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.student)),
):
    values = payload.model_dump()
    course_id = values.pop("course_id")
    return create_course_review(course_id, ReviewCreate(**values), db, current_user)


@course_router.get("/{course_id}/reviews/eligibility")
def review_eligibility(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.student)),
):
    already_reviewed = bool(db.scalar(select(Review.id).where(Review.student_id == current_user.id, Review.course_id == course_id)))
    if already_reviewed:
        return ok(ReviewEligibilityOut(eligible=False, reason="You have already reviewed this course", already_reviewed=True))
    if not _has_completed_course(db, current_user.id, course_id):
        return ok(
            ReviewEligibilityOut(
                eligible=False,
                reason="You must complete this course before reviewing",
                already_reviewed=False,
            )
        )
    return ok(ReviewEligibilityOut(eligible=True, reason="You can review this course", already_reviewed=False))


@course_router.get("/{course_id}/reviews/me")
def get_my_course_review(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.student)),
):
    review = db.scalar(select(Review).where(Review.course_id == course_id, Review.student_id == current_user.id))
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    return ok(_review_out(review))


@course_router.post("/{course_id}/reviews")
def create_course_review(
    course_id: int,
    payload: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.student)),
):
    course = db.get(Course, course_id)
    if not course or course.is_deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    if course.instructor_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Instructors cannot review their own courses")
    _assert_can_review(db, current_user.id, course_id)
    average_rating = _review_average(payload)
    review = Review(
        student_id=current_user.id,
        course_id=course_id,
        rating=round(average_rating),
        average_rating=average_rating,
        **payload.model_dump(),
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return ok(_review_out(review), "Review created")


@course_router.patch("/{course_id}/reviews/me")
def update_my_course_review(
    course_id: int,
    payload: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.student)),
):
    if not _has_completed_course(db, current_user.id, course_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You must complete this course before reviewing")
    review = db.scalar(select(Review).where(Review.course_id == course_id, Review.student_id == current_user.id))
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    average_rating = _review_average(payload)
    for field, value in payload.model_dump().items():
        setattr(review, field, value)
    review.average_rating = average_rating
    review.rating = round(average_rating)
    db.commit()
    db.refresh(review)
    return ok(_review_out(review), "Review updated")


@course_router.get("/{course_id}/reviews")
def list_course_reviews(course_id: int, db: Session = Depends(get_db)):
    reviews = db.scalars(
        select(Review).where(Review.course_id == course_id, Review.is_visible.is_(True)).order_by(Review.created_at.desc())
    ).all()
    return ok([_review_public_out(review) for review in reviews])


@course_router.get("/{course_id}/reviews/summary")
def course_review_summary(course_id: int, db: Session = Depends(get_db)):
    row = db.execute(
        select(func.coalesce(func.avg(Review.average_rating), 0), func.count(Review.id)).where(
            Review.course_id == course_id,
            Review.is_visible.is_(True),
        )
    ).one()
    criteria_average = {}
    for field in REVIEW_CRITERIA:
        column = getattr(Review, field)
        criteria_average[field] = round(
            float(
                db.scalar(
                    select(func.coalesce(func.avg(column), 0)).where(
                        Review.course_id == course_id,
                        Review.is_visible.is_(True),
                    )
                )
                or 0
            ),
            1,
        )
    return ok(
        CourseReviewSummaryOut(
            course_id=course_id,
            average_rating=round(float(row[0] or 0), 1),
            review_count=int(row[1] or 0),
            criteria_average=criteria_average,
        )
    )


@instructor_router.get("/{instructor_id}/reviews/summary")
def instructor_review_summary(instructor_id: int, db: Session = Depends(get_db)):
    average_rating, review_count, course_count = db.execute(
        select(
            func.coalesce(func.avg(Review.average_rating), 0),
            func.count(Review.id),
            func.count(distinct(Review.course_id)),
        )
        .join(Course, Course.id == Review.course_id)
        .where(Course.instructor_id == instructor_id, Review.is_visible.is_(True))
    ).one()
    return ok(
        InstructorReviewSummaryOut(
            instructor_id=instructor_id,
            average_rating=round(float(average_rating or 0), 1),
            review_count=int(review_count or 0),
            course_count_with_reviews=int(course_count or 0),
        )
    )


@instructor_manage_router.get("/courses/{course_id}/reviews")
def list_instructor_course_reviews(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.instructor)),
):
    course = db.get(Course, course_id)
    if not course or course.is_deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    if course.instructor_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only view reviews for your courses")
    reviews = db.scalars(select(Review).where(Review.course_id == course_id).order_by(Review.created_at.desc())).all()
    return ok([_review_out(review) for review in reviews])


@admin_router.get("/courses/{course_id}/reviews")
def list_admin_course_reviews(
    course_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.admin)),
):
    reviews = db.scalars(select(Review).where(Review.course_id == course_id).order_by(Review.created_at.desc())).all()
    return ok([_review_out(review) for review in reviews])


@admin_router.patch("/reviews/{review_id}/visibility")
def update_review_visibility(
    review_id: int,
    payload: ReviewVisibilityUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.admin)),
):
    review = db.get(Review, review_id)
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    review.is_visible = payload.is_visible
    db.commit()
    db.refresh(review)
    return ok(_review_out(review), "Review visibility updated")
