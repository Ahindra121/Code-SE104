from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_password_hash
from app.dependencies.auth import get_current_user, require_roles
from app.models.entities import User, UserRole
from app.schemas.common import ok
from app.schemas.user import UserOut, UserStatusUpdate, UserUpdate

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("")
def list_users(db: Session = Depends(get_db), _: User = Depends(require_roles(UserRole.admin))):
    users = db.scalars(select(User).order_by(User.created_at.desc())).all()
    return ok([UserOut.model_validate(user) for user in users])


@router.get("/{user_id}")
def get_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.admin and current_user.id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return ok(UserOut.model_validate(user))


@router.patch("/me")
def update_me(payload: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if payload.email and payload.email != current_user.email and db.scalar(select(User).where(User.email == payload.email)):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists")
    for field in ["email", "full_name", "phone"]:
        value = getattr(payload, field)
        if value is not None:
            setattr(current_user, field, value)
    if payload.password:
        current_user.hashed_password = get_password_hash(payload.password)
    db.commit()
    db.refresh(current_user)
    return ok(UserOut.model_validate(current_user), "Account updated")


@router.patch("/{user_id}/status")
def update_status(
    user_id: int,
    payload: UserStatusUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.admin)),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.is_active = payload.is_active
    db.commit()
    db.refresh(user)
    return ok(UserOut.model_validate(user), "User status updated")
