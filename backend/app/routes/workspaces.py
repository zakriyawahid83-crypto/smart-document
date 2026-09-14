from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import List

from sqlalchemy.orm import Session

from app.database import get_db
from app.models.workspace import Workspace
from app.models.user import User
from app.utils.dependencies import get_current_user


router = APIRouter(
    prefix="/workspaces",
    tags=["Workspaces"]
)


# =========================================================
# SCHEMAS
# =========================================================

class WorkspaceCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: str | None = Field(default=None, max_length=500)


class WorkspaceResponse(BaseModel):
    id: int
    name: str
    description: str | None
    role: str


# =========================================================
# CREATE WORKSPACE
# =========================================================

@router.post("/", response_model=WorkspaceResponse)
def create_workspace(
    data: WorkspaceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    workspace = Workspace(
        name=data.name.strip(),
        owner_id=current_user.id,
    )

    db.add(workspace)
    db.commit()
    db.refresh(workspace)

    return {
        "id": workspace.id,
        "name": workspace.name,
        "description": data.description,
        "role": "owner",
    }


# =========================================================
# GET MY WORKSPACES
# =========================================================

@router.get("/", response_model=List[WorkspaceResponse])
def get_workspaces(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    workspaces = (
        db.query(Workspace)
        .filter(Workspace.owner_id == current_user.id)
        .order_by(Workspace.id.desc())
        .all()
    )

    return [
        {
            "id": workspace.id,
            "name": workspace.name,
            "description": None,
            "role": "owner",
        }
        for workspace in workspaces
    ]


# =========================================================
# GET SINGLE WORKSPACE
# =========================================================

@router.get("/{workspace_id}", response_model=WorkspaceResponse)
def get_workspace(
    workspace_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    workspace = (
        db.query(Workspace)
        .filter(
            Workspace.id == workspace_id,
            Workspace.owner_id == current_user.id,
        )
        .first()
    )

    if not workspace:
        raise HTTPException(
            status_code=404,
            detail="Workspace not found",
        )

    return {
        "id": workspace.id,
        "name": workspace.name,
        "description": None,
        "role": "owner",
    }


# =========================================================
# DELETE WORKSPACE
# =========================================================

@router.delete("/{workspace_id}")
def delete_workspace(
    workspace_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    workspace = (
        db.query(Workspace)
        .filter(
            Workspace.id == workspace_id,
            Workspace.owner_id == current_user.id,
        )
        .first()
    )

    if not workspace:
        raise HTTPException(
            status_code=404,
            detail="Workspace not found",
        )

    db.delete(workspace)
    db.commit()

    return {
        "message": "Workspace deleted successfully"
    }