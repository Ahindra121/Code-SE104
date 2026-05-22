from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.dependencies.auth import get_optional_current_user, require_roles
from app.models.entities import (
    Course,
    CourseDeletionRequest,
    CourseDeletionRequestStatus,
    CourseStatus,
    Enrollment,
    EnrollmentStatus,
    InstructorVerification,
    InstructorVerificationStatus,
    InstructorQualificationStatus,
    User,
    UserRole,
)
from app.schemas.common import ok
from app.schemas.course import (
    CourseCreate,
    CourseReject,
    CourseDeletionRequestCreate,
    CourseDeletionRequestOut,
    CourseDeletionReview,
    CourseListOut,
    CourseModeration,
    CourseUpdate,
)
from app.core.config import settings
from app.services.course_service import assert_course_owner, course_to_out
from app.services.settings_service import get_extensions_setting, get_int_setting
from app.services.storage_service import delete_storage_file, upload_file_to_storage

router = APIRouter(prefix="/courses", tags=["Courses"])
CONTENT_RESTORE_DAYS = 30
REVIEW_STATUSES = [CourseStatus.pending, CourseStatus.pending_review]


def _now() -> datetime:
    return datetime.now(UTC)


def _can_restore(deleted_at: datetime | None) -> bool:
    if deleted_at is None:
        return True
    if deleted_at.tzinfo is None:
        deleted_at = deleted_at.replace(tzinfo=UTC)
    return deleted_at >= _now() - timedelta(days=CONTENT_RESTORE_DAYS)


def _active_student_count(db: Session, course_id: int) -> int:
    return db.scalar(
        select(func.count(Enrollment.id)).where(
            Enrollment.course_id == course_id,
            Enrollment.status.in_([EnrollmentStatus.active, EnrollmentStatus.completed]),
        )
    ) or 0


def _delete_upload(url: str | None) -> None:
    delete_storage_file(url, settings.supabase_course_assets_bucket)


async def _save_thumbnail(db: Session, file: UploadFile, course_id: int) -> str:
    allowed_extensions = get_extensions_setting(db, "allowed_thumbnail_extensions")
    max_size_mb = get_int_setting(db, "max_thumbnail_size_mb")
    url, _, _ = await upload_file_to_storage(
        file=file,
        folder=f"courses/course_{course_id}/thumbnail",
        allowed_extensions=allowed_extensions,
        max_size=max_size_mb * 1024 * 1024,
        invalid_message="Dinh dang anh khoa hoc khong duoc ho tro",
        size_message=f"Anh dai dien khoa hoc vuot qua dung luong toi da {max_size_mb}MB",
        bucket=settings.supabase_course_assets_bucket,
        public=True,
    )
    return url


def _can_view_deleted_course(db: Session, course: Course, user: User | None) -> bool:
    if not user:
        return False
    if user.role == UserRole.admin:
        return True
    if user.role == UserRole.instructor and course.instructor_id == user.id:
        return True
    if user.role == UserRole.student:
        return bool(
            db.scalar(
                select(Enrollment).where(
                    Enrollment.student_id == user.id,
                    Enrollment.course_id == course.id,
                    Enrollment.status.in_([EnrollmentStatus.active, EnrollmentStatus.completed]),
                )
            )
        )
    return False


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
    verification = db.scalar(
        select(InstructorVerification).where(
            InstructorVerification.user_id == current_user.id,
            InstructorVerification.status == InstructorVerificationStatus.approved,
        )
    )
    if not verification:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Ban can xac minh giang vien truoc khi tao khoa hoc.",
        )
    values = payload.model_dump()
    if values.get("status") == CourseStatus.pending:
        values["status"] = CourseStatus.pending_review
    course = Course(**values, instructor_id=current_user.id)
    db.add(course)
    db.commit()
    db.refresh(course)
    return ok(course_to_out(db, course), "Course created")


@router.get("/{course_id}")
def get_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user),
):
    course = db.scalars(
        select(Course).options(joinedload(Course.instructor), joinedload(Course.lessons)).where(Course.id == course_id)
    ).unique().first()
    if not course or (course.is_deleted and not _can_view_deleted_course(db, course, current_user)):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    can_view_unapproved = bool(
        current_user
        and (
            current_user.role == UserRole.admin
            or (current_user.role == UserRole.instructor and course.instructor_id == current_user.id)
        )
    )
    if course.status != CourseStatus.approved and not can_view_unapproved:
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
        if field == "status" and value == CourseStatus.pending:
            value = CourseStatus.pending_review
        setattr(course, field, value)
    db.commit()
    db.refresh(course)
    return ok(course_to_out(db, course), "Course updated")


