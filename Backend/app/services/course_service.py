from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.entities import Course, Enrollment, EnrollmentStatus, Review, User
from app.schemas.course import CourseOut
from app.schemas.user import UserOut


def course_to_out(db: Session, course: Course) -> CourseOut:
    rating, reviews_count = db.execute(
        select(func.coalesce(func.avg(Review.average_rating), 0), func.count(Review.id)).where(
            Review.course_id == course.id,
            Review.is_visible.is_(True),
        )
    ).one()
    students_count = db.scalar(
        select(func.count(Enrollment.id)).where(
            Enrollment.course_id == course.id,
            Enrollment.status.in_([EnrollmentStatus.active, EnrollmentStatus.completed]),
        )
    ) or 0
    lessons_count = len([lesson for lesson in course.lessons if not lesson.is_deleted])
    return CourseOut(
        id=course.id,
        title=course.title,
        category=course.category,
        description=course.description,
        price=float(course.price or 0),
        thumbnail_url=course.thumbnail_url,
        level=course.level,
        status=course.status,
        instructor_id=course.instructor_id,
        is_deleted=course.is_deleted,
        deleted_at=course.deleted_at,
        rejection_reason=course.rejection_reason,
        reviewed_by_id=course.reviewed_by_id,
        reviewed_at=course.reviewed_at,
        created_at=course.created_at,
        updated_at=course.updated_at,
        instructor=UserOut.model_validate(course.instructor) if course.instructor else None,
        rating=round(float(rating or 0), 2),
        reviews_count=int(reviews_count or 0),
        students_count=int(students_count),
        lessons_count=lessons_count,
    )


def assert_course_owner(course: Course, user: User) -> None:
    from fastapi import HTTPException, status

    if course.instructor_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bạn chỉ có thể quản lý khóa học của mình")
