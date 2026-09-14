from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from  app.utils.dependencies import get_current_user
from app.models.permission import Permission
from app.models.user import User
from app.models.workspace import Workspace
from app.schemas.permission import PermissionCreate

router = APIRouter(
    prefix="/permissions",
    tags=["Permissions"]
)


@router.post("/")
def create_permission(
    data: PermissionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    workspace = db.query(Workspace).filter(
        Workspace.id == data.workspace_id,
        Workspace.owner_id == current_user.id
    ).first()

    if not workspace:
        raise HTTPException(
            status_code=404,
            detail="Workspace not found"
        )

    user = db.query(User).filter(
        User.id == data.user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    permission = Permission(
        workspace_id=data.workspace_id,
        user_id=data.user_id,
        role=data.role
    )

    db.add(permission)
    db.commit()
    db.refresh(permission)

    return permission


@router.get("/{workspace_id}")
def get_permissions(
    workspace_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    workspace = db.query(Workspace).filter(
        Workspace.id == workspace_id,
        Workspace.owner_id == current_user.id
    ).first()

    if not workspace:
        raise HTTPException(
            status_code=404,
            detail="Workspace not found"
        )

    return db.query(Permission).filter(
        Permission.workspace_id == workspace_id
    ).all()


@router.delete("/{permission_id}")
def delete_permission(
    permission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    permission = db.query(Permission).filter(
        Permission.id == permission_id
    ).first()

    if not permission:
        raise HTTPException(
            status_code=404,
            detail="Permission not found"
        )

    workspace = db.query(Workspace).filter(
        Workspace.id == permission.workspace_id,
        Workspace.owner_id == current_user.id
    ).first()

    if not workspace:
        raise HTTPException(
            status_code=403,
            detail="Not authorized"
        )

    db.delete(permission)
    db.commit()

    return {
        "message": "Permission deleted successfully"
    }
from pydantic import BaseModel
class PermissionCreate(BaseModel):
    document_id: int
    user_id: int
    role: str