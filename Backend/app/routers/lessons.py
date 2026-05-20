import unicodedata
from datetime import UTC, datetime, timedelta
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user, require_roles
from app.models.entities import Course, CourseStatus, Enrollment, EnrollmentStatus, LearningProgress, Lesson, User, UserRole
from app.schemas.common import ok
from app.schemas.lesson import LessonCreate, LessonOut, LessonReorder, LessonUpdate
from app.schemas.progress import LessonProgressUpdate, ProgressOut
from app.routers.progress import apply_progress_update, require_enrollment, sync_lesson_completion
from app.services.course_service import assert_course_owner

router = APIRouter(prefix="/lessons", tags=["Lessons"])
CONTENT_RESTORE_DAYS = 30
UPLOAD_ROOT = Path(__file__).resolve().parents[2] / "uploads"
VIDEO_EXTENSIONS = {".mp4", ".webm", ".mov"}
DOCUMENT_EXTENSIONS = {".pdf", ".doc", ".docx", ".ppt", ".pptx"}
MAX_VIDEO_SIZE = 100 * 1024 * 1024
MAX_DOCUMENT_SIZE = 20 * 1024 * 1024


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


def _safe_filename(filename: str) -> str:
    normalized = unicodedata.normalize("NFKD", Path(filename).name)
    ascii_name = normalized.encode("ascii", "ignore").decode("ascii").replace(" ", "_")
    return "".join(char for char in ascii_name if char.isalnum() or char in "._-") or "upload"


def _delete_upload(url: str | None) -> None:
    if not url or not url.startswith("/uploads/"):
        return
    path = (UPLOAD_ROOT.parent / url.lstrip("/")).resolve()
    if UPLOAD_ROOT not in path.parents:
        return
    if path.is_file():
        path.unlink(missing_ok=True)


async def _save_upload(
    file: UploadFile,
    destination_dir: Path,
    allowed_extensions: set[str],
    max_size: int,
    invalid_message: str,
    size_message: str,
) -> tuple[str, str, str]:
    extension = Path(file.filename or "").suffix.lower()
    if extension not in allowed_extensions:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=invalid_message)

    destination_dir.mkdir(parents=True, exist_ok=True)
    safe_name = _safe_filename(file.filename or f"upload{extension}")
    filename = f"{uuid4().hex}_{safe_name}"
    destination = destination_dir / filename

    size = 0
    try:
        with destination.open("wb") as output:
            while chunk := await file.read(1024 * 1024):
                size += len(chunk)
                if size > max_size:
                    output.close()
                    destination.unlink(missing_ok=True)
                    raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail=size_message)
                output.write(chunk)
    except HTTPException:
        raise
    except OSError as exc:
        destination.unlink(missing_ok=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Upload thất bại") from exc
    finally:
        await file.close()

    return "/" + destination.relative_to(UPLOAD_ROOT.parent).as_posix(), safe_name, extension.lstrip(".")


def _upload_path(url: str | None) -> Path | None:
    if not url or not url.startswith("/uploads/"):
        return None
    path = (UPLOAD_ROOT.parent / url.lstrip("/")).resolve()
    if UPLOAD_ROOT not in path.parents:
        return None
    return path


def _get_lesson_for_student_progress(db: Session, lesson_id: int, current_user: User) -> Lesson:
    lesson = db.get(Lesson, lesson_id)
    if not lesson or lesson.is_deleted or not lesson.is_visible:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")
    require_enrollment(db, current_user.id, lesson.course_id)
    return lesson


def _get_or_create_progress(db: Session, lesson: Lesson, current_user: User) -> LearningProgress:
    progress = db.scalar(
        select(LearningProgress).where(
            LearningProgress.student_id == current_user.id,
            LearningProgress.lesson_id == lesson.id,
        )
    )
    if progress:
        return progress
    progress = LearningProgress(
        student_id=current_user.id,
        course_id=lesson.course_id,
        lesson_id=lesson.id,
        watched_seconds=0,
        max_watched_seconds=0,
        duration_seconds=lesson.duration_seconds or 0,
        progress_percent=0,
        is_completed=False,
    )
    db.add(progress)
    return progress


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


@router.post("/{lesson_id}/upload-video")
async def upload_lesson_video(
    lesson_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.instructor)),
):
    lesson = db.get(Lesson, lesson_id)
    if not lesson or lesson.is_deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")
    assert_course_owner(lesson.course, current_user)

    upload_dir = UPLOAD_ROOT / "courses" / f"course_{lesson.course_id}" / "lessons" / f"lesson_{lesson.id}" / "videos"
    new_url, _, _ = await _save_upload(file, upload_dir, VIDEO_EXTENSIONS, MAX_VIDEO_SIZE, "Sai định dạng video", "Video vượt quá 100MB")
    _delete_upload(lesson.video_url)
    lesson.video_url = new_url
    db.commit()
    db.refresh(lesson)
    return ok(LessonOut.model_validate(lesson), "Video uploaded")


