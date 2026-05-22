from datetime import UTC, datetime

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import RedirectResponse
from sqlalchemy import or_, select
from sqlalchemy.orm import Session, joinedload

from app.core.config import settings
from app.core.database import get_db
from app.dependencies.auth import get_current_user, require_roles
from app.models.entities import (
    InstructorQualification,
    InstructorQualificationStatus,
    InstructorVerification,
    InstructorVerificationStatus,
    User,
    UserRole,
)
from app.schemas.common import ok
from app.schemas.instructor_verification import InstructorVerificationOut, InstructorVerificationReject
from app.services.settings_service import get_extensions_setting, get_int_setting
from app.services.storage_service import create_signed_url, upload_file_to_storage

router = APIRouter(prefix="/instructor-verifications", tags=["Instructor Verifications"])


def _now() -> datetime:
    return datetime.now(UTC)


async def _save_verification_file(db: Session, file: UploadFile, folder: str) -> str:
    max_size_mb = get_int_setting(db, "max_verification_file_size_mb")
    path, _, _ = await upload_file_to_storage(
        file=file,
        folder=folder,
        allowed_extensions=get_extensions_setting(db, "allowed_verification_extensions"),
        max_size=max_size_mb * 1024 * 1024,
        invalid_message="Dinh dang file xac minh khong duoc ho tro",
        size_message=f"Moi file xac minh vuot qua dung luong toi da {max_size_mb}MB",
        bucket=settings.supabase_verification_files_bucket,
        public=False,
    )
    return path


def _can_view_verification_file(user: User, verification: InstructorVerification) -> bool:
    return user.role == UserRole.admin or verification.user_id == user.id


def _has_pending_personal_changes(verification: InstructorVerification) -> bool:
    return any(
        [
            verification.pending_full_name,
            verification.pending_cccd_number,
            verification.pending_cccd_front_url,
            verification.pending_cccd_back_url,
        ]
    )


