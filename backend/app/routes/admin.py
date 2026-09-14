from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.utils.dependencies import get_current_user

router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)


def admin_required(
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )

    return current_user


@router.get("/users")
def get_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required)
):
    return db.query(User).all()


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required)
):
    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    if user.id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="Admin cannot delete itself"
        )

    db.delete(user)
    db.commit()

    return {
        "message": "User deleted successfully"
    }