@router.post("/{lesson_id}/upload-document")
async def upload_lesson_document(
    lesson_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.instructor)),
):
    lesson = db.get(Lesson, lesson_id)
    if not lesson or lesson.is_deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")
    assert_course_owner(lesson.course, current_user)

    upload_dir = UPLOAD_ROOT / "courses" / f"course_{lesson.course_id}" / "lessons" / f"lesson_{lesson.id}" / "documents"
    new_url, document_name, document_type = await _save_upload(
        file,
        upload_dir,
        DOCUMENT_EXTENSIONS,
        MAX_DOCUMENT_SIZE,
        "Sai định dạng tài liệu",
        "Tài liệu vượt quá 20MB",
    )
    _delete_upload(lesson.document_url)
    lesson.document_url = new_url
    lesson.document_name = document_name
    lesson.document_type = document_type
    db.commit()
    db.refresh(lesson)
    return ok(LessonOut.model_validate(lesson), "Document uploaded")


@router.get("/{lesson_id}/download-document")
def download_lesson_document(lesson_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    lesson = db.get(Lesson, lesson_id)
    if not lesson or lesson.is_deleted or not lesson.course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")
    if not can_access_lesson(db, current_user, lesson):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Enrollment required")
    path = _upload_path(lesson.document_url)
    if not path or not path.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return FileResponse(path, filename=lesson.document_name or path.name)


@router.get("/{lesson_id}/progress")
def get_lesson_progress(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.student)),
):
    lesson = _get_lesson_for_student_progress(db, lesson_id, current_user)
    progress = db.scalar(
        select(LearningProgress).where(
            LearningProgress.student_id == current_user.id,
            LearningProgress.lesson_id == lesson.id,
        )
    )
    if not progress:
        progress = _get_or_create_progress(db, lesson, current_user)
        db.commit()
        db.refresh(progress)
    return ok(ProgressOut.model_validate(progress))


@router.post("/{lesson_id}/progress")
def update_lesson_progress(
    lesson_id: int,
    payload: LessonProgressUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.student)),
):
    lesson = _get_lesson_for_student_progress(db, lesson_id, current_user)
    progress = _get_or_create_progress(db, lesson, current_user)
    apply_progress_update(
        progress,
        lesson,
        payload.watched_seconds,
        payload.max_watched_seconds,
        payload.duration_seconds,
        payload.progress_percent,
    )
    sync_lesson_completion(db, progress, lesson)
    db.commit()
    db.refresh(progress)
    return ok(ProgressOut.model_validate(progress), "Progress updated")


@router.post("/{lesson_id}/complete")
def complete_lesson(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.student)),
):
    lesson = _get_lesson_for_student_progress(db, lesson_id, current_user)
    if lesson.video_url:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Video lessons must be completed by watching at least 90% and passing quiz if available")
    progress = _get_or_create_progress(db, lesson, current_user)
    progress.watched_seconds = lesson.duration_seconds or progress.watched_seconds or 0
    progress.max_watched_seconds = max(progress.max_watched_seconds or 0, lesson.duration_seconds or 0)
    progress.duration_seconds = max(progress.duration_seconds or 0, lesson.duration_seconds or 0)
    progress.progress_percent = 100
    progress.document_viewed = True
    sync_lesson_completion(db, progress, lesson)
    db.commit()
    db.refresh(progress)
    return ok(ProgressOut.model_validate(progress), "Lesson completed")


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