@router.post("/{course_id}/upload-thumbnail")
async def upload_course_thumbnail(
    course_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.instructor, UserRole.admin)),
):
    course = db.get(Course, course_id)
    if not course or course.is_deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    if current_user.role == UserRole.instructor:
        assert_course_owner(course, current_user)

    old_url = course.thumbnail_url
    course.thumbnail_url = await _save_thumbnail(db, file, course.id)
    _delete_upload(old_url)
    db.commit()
    db.refresh(course)
    return ok(course_to_out(db, course), "Course thumbnail uploaded")


@router.delete("/{course_id}")
def soft_delete_course(
    course_id: int,
    payload: CourseDeletionRequestCreate | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.instructor)),
):
    course = db.get(Course, course_id)
    if not course or course.is_deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    assert_course_owner(course, current_user)
    student_count = _active_student_count(db, course.id)
    if student_count > 0:
        if payload is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Course has enrolled students. Please provide a deletion reason for admin approval.",
            )
        existing = db.scalar(
            select(CourseDeletionRequest).where(
                CourseDeletionRequest.course_id == course.id,
                CourseDeletionRequest.status == CourseDeletionRequestStatus.pending,
            )
        )
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A deletion request is already pending")
        request = CourseDeletionRequest(
            course_id=course.id,
            instructor_id=current_user.id,
            reason=payload.reason,
            student_count=student_count,
        )
        db.add(request)
        db.commit()
        db.refresh(request)
        return ok(CourseDeletionRequestOut.model_validate(request), "Course deletion request sent to admin")
    course.is_deleted = True
    course.deleted_at = _now()
    course.status = CourseStatus.archived
    db.commit()
    return ok(None, "Đã lưu trữ khóa học")


@router.patch("/{course_id}/restore")
def restore_course(course_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.instructor))):
    course = db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy khóa học")
    assert_course_owner(course, current_user)
    if not course.is_deleted:
        return ok(course_to_out(db, course), "Khóa học đang hoạt động")
    if not _can_restore(course.deleted_at):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Khóa học đã quá thời hạn khôi phục")
    course.is_deleted = False
    course.deleted_at = None
    course.status = CourseStatus.draft
    db.commit()
    db.refresh(course)
    return ok(course_to_out(db, course), "Đã khôi phục khóa học")


@router.patch("/{course_id}/moderation")
def moderate_course(
    course_id: int,
    payload: CourseModeration,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin)),
):
    if payload.status not in [CourseStatus.approved, CourseStatus.rejected]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Admin can only approve or reject courses")
    if payload.status == CourseStatus.rejected and not (payload.rejection_reason or "").strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Rejection reason is required")
    course = db.get(Course, course_id)
    if not course or course.is_deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    course.status = payload.status
    course.rejection_reason = payload.rejection_reason if payload.status == CourseStatus.rejected else None
    course.reviewed_by_id = current_user.id
    course.reviewed_at = _now()
    db.commit()
    db.refresh(course)
    return ok(course_to_out(db, course), "Course moderation updated")


admin_router = APIRouter(prefix="/admin/courses", tags=["Admin Courses"])


@admin_router.get("")
def list_admin_courses(
    status: CourseStatus | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.admin)),
):
    filters = [Course.is_deleted.is_(False)]
    if status:
        filters.append(Course.status == status)
    courses = db.scalars(
        select(Course)
        .options(joinedload(Course.instructor), joinedload(Course.lessons))
        .where(and_(*filters))
        .order_by(Course.updated_at.desc())
    ).unique().all()
    return ok([course_to_out(db, course) for course in courses])


