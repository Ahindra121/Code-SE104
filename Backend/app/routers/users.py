from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_password_hash, verify_password
from app.dependencies.auth import get_current_user, require_roles
from app.models.entities import Course, ReactivationRequest, ReactivationRequestStatus, User, UserRole
from app.schemas.common import ok
from app.schemas.user import ReactivationRequestOut, ReactivationReview, UserOut, UserStatusUpdate, UserUpdate

router = APIRouter(prefix="/users", tags=["Users"])

SOFT_DELETE_RETENTION_DAYS = 30


def _now() -> datetime:
    return datetime.now(UTC)


def _retention_cutoff() -> datetime:
    return _now() - timedelta(days=SOFT_DELETE_RETENTION_DAYS)


def _normalize_datetime(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value


def _is_hard_delete_eligible(user: User) -> bool:
    return bool(user.deleted_at and _normalize_datetime(user.deleted_at) <= _retention_cutoff())


def _soft_delete_user(user: User) -> None:
    user.is_active = False
    user.deleted_at = _now()


def _hard_delete_user(db: Session, user: User) -> None:
    instructor_courses = db.scalars(select(Course).where(Course.instructor_id == user.id)).all()
    for course in instructor_courses:
        db.delete(course)
    db.flush()
    db.delete(user)


def _purge_expired_deleted_users(db: Session) -> int:
    cutoff = _retention_cutoff()
    expired_users = db.scalars(select(User).where(User.deleted_at.is_not(None), User.deleted_at <= cutoff)).all()
    for user in expired_users:
        _hard_delete_user(db, user)
    if expired_users:
        db.commit()
    return len(expired_users)


@router.get("")
def list_users(db: Session = Depends(get_db), _: User = Depends(require_roles(UserRole.admin))):
    _purge_expired_deleted_users(db)
    users = db.scalars(select(User).order_by(User.created_at.desc())).all()
    return ok([UserOut.model_validate(user) for user in users])


@router.patch("/me/deactivate")
def deactivate_me(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    current_user.is_active = False
    current_user.admin_locked_at = None
    current_user.admin_locked_reason = None
    db.commit()
    return ok(None, "Đã vô hiệu hóa tài khoản")


@router.delete("/me")
def delete_me(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _soft_delete_user(current_user)
    current_user.admin_locked_at = None
    current_user.admin_locked_reason = None
    db.commit()
    return ok(None, "Tài khoản đã được đưa vào danh sách chờ xóa")


@router.post("/purge-deleted")
def purge_deleted_users(db: Session = Depends(get_db), _: User = Depends(require_roles(UserRole.admin))):
    deleted_count = _purge_expired_deleted_users(db)
    return ok({"deleted_count": deleted_count}, "Đã dọn các tài khoản chờ xóa quá hạn")


@router.get("/reactivation-requests")
def list_reactivation_requests(db: Session = Depends(get_db), _: User = Depends(require_roles(UserRole.admin))):
    requests = db.scalars(
        select(ReactivationRequest)
        .where(ReactivationRequest.status == ReactivationRequestStatus.pending)
        .order_by(ReactivationRequest.created_at.desc())
    ).all()
    return ok([ReactivationRequestOut.model_validate(request) for request in requests])


@router.patch("/reactivation-requests/{request_id}/approve")
def approve_reactivation_request(
    request_id: int,
    payload: ReactivationReview,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin)),
):
    request = db.get(ReactivationRequest, request_id)
    if not request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy yêu cầu mở lại tài khoản")
    if request.status != ReactivationRequestStatus.pending:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Yêu cầu mở lại tài khoản đã được xử lý")
    user = db.get(User, request.user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy người dùng")
    user.is_active = True
    user.deleted_at = None
    user.admin_locked_at = None
    user.admin_locked_reason = None
    request.status = ReactivationRequestStatus.approved
    request.admin_response = payload.response or "Yêu cầu mở lại tài khoản của bạn đã được duyệt"
    request.reviewed_by_id = current_user.id
    request.reviewed_at = _now()
    db.commit()
    db.refresh(request)
    return ok(ReactivationRequestOut.model_validate(request), "Đã duyệt yêu cầu mở lại tài khoản")


@router.patch("/reactivation-requests/{request_id}/reject")
def reject_reactivation_request(
    request_id: int,
    payload: ReactivationReview,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin)),
):
    if not (payload.response or "").strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Vui lòng nhập lý do từ chối")
    request = db.get(ReactivationRequest, request_id)
    if not request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy yêu cầu mở lại tài khoản")
    if request.status != ReactivationRequestStatus.pending:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Yêu cầu mở lại tài khoản đã được xử lý")
    request.status = ReactivationRequestStatus.rejected
    request.admin_response = payload.response
    user = db.get(User, request.user_id)
    if user and user.admin_locked_at:
        user.admin_locked_reason = payload.response
    request.reviewed_by_id = current_user.id
    request.reviewed_at = _now()
    db.commit()
    db.refresh(request)
    return ok(ReactivationRequestOut.model_validate(request), "Đã từ chối yêu cầu mở lại tài khoản")


@router.get("/{user_id}")
def get_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.admin and current_user.id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bạn không có quyền thực hiện thao tác này")
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy người dùng")
    return ok(UserOut.model_validate(user))


@router.patch("/me")
def update_me(payload: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if payload.email and payload.email != current_user.email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không thể thay đổi email")
    for field in ["full_name", "phone", "bio"]:
        value = getattr(payload, field)
        if value is not None:
            setattr(current_user, field, value)
    if payload.password:
        if not payload.current_password or not verify_password(payload.current_password, current_user.hashed_password):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Mật khẩu hiện tại không đúng")
        current_user.hashed_password = get_password_hash(payload.password)
    db.commit()
    db.refresh(current_user)
    return ok(UserOut.model_validate(current_user), "Đã cập nhật tài khoản")


@router.patch("/{user_id}/status")
def update_status(
    user_id: int,
    payload: UserStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin)),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy người dùng")
    if user.id == current_user.id and not payload.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Admin không thể tự vô hiệu hóa tài khoản của mình")
    if not payload.is_active and not (payload.reason or "").strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Vui lòng nhập lý do vô hiệu hóa tài khoản")
    user.is_active = payload.is_active
    if payload.is_active:
        user.deleted_at = None
        user.admin_locked_at = None
        user.admin_locked_reason = None
    else:
        user.admin_locked_at = _now()
        user.admin_locked_reason = payload.reason
    db.commit()
    db.refresh(user)
    return ok(UserOut.model_validate(user), "Đã cập nhật trạng thái tài khoản")


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin)),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy người dùng")
    if user.id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Admin không thể tự xóa tài khoản của mình")
    if user.is_active and not user.admin_locked_at:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Chỉ có thể xóa tài khoản đã được vô hiệu hóa")
    _soft_delete_user(user)
    user.admin_locked_at = _now()
    user.admin_locked_reason = "Admin đã đưa tài khoản này vào danh sách chờ xóa"
    db.commit()
    db.refresh(user)
    return ok(UserOut.model_validate(user), "Tài khoản đã được đưa vào danh sách chờ xóa")


@router.delete("/{user_id}/hard")
def hard_delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin)),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy người dùng")
    if user.id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Admin không thể tự xóa tài khoản của mình")
    if not _is_hard_delete_eligible(user):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tài khoản chưa đủ điều kiện để xóa vĩnh viễn")
    _hard_delete_user(db, user)
    db.commit()
    return ok(None, "Đã xóa vĩnh viễn tài khoản")
