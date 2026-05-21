from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import create_access_token, get_password_hash, verify_password
from app.dependencies.auth import get_current_user
from app.models.entities import ReactivationRequest, ReactivationRequestStatus, User
from app.schemas.common import ok
from app.schemas.user import LoginRequest, ReactivationRequestCreate, ReactivationRequestOut, TokenResponse, UserCreate, UserOut

router = APIRouter(prefix="/auth", tags=["Auth"])

SOFT_DELETE_RETENTION_DAYS = 30


def _deletion_retention_expired(user: User) -> bool:
    if not user.deleted_at:
        return False
    deleted_at = user.deleted_at.replace(tzinfo=UTC) if user.deleted_at.tzinfo is None else user.deleted_at
    return deleted_at <= datetime.now(UTC) - timedelta(days=SOFT_DELETE_RETENTION_DAYS)


@router.post("/register")
def register(payload: UserCreate, db: Session = Depends(get_db)):
    email = str(payload.email).lower()
    username = payload.username.strip()

    if db.scalar(select(User).where(func.lower(User.email) == email)):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email đã tồn tại")
    if db.scalar(select(User).where(func.lower(User.username) == username.lower())):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Tên tài khoản đã tồn tại")

    user = User(
        email=email,
        username=username,
        full_name=payload.full_name,
        phone=payload.phone,
        hashed_password=get_password_hash(payload.password),
        role=payload.role,
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        message = str(exc.orig).lower()
        if "email" in message:
            detail = "Email đã tồn tại"
        elif "username" in message:
            detail = "Tên tài khoản đã tồn tại"
        else:
            detail = "Email hoặc tên tài khoản đã tồn tại"
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=detail) from exc
    db.refresh(user)
    return ok(UserOut.model_validate(user), "Đăng ký thành công")


@router.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(or_(User.username == payload.username, User.email == payload.username)))
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Tên tài khoản/email hoặc mật khẩu không đúng")
    if not user.is_active:
        if user.admin_locked_at:
            details = ["Tài khoản đã bị admin vô hiệu hóa và cần được duyệt để mở lại"]
            if user.admin_locked_reason:
                details.append(f"Lý do vô hiệu hóa: {user.admin_locked_reason}")
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=". ".join(details))
        if user.deleted_at:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tài khoản đang chờ xóa và có thể mở lại")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tài khoản đã bị vô hiệu hóa và có thể mở lại")
    token = create_access_token(str(user.id))
    return ok(TokenResponse(access_token=token, user=UserOut.model_validate(user)), "Đăng nhập thành công")


@router.post("/reactivate")
def reactivate(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(or_(User.username == payload.username, User.email == payload.username)))
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Tên tài khoản/email hoặc mật khẩu không đúng")
    if _deletion_retention_expired(user):
        raise HTTPException(status_code=status.HTTP_410_GONE, detail="Tài khoản đã quá thời hạn chờ xóa")
    if user.admin_locked_at:
        details = ["Cần admin duyệt để mở lại tài khoản này"]
        if user.admin_locked_reason:
            details.append(f"Lý do vô hiệu hóa: {user.admin_locked_reason}")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=". ".join(details))

    user.is_active = True
    user.deleted_at = None
    db.commit()
    db.refresh(user)

    token = create_access_token(str(user.id))
    return ok(TokenResponse(access_token=token, user=UserOut.model_validate(user)), "Đã mở lại tài khoản thành công")


@router.post("/reactivation-requests")
def create_reactivation_request(payload: ReactivationRequestCreate, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(or_(User.username == payload.username, User.email == payload.username)))
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Tên tài khoản/email hoặc mật khẩu không đúng")
    if user.is_active and not user.deleted_at:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tài khoản đang hoạt động")
    if _deletion_retention_expired(user):
        raise HTTPException(status_code=status.HTTP_410_GONE, detail="Tài khoản đã quá thời hạn chờ xóa")
    if not user.admin_locked_at:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tài khoản này có thể mở lại mà không cần admin duyệt")

    existing_request = db.scalar(
        select(ReactivationRequest).where(
            ReactivationRequest.user_id == user.id,
            ReactivationRequest.status == ReactivationRequestStatus.pending,
        )
    )
    if existing_request:
        existing_request.reason = payload.reason
        db.commit()
        db.refresh(existing_request)
        return ok(ReactivationRequestOut.model_validate(existing_request), "Đã cập nhật yêu cầu mở lại tài khoản")

    request = ReactivationRequest(user_id=user.id, reason=payload.reason, status=ReactivationRequestStatus.pending)
    db.add(request)
    db.commit()
    db.refresh(request)
    return ok(ReactivationRequestOut.model_validate(request), "Đã gửi yêu cầu mở lại tài khoản")


@router.get("/me")
def me(current_user: User = Depends(get_current_user)):
    return ok(UserOut.model_validate(current_user))