@admin_router.get("/{course_id}/review-info")
def get_course_review_info(course_id: int, db: Session = Depends(get_db), _: User = Depends(require_roles(UserRole.admin))):
    course = db.scalars(
        select(Course).options(joinedload(Course.instructor), joinedload(Course.lessons)).where(Course.id == course_id)
    ).unique().first()
    if not course or course.is_deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    verification = db.scalars(
        select(InstructorVerification).options(joinedload(InstructorVerification.qualifications)).where(
            InstructorVerification.user_id == course.instructor_id,
            InstructorVerification.status == InstructorVerificationStatus.approved,
        )
    ).unique().first()
    verification_data = None
    if verification:
        approved_qualifications = [
            {
                "id": qualification.id,
                "major": qualification.major,
                "university_name": qualification.university_name,
                "graduation_year": qualification.graduation_year,
                "degree_url": qualification.degree_url,
                "status": qualification.status,
            }
            for qualification in verification.qualifications
            if qualification.status == InstructorQualificationStatus.approved
        ]
        verification_data = {
            "id": verification.id,
            "status": verification.status,
            "major": verification.major,
            "university_name": verification.university_name,
            "graduation_year": verification.graduation_year,
            "degree_url": verification.degree_url,
            "cccd_front_url": verification.cccd_front_url,
            "cccd_back_url": verification.cccd_back_url,
            "admin_note": verification.admin_note,
            "qualifications": approved_qualifications,
        }
    qualifications = verification_data["qualifications"] if verification_data else []
    primary_qualification = qualifications[0] if qualifications else None
    return ok(
        {
            "course": course_to_out(db, course),
            "instructor": course_to_out(db, course).instructor,
            "instructor_verification": verification_data,
            "major": ", ".join(item["major"] for item in qualifications) if qualifications else (verification.major if verification else None),
            "degree_url": primary_qualification["degree_url"] if primary_qualification else (verification.degree_url if verification else None),
            "category": course.category,
        }
    )


@admin_router.patch("/{course_id}/approve")
def approve_course(course_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.admin))):
    course = db.get(Course, course_id)
    if not course or course.is_deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    course.status = CourseStatus.approved
    course.rejection_reason = None
    course.reviewed_by_id = current_user.id
    course.reviewed_at = _now()
    db.commit()
    db.refresh(course)
    return ok(course_to_out(db, course), "Course approved")


@admin_router.patch("/{course_id}/reject")
def reject_course(
    course_id: int,
    payload: CourseReject,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin)),
):
    course = db.get(Course, course_id)
    if not course or course.is_deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    course.status = CourseStatus.rejected
    course.rejection_reason = payload.admin_note
    course.reviewed_by_id = current_user.id
    course.reviewed_at = _now()
    db.commit()
    db.refresh(course)
    return ok(course_to_out(db, course), "Course rejected")


@router.get("/deletion-requests/pending")
def list_pending_deletion_requests(db: Session = Depends(get_db), _: User = Depends(require_roles(UserRole.admin))):
    requests = db.scalars(
        select(CourseDeletionRequest)
        .options(joinedload(CourseDeletionRequest.course).joinedload(Course.instructor), joinedload(CourseDeletionRequest.instructor))
        .where(CourseDeletionRequest.status == CourseDeletionRequestStatus.pending)
        .order_by(CourseDeletionRequest.created_at.desc())
    ).unique().all()
    return ok([CourseDeletionRequestOut.model_validate(request) for request in requests])


@router.patch("/deletion-requests/{request_id}/approve")
def approve_deletion_request(
    request_id: int,
    payload: CourseDeletionReview,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin)),
):
    request = db.get(CourseDeletionRequest, request_id)
    if not request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deletion request not found")
    if request.status != CourseDeletionRequestStatus.pending:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Deletion request already reviewed")
    course = db.get(Course, request.course_id)
    if not course or course.is_deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    course.is_deleted = True
    course.deleted_at = _now()
    course.status = CourseStatus.archived
    request.status = CourseDeletionRequestStatus.approved
    request.admin_response = payload.response
    request.reviewed_by_id = current_user.id
    request.reviewed_at = _now()
    db.commit()
    db.refresh(request)
    return ok(CourseDeletionRequestOut.model_validate(request), "Course deletion request approved")


@router.patch("/deletion-requests/{request_id}/reject")
def reject_deletion_request(
    request_id: int,
    payload: CourseDeletionReview,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin)),
):
    if not (payload.response or "").strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Admin response is required")
    request = db.get(CourseDeletionRequest, request_id)
    if not request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deletion request not found")
    if request.status != CourseDeletionRequestStatus.pending:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Deletion request already reviewed")
    request.status = CourseDeletionRequestStatus.rejected
    request.admin_response = payload.response
    request.reviewed_by_id = current_user.id
    request.reviewed_at = _now()
    db.commit()
    db.refresh(request)
    return ok(CourseDeletionRequestOut.model_validate(request), "Course deletion request rejected")
