from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user, require_roles
from app.models.entities import Course, Enrollment, EnrollmentStatus, FinalTest, SystemSetting, User, UserRole
from app.schemas.common import ok
from app.schemas.settings import CourseSettingsOut, CourseSettingsPatch, SystemSettingOut, SystemSettingsPatch
from app.services.course_service import assert_course_owner
from app.services.settings_service import SYSTEM_SETTING_DEFINITIONS, ensure_system_settings, validate_setting_value

admin_router = APIRouter(prefix="/admin/settings", tags=["Admin Settings"])
course_router = APIRouter(prefix="/courses", tags=["Course Settings"])
router = APIRouter(prefix="/settings", tags=["Settings"])


def _course_settings_out(course: Course) -> CourseSettingsOut:
    return CourseSettingsOut(
        lesson_completion_percent=course.lesson_completion_percent,
        default_quiz_pass_score=course.default_quiz_pass_score,
        final_test_pass_score=course.final_test_pass_score,
        allow_quiz_retake=course.allow_quiz_retake,
        max_quiz_attempts=course.max_quiz_attempts,
        allow_final_test_retake=course.allow_final_test_retake,
        max_final_test_attempts=course.max_final_test_attempts,
        require_final_test=course.require_final_test,
    )


@admin_router.get("")
def list_system_settings(db: Session = Depends(get_db), _: User = Depends(require_roles(UserRole.admin))):
    ensure_system_settings(db)
    db.commit()
    settings = db.scalars(select(SystemSetting).order_by(SystemSetting.key)).all()
    return ok([SystemSettingOut.model_validate(item) for item in settings])


@admin_router.patch("")
def update_system_settings(
    payload: SystemSettingsPatch,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin)),
):
    ensure_system_settings(db)
    values = payload.values_by_key()
    if not values:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Khong co setting can cap nhat")
    valid_keys = set(SYSTEM_SETTING_DEFINITIONS)
    unknown_keys = sorted(set(values) - valid_keys)
    if unknown_keys:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Setting khong hop le: {', '.join(unknown_keys)}")

    settings_by_key = {item.key: item for item in db.scalars(select(SystemSetting).where(SystemSetting.key.in_(values))).all()}
    for key, value in values.items():
        setting = settings_by_key[key]
        setting.value = validate_setting_value(key, value, setting.value_type)
        setting.updated_by = current_user.id
    db.commit()
    settings = db.scalars(select(SystemSetting).order_by(SystemSetting.key)).all()
    return ok([SystemSettingOut.model_validate(item) for item in settings], "Da luu cai dat he thong")


@router.get("/upload-limits")
def get_upload_limits(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    ensure_system_settings(db)
    db.commit()
    visible_keys = [
        "max_video_size_mb",
        "max_document_size_mb",
        "max_thumbnail_size_mb",
        "max_verification_file_size_mb",
        "allowed_video_extensions",
        "allowed_document_extensions",
        "allowed_thumbnail_extensions",
        "allowed_verification_extensions",
    ]
    settings = db.scalars(select(SystemSetting).where(SystemSetting.key.in_(visible_keys)).order_by(SystemSetting.key)).all()
    return ok({item.key: item.value for item in settings})


@course_router.get("/{course_id}/settings")
def get_course_settings(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.student, UserRole.instructor, UserRole.admin)),
):
    course = db.get(Course, course_id)
    if not course or course.is_deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    if current_user.role == UserRole.instructor:
        assert_course_owner(course, current_user)
    if current_user.role == UserRole.student:
        enrolled = db.scalar(
            select(Enrollment).where(
                Enrollment.student_id == current_user.id,
                Enrollment.course_id == course.id,
                Enrollment.status.in_([EnrollmentStatus.active, EnrollmentStatus.completed]),
            )
        )
        if not enrolled:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Enrollment required")
    return ok(_course_settings_out(course))


@course_router.patch("/{course_id}/settings")
def update_course_settings(
    course_id: int,
    payload: CourseSettingsPatch,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.instructor, UserRole.admin)),
):
    course = db.get(Course, course_id)
    if not course or course.is_deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    if current_user.role == UserRole.instructor:
        assert_course_owner(course, current_user)

    values = payload.model_dump(exclude_unset=True)
    for field, value in values.items():
        setattr(course, field, value)
    if "final_test_pass_score" in values:
        db.query(FinalTest).filter(FinalTest.course_id == course.id).update(
            {FinalTest.passing_score_percent: course.final_test_pass_score}
        )
    db.commit()
    db.refresh(course)
    return ok(_course_settings_out(course), "Da luu cai dat khoa hoc")
