from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.utils.dependencies import get_current_user
from app.models.notification import Notification


router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"]
)


# Get My Notifications
@router.get("/")
def get_notifications(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    notifications = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .all()
    )

    return notifications


# Create Notification
@router.post("/")
def create_notification(
    user_id: int,
    notification_type: str,
    message: str,
    document_id: int | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    notification = Notification(
        user_id=user_id,
        type=notification_type,
        message=message,
        document_id=document_id,
        is_read=False
    )

    db.add(notification)
    db.commit()
    db.refresh(notification)

    return {
        "message": "Notification created successfully",
        "notification_id": notification.id
    }


# Mark Notification as Read
@router.put("/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    notification = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.user_id == current_user.id
        )
        .first()
    )

    if not notification:
        raise HTTPException(
            status_code=404,
            detail="Notification not found"
        )

    notification.is_read = True

    db.commit()
    db.refresh(notification)

    return {
        "message": "Notification marked as read",
        "notification_id": notification.id
    }


# Delete Notification
@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    notification = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.user_id == current_user.id
        )
        .first()
    )

    if not notification:
        raise HTTPException(
            status_code=404,
            detail="Notification not found"
        )

    db.delete(notification)
    db.commit()

    return {
        "message": "Notification deleted successfully"
    }
