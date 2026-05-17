from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.dependencies.auth import get_current_user, require_roles
from app.models.entities import Course, CourseStatus, User, UserRole
from app.schemas.common import ok
from app.schemas.course import CourseCreate, CourseListOut, CourseModeration, CourseUpdate
from app.services.course_service import assert_course_owner, course_to_out

router = APIRouter(prefix="/courses", tags=["Courses"])


@router.get("")
def list_courses(
    keyword: str | None = None,
    category: str | None = None,
    min_price: float | None = Query(default=None, ge=0),
    max_price: float | None = Query(default=None, ge=0),
    level: str | None = None,
    include_all: bool = False,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=12, ge=1, le=100),
    db: Session = Depends(get_db),
):
    filters = [Course.is_deleted.is_(False)]
    if not include_all:
        filters.append(Course.status == CourseStatus.approved)
    if keyword:
        like = f"%{keyword}%"
        filters.append(or_(Course.title.ilike(like), Course.description.ilike(like), Course.category.ilike(like)))
    if category:
        filters.append(Course.category == category)
    if level:
        filters.append(Course.level == level)
    if min_price is not None:
        filters.append(Course.price >= min_price)
    if max_price is not None:
        filters.append(Course.price <= max_price)

    total = len(db.scalars(select(Course.id).where(and_(*filters))).all())
    courses = db.scalars(
        select(Course)
        .options(joinedload(Course.instructor), joinedload(Course.lessons))
        .where(and_(*filters))
        .order_by(Course.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).unique().all()
    return ok(CourseListOut(items=[course_to_out(db, c) for c in courses], total=total, page=page, page_size=page_size))


@router.get("/mine")
def my_courses(db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.instructor))):
    courses = db.scalars(
        select(Course).options(joinedload(Course.instructor), joinedload(Course.lessons)).where(Course.instructor_id == current_user.id)
    ).unique().all()
    return ok([course_to_out(db, course) for course in courses])


@router.post("")
def create_course(payload: CourseCreate, db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.instructor))):
    course = Course(**payload.model_dump(), instructor_id=current_user.id)
    db.add(course)
    db.commit()
    db.refresh(course)
    return ok(course_to_out(db, course), "Course created")


@router.get("/{course_id}")
def get_course(course_id: int, db: Session = Depends(get_db)):
    course = db.scalars(
        select(Course).options(joinedload(Course.instructor), joinedload(Course.lessons)).where(Course.id == course_id, Course.is_deleted.is_(False))
    ).unique().first()
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    return ok(course_to_out(db, course))


@router.patch("/{course_id}")
def update_course(
    course_id: int,
    payload: CourseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.instructor)),
):
    course = db.get(Course, course_id)
    if not course or course.is_deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    assert_course_owner(course, current_user)
    if payload.status in [CourseStatus.approved, CourseStatus.rejected]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admin can approve or reject courses")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(course, field, value)
    db.commit()
    db.refresh(course)
    return ok(course_to_out(db, course), "Course updated")


@router.delete("/{course_id}")
def soft_delete_course(course_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.instructor))):
    course = db.get(Course, course_id)
    if not course or course.is_deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    assert_course_owner(course, current_user)
    course.is_deleted = True
    course.status = CourseStatus.archived
    db.commit()
    return ok(None, "Course archived")


@router.patch("/{course_id}/moderation")
def moderate_course(
    course_id: int,
    payload: CourseModeration,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.admin)),
):
    if payload.status not in [CourseStatus.approved, CourseStatus.rejected]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Admin can only approve or reject courses")
    course = db.get(Course, course_id)
    if not course or course.is_deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    course.status = payload.status
    course.rejection_reason = payload.rejection_reason if payload.status == CourseStatus.rejected else None
    db.commit()
    db.refresh(course)
    return ok(course_to_out(db, course), "Course moderation updated")
