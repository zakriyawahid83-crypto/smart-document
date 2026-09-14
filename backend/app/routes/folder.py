from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.folder import Folder
from app.models.user import User
from app.models.workspace import Workspace
from app.models.workspace_member import WorkspaceMember
from app.utils.dependencies import get_current_user


router = APIRouter(
    prefix="/folders",
    tags=["Folders"]
)


def check_workspace_access(
    workspace_id: int,
    current_user: User,
    db: Session
):
    """
    Check whether the current user has access
    to the workspace.
    """

    workspace = (
        db.query(Workspace)
        .filter(Workspace.id == workspace_id)
        .first()
    )

    if not workspace:
        raise HTTPException(
            status_code=404,
            detail="Workspace not found"
        )

    # Workspace owner
    if workspace.owner_id == current_user.id:
        return workspace

    # Workspace member
    member = (
        db.query(WorkspaceMember)
        .filter(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == current_user.id
        )
        .first()
    )

    if not member:
        raise HTTPException(
            status_code=403,
            detail="You are not a member of this workspace"
        )

    return workspace


# =========================================================
# CREATE FOLDER
# =========================================================

@router.post("/")
def create_folder(
    workspace_id: int,
    name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_workspace_access(
        workspace_id,
        current_user,
        db
    )

    clean_name = name.strip()

    if not clean_name:
        raise HTTPException(
            status_code=400,
            detail="Folder name cannot be empty"
        )

    existing_folder = (
        db.query(Folder)
        .filter(
            Folder.workspace_id == workspace_id,
            Folder.name == clean_name
        )
        .first()
    )

    if existing_folder:
        raise HTTPException(
            status_code=400,
            detail="A folder with this name already exists"
        )

    folder = Folder(
        name=clean_name,
        workspace_id=workspace_id,
        owner_id=current_user.id
    )

    db.add(folder)
    db.commit()
    db.refresh(folder)

    return folder


# =========================================================
# GET ALL FOLDERS
# =========================================================

@router.get("/")
def get_folders(
    workspace_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_workspace_access(
        workspace_id,
        current_user,
        db
    )

    folders = (
        db.query(Folder)
        .filter(
            Folder.workspace_id == workspace_id
        )
        .order_by(
            Folder.id.desc()
        )
        .all()
    )

    return folders


# =========================================================
# GET SINGLE FOLDER
# =========================================================

@router.get("/{folder_id}")
def get_folder(
    folder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    folder = (
        db.query(Folder)
        .filter(Folder.id == folder_id)
        .first()
    )

    if not folder:
        raise HTTPException(
            status_code=404,
            detail="Folder not found"
        )

    check_workspace_access(
        folder.workspace_id,
        current_user,
        db
    )

    return folder


# =========================================================
# UPDATE / RENAME FOLDER
# =========================================================

@router.put("/{folder_id}")
def update_folder(
    folder_id: int,
    name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    folder = (
        db.query(Folder)
        .filter(Folder.id == folder_id)
        .first()
    )

    if not folder:
        raise HTTPException(
            status_code=404,
            detail="Folder not found"
        )

    if folder.owner_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Only folder owner can update this folder"
        )

    clean_name = name.strip()

    if not clean_name:
        raise HTTPException(
            status_code=400,
            detail="Folder name cannot be empty"
        )

    existing_folder = (
        db.query(Folder)
        .filter(
            Folder.workspace_id == folder.workspace_id,
            Folder.name == clean_name,
            Folder.id != folder.id
        )
        .first()
    )

    if existing_folder:
        raise HTTPException(
            status_code=400,
            detail="A folder with this name already exists"
        )

    folder.name = clean_name

    db.commit()
    db.refresh(folder)

    return folder


# =========================================================
# DELETE FOLDER
# =========================================================

@router.delete("/{folder_id}")
def delete_folder(
    folder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    folder = (
        db.query(Folder)
        .filter(Folder.id == folder_id)
        .first()
    )

    if not folder:
        raise HTTPException(
            status_code=404,
            detail="Folder not found"
        )

    if folder.owner_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Only folder owner can delete this folder"
        )

    db.delete(folder)
    db.commit()

    return {
        "message": "Folder deleted successfully"
    }