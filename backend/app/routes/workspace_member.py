from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.workspace_member import WorkspaceMember
from app.models.user import User
from app.models.workspace import Workspace
from app.utils.dependencies import get_current_user


router = APIRouter(
    prefix="/workspace-members",
    tags=["Workspace Members"]
)


@router.get("/")
def get_workspace_members(
    workspace_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == current_user.id
    ).first()

    if not member:
        raise HTTPException(
            status_code=403,
            detail="You are not a member of this workspace"
        )

    return db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id
    ).all()


@router.post("/")
def add_workspace_member(
    workspace_id: int,
    user_id: int,
    role: str = "viewer",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    workspace = db.query(Workspace).filter(
        Workspace.id == workspace_id
    ).first()

    if not workspace:
        raise HTTPException(
            status_code=404,
            detail="Workspace not found"
        )

    if workspace.owner_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Only workspace owner can add members"
        )

    if role not in ["editor", "viewer"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid role"
        )

    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    existing = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == user_id
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="User is already a member"
        )

    new_member = WorkspaceMember(
        workspace_id=workspace_id,
        user_id=user_id,
        role=role
    )

    db.add(new_member)
    db.commit()
    db.refresh(new_member)

    return new_member


@router.delete("/{member_id}")
def remove_workspace_member(
    member_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.id == member_id
    ).first()

    if not member:
        raise HTTPException(
            status_code=404,
            detail="Member not found"
        )

    workspace = db.query(Workspace).filter(
        Workspace.id == member.workspace_id
    ).first()

    if not workspace:
        raise HTTPException(
            status_code=404,
            detail="Workspace not found"
        )

    if workspace.owner_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Only workspace owner can remove members"
        )

    db.delete(member)
    db.commit()

    return {
        "message": "Member removed successfully"
    }