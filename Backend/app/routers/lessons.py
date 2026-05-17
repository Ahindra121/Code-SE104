from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user, require_roles
from app.models.entities import Course, CourseStatus, Enrollment, EnrollmentStatus, Lesson, User, UserRole
from app.schemas.common import ok
from app.schemas.lesson import LessonCreate, LessonOut, LessonUpdate
from app.services.course_service import assert_course_owner

router = APIRouter(prefix="/lessons", tags=["Lessons"])


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


@router.get("/course/{course_id}")
def list_lessons(course_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    course = db.get(Course, course_id)
    if not course or course.is_deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    lessons = db.scalars(select(Lesson).where(Lesson.course_id == course_id, Lesson.is_deleted.is_(False)).order_by(Lesson.order_index)).all()
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


@router.get("/{lesson_id}")
def get_lesson(lesson_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    lesson = db.get(Lesson, lesson_id)
    if not lesson or lesson.is_deleted or not lesson.course or lesson.course.is_deleted:
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
    db.commit()
    return ok(None, "Lesson hidden")