@router.post("")
async def submit_verification(
    full_name: str = Form(...),
    cccd_number: str = Form(...),
    major: str | None = Form(default=None),
    university_name: str | None = Form(default=None),
    graduation_year: int | None = Form(default=None),
    cccd_front_file: UploadFile | None = File(default=None),
    cccd_back_file: UploadFile | None = File(default=None),
    degree_file: UploadFile | None = File(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    verification = db.scalars(
        select(InstructorVerification)
        .options(joinedload(InstructorVerification.qualifications))
        .where(InstructorVerification.user_id == current_user.id)
    ).unique().first()
    is_existing_approved = bool(verification and verification.status == InstructorVerificationStatus.approved)
    upload_dir = f"verifications/user_{current_user.id}"

    if not verification:
        if not cccd_front_file or not cccd_back_file or not degree_file:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Vui long upload day du CCCD va bang cap")
        if not all([(major or "").strip(), (university_name or "").strip(), graduation_year]):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Vui long nhap day du thong tin bang cap")

        cccd_front_url = await _save_verification_file(db, cccd_front_file, upload_dir)
        cccd_back_url = await _save_verification_file(db, cccd_back_file, upload_dir)
        degree_url = await _save_verification_file(db, degree_file, upload_dir)

        verification = InstructorVerification(
            user_id=current_user.id,
            full_name=full_name.strip(),
            cccd_number=cccd_number.strip(),
            major=(major or "").strip(),
            university_name=(university_name or "").strip(),
            graduation_year=graduation_year or 0,
            cccd_front_url=cccd_front_url,
            cccd_back_url=cccd_back_url,
            degree_url=degree_url,
            status=InstructorVerificationStatus.pending,
            admin_note=None,
            reviewed_by_id=None,
            reviewed_at=None,
        )
        db.add(verification)
        db.flush()
        db.add(
            InstructorQualification(
                verification_id=verification.id,
                major=(major or "").strip(),
                university_name=(university_name or "").strip(),
                graduation_year=graduation_year or 0,
                degree_url=degree_url,
                status=InstructorQualificationStatus.pending,
            )
        )
        db.commit()
        db.refresh(verification)
        return ok(InstructorVerificationOut.model_validate(verification), "Da gui ho so xac minh giang vien")

    if not all([full_name.strip(), cccd_number.strip()]):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Vui long nhap day du thong tin xac minh")

    cccd_front_url = await _save_verification_file(db, cccd_front_file, upload_dir) if cccd_front_file else None
    cccd_back_url = await _save_verification_file(db, cccd_back_file, upload_dir) if cccd_back_file else None

    if is_existing_approved:
        new_full_name = full_name.strip()
        new_cccd_number = cccd_number.strip()
        verification.pending_full_name = new_full_name if new_full_name != verification.full_name else None
        verification.pending_cccd_number = new_cccd_number if new_cccd_number != verification.cccd_number else None
        if cccd_front_url:
            verification.pending_cccd_front_url = cccd_front_url
        if cccd_back_url:
            verification.pending_cccd_back_url = cccd_back_url
        verification.has_pending_changes = _has_pending_personal_changes(verification)
    else:
        verification.full_name = full_name.strip()
        verification.cccd_number = cccd_number.strip()
        if cccd_front_url:
            verification.cccd_front_url = cccd_front_url
        if cccd_back_url:
            verification.cccd_back_url = cccd_back_url
        verification.status = InstructorVerificationStatus.pending

    if degree_file:
        if not all([(major or "").strip(), (university_name or "").strip(), graduation_year]):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Vui long nhap day du thong tin bang cap")
        degree_url = await _save_verification_file(db, degree_file, upload_dir)
        qualification_status = (
            InstructorQualificationStatus.pending if is_existing_approved else InstructorQualificationStatus.pending
        )
        db.add(
            InstructorQualification(
                verification_id=verification.id,
                major=(major or "").strip(),
                university_name=(university_name or "").strip(),
                graduation_year=graduation_year or 0,
                degree_url=degree_url,
                status=qualification_status,
            )
        )
        if not is_existing_approved and not verification.degree_url:
            verification.degree_url = degree_url
            verification.major = (major or "").strip()
            verification.university_name = (university_name or "").strip()
            verification.graduation_year = graduation_year or 0

    verification.admin_note = None if verification.status == InstructorVerificationStatus.pending else verification.admin_note
    verification.reviewed_by_id = None if verification.status == InstructorVerificationStatus.pending else verification.reviewed_by_id
    verification.reviewed_at = None if verification.status == InstructorVerificationStatus.pending else verification.reviewed_at

    db.commit()
    db.refresh(verification)
    return ok(InstructorVerificationOut.model_validate(verification), "Da gui thay doi xac minh cho admin duyet")


@router.get("/me")
def get_my_verification(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    verification = db.scalars(
        select(InstructorVerification)
        .options(joinedload(InstructorVerification.qualifications))
        .where(InstructorVerification.user_id == current_user.id)
    ).unique().first()
    return ok(InstructorVerificationOut.model_validate(verification) if verification else None)


@router.get("/{verification_id}/files/{file_kind}")
def view_verification_file(
    verification_id: int,
    file_kind: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    verification = db.get(InstructorVerification, verification_id)
    if not verification:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Khong tim thay ho so xac minh")
    if not _can_view_verification_file(current_user, verification):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Ban khong co quyen xem file xac minh nay")

    url_by_kind = {
        "cccd-front": verification.cccd_front_url,
        "cccd-back": verification.cccd_back_url,
        "cccd-front-pending": verification.pending_cccd_front_url,
        "cccd-back-pending": verification.pending_cccd_back_url,
        "degree": verification.degree_url,
    }
    url = url_by_kind.get(file_kind)
    if not url:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Khong tim thay file xac minh")
    return RedirectResponse(create_signed_url(url, settings.supabase_verification_files_bucket, expires_in=300))


@router.get("/{verification_id}/qualification-files/{qualification_id}")
def view_qualification_file(
    verification_id: int,
    qualification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    verification = db.get(InstructorVerification, verification_id)
    if not verification:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Khong tim thay ho so xac minh")
    if not _can_view_verification_file(current_user, verification):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Ban khong co quyen xem file xac minh nay")
    qualification = db.get(InstructorQualification, qualification_id)
    if not qualification or qualification.verification_id != verification.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Khong tim thay bang cap")
    if not qualification.degree_url:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Khong tim thay file bang cap")
    return RedirectResponse(create_signed_url(qualification.degree_url, settings.supabase_verification_files_bucket, expires_in=300))


admin_router = APIRouter(prefix="/admin/instructor-verifications", tags=["Admin Instructor Verifications"])


@admin_router.get("")
def list_verifications(
    status: InstructorVerificationStatus | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.admin)),
):
    query = (
        select(InstructorVerification)
        .options(joinedload(InstructorVerification.user), joinedload(InstructorVerification.qualifications))
        .outerjoin(InstructorQualification)
        .order_by(InstructorVerification.created_at.desc())
    )
    if status:
        query = query.where(
            or_(
                InstructorVerification.status == status,
                InstructorVerification.has_pending_changes.is_(True),
                InstructorVerification.pending_full_name.is_not(None),
                InstructorVerification.pending_cccd_number.is_not(None),
                InstructorVerification.pending_cccd_front_url.is_not(None),
                InstructorVerification.pending_cccd_back_url.is_not(None),
                InstructorQualification.status == InstructorQualificationStatus.pending,
            )
        )
    verifications = db.scalars(query).unique().all()
    return ok([InstructorVerificationOut.model_validate(item) for item in verifications])


@admin_router.patch("/{verification_id}/approve")
def approve_verification(
    verification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin)),
):
    verification = db.get(InstructorVerification, verification_id)
    if not verification:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Khong tim thay ho so xac minh")
    if verification.has_pending_changes or _has_pending_personal_changes(verification):
        verification.full_name = verification.pending_full_name or verification.full_name
        verification.cccd_number = verification.pending_cccd_number or verification.cccd_number
        verification.cccd_front_url = verification.pending_cccd_front_url or verification.cccd_front_url
        verification.cccd_back_url = verification.pending_cccd_back_url or verification.cccd_back_url
        verification.pending_full_name = None
        verification.pending_cccd_number = None
        verification.pending_cccd_front_url = None
        verification.pending_cccd_back_url = None
        verification.has_pending_changes = False
    for qualification in verification.qualifications:
        if qualification.status == InstructorQualificationStatus.pending:
            qualification.status = InstructorQualificationStatus.approved
            qualification.admin_note = None
            qualification.reviewed_by_id = current_user.id
            qualification.reviewed_at = _now()
    approved_qualification = next((q for q in verification.qualifications if q.status == InstructorQualificationStatus.approved), None)
    if approved_qualification:
        verification.major = approved_qualification.major
        verification.university_name = approved_qualification.university_name
        verification.graduation_year = approved_qualification.graduation_year
        verification.degree_url = approved_qualification.degree_url
    verification.status = InstructorVerificationStatus.approved
    verification.admin_note = None
    verification.reviewed_by_id = current_user.id
    verification.reviewed_at = _now()
    if verification.user and verification.user.role != UserRole.admin:
        verification.user.role = UserRole.instructor
    db.commit()
    db.refresh(verification)
    return ok(InstructorVerificationOut.model_validate(verification), "Da duyet ho so giang vien")


@admin_router.patch("/{verification_id}/reject")
def reject_verification(
    verification_id: int,
    payload: InstructorVerificationReject,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin)),
):
    verification = db.get(InstructorVerification, verification_id)
    if not verification:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Khong tim thay ho so xac minh")
    if verification.status != InstructorVerificationStatus.approved:
        verification.status = InstructorVerificationStatus.rejected
    verification.pending_full_name = None
    verification.pending_cccd_number = None
    verification.pending_cccd_front_url = None
    verification.pending_cccd_back_url = None
    verification.has_pending_changes = False
    for qualification in verification.qualifications:
        if qualification.status == InstructorQualificationStatus.pending:
            qualification.status = InstructorQualificationStatus.rejected
            qualification.admin_note = payload.admin_note
            qualification.reviewed_by_id = current_user.id
            qualification.reviewed_at = _now()
    verification.admin_note = payload.admin_note
    verification.reviewed_by_id = current_user.id
    verification.reviewed_at = _now()
    db.commit()
    db.refresh(verification)
    return ok(InstructorVerificationOut.model_validate(verification), "Da tu choi ho so giang vien")
