from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user, require_roles
from app.models.entities import Course, CourseStatus, Enrollment, EnrollmentStatus, Lesson, User, UserRole
from app.schemas.common import ok
from app.schemas.lesson import LessonCreate, LessonOut, LessonReorder, LessonUpdate
from app.services.course_service import assert_course_owner

router = APIRouter(prefix="/lessons", tags=["Lessons"])
CONTENT_RESTORE_DAYS = 30


def _now() -> datetime:
    return datetime.now(UTC)


def _can_restore(deleted_at: datetime | None) -> bool:
    if deleted_at is None:
        return True
    if deleted_at.tzinfo is None:
        deleted_at = deleted_at.replace(tzinfo=UTC)
    return deleted_at >= _now() - timedelta(days=CONTENT_RESTORE_DAYS)


def can_access_lesson(db: Session, user: User, lesson: Lesson) -> bool:
    if user.role == UserRole.admin:
        return True
    if user.role == UserRole.instructor and lesson.course.instructor_id == user.id:
        return True
    return bool(
        db.scalar(
            select(Enrollment).where(
                Enrollment.student_id == user.id,
                Enrollment.course_id == lesson.course_id,
                Enrollment.status == EnrollmentStatus.active,
            )
        )
    )


def is_enrolled_in_course(db: Session, user: User, course_id: int) -> bool:
    return bool(
        db.scalar(
            select(Enrollment).where(
                Enrollment.student_id == user.id,
                Enrollment.course_id == course_id,
                Enrollment.status.in_([EnrollmentStatus.active, EnrollmentStatus.completed]),
            )
        )
    )


@router.get("/course/{course_id}")
def list_lessons(
    course_id: int,
    include_deleted: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    course = db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    if course.is_deleted:
        can_view_deleted = (
            current_user.role == UserRole.admin
            or (current_user.role == UserRole.instructor and course.instructor_id == current_user.id)
            or (current_user.role == UserRole.student and is_enrolled_in_course(db, current_user, course_id))
        )
        if not can_view_deleted:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    if current_user.role == UserRole.instructor and course.instructor_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bạn chỉ có thể quản lý khóa học của mình")
    filters = [Lesson.course_id == course_id]
    if not (include_deleted and current_user.role == UserRole.instructor):
        filters.append(Lesson.is_deleted.is_(False))
    lessons = db.scalars(select(Lesson).where(*filters).order_by(Lesson.order_index)).all()
    if current_user.role == UserRole.student:
        enrolled = db.scalar(
            select(Enrollment).where(
                Enrollment.student_id == current_user.id,
                Enrollment.course_id == course_id,
                Enrollment.status == EnrollmentStatus.active,
            )
        )
        if not enrolled and course.status != CourseStatus.approved:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Enrollment required")
        lessons = [lesson for lesson in lessons if lesson.is_visible]
    return ok([LessonOut.model_validate(lesson) for lesson in lessons])


@router.post("")
def create_lesson(payload: LessonCreate, db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.instructor))):
    course = db.get(Course, payload.course_id)
    if not course or course.is_deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    assert_course_owner(course, current_user)
    lesson = Lesson(**payload.model_dump())
    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    return ok(LessonOut.model_validate(lesson), "Lesson created")


@router.patch("/course/{course_id}/reorder")
def reorder_lessons(
    course_id: int,
    payload: LessonReorder,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.instructor)),
):
    course = db.get(Course, course_id)
    if not course or course.is_deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    assert_course_owner(course, current_user)

    lesson_ids = [item.id for item in payload.items]
    if len(set(lesson_ids)) != len(lesson_ids):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Duplicate lessons in reorder payload")

    lessons = db.scalars(select(Lesson).where(Lesson.course_id == course_id, Lesson.id.in_(lesson_ids))).all()
    if len(lessons) != len(lesson_ids):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="All lessons must belong to this course")

    lessons_by_id = {lesson.id: lesson for lesson in lessons}
    for lesson in lessons:
        lesson.order_index = -lesson.id
    db.flush()

    for item in payload.items:
        lessons_by_id[item.id].order_index = item.order_index

    db.commit()
    ordered = db.scalars(select(Lesson).where(Lesson.course_id == course_id).order_by(Lesson.order_index)).all()
    return ok([LessonOut.model_validate(lesson) for lesson in ordered], "Lesson order updated")


@router.get("/{lesson_id}")
def get_lesson(lesson_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    lesson = db.get(Lesson, lesson_id)
    if not lesson or lesson.is_deleted or not lesson.course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")
    if lesson.course.is_deleted and not can_access_lesson(db, current_user, lesson):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")
    if not can_access_lesson(db, current_user, lesson):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Enrollment required")
    return ok(LessonOut.model_validate(lesson))


@router.patch("/{lesson_id}")
def update_lesson(
    lesson_id: int,
    payload: LessonUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.instructor)),
):
    lesson = db.get(Lesson, lesson_id)
    if not lesson or lesson.is_deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")
    assert_course_owner(lesson.course, current_user)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(lesson, field, value)
    db.commit()
    db.refresh(lesson)
    return ok(LessonOut.model_validate(lesson), "Lesson updated")


@router.delete("/{lesson_id}")
def soft_delete_lesson(lesson_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.instructor))):
    lesson = db.get(Lesson, lesson_id)
    if not lesson or lesson.is_deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")
    assert_course_owner(lesson.course, current_user)
    lesson.is_deleted = True
    lesson.is_visible = False
    lesson.deleted_at = _now()
    db.commit()
    return ok(None, "Đã ẩn bài học")


@router.patch("/{lesson_id}/restore")
def restore_lesson(lesson_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.instructor))):
    lesson = db.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy bài học")
    assert_course_owner(lesson.course, current_user)
    if not lesson.is_deleted:
        return ok(LessonOut.model_validate(lesson), "Bài học đang hoạt động")
    if not _can_restore(lesson.deleted_at):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Bài học đã quá thời hạn khôi phục")
    lesson.is_deleted = False
    lesson.deleted_at = None
    lesson.is_visible = True
    db.commit()
    db.refresh(lesson)
    return ok(LessonOut.model_validate(lesson), "Đã khôi phục bài học")
