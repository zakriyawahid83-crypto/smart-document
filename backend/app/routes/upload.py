from pathlib import Path
import uuid

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
)
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.document import Document
from app.models.user import User
from app.models.workspace import Workspace
from app.models.folder import Folder
from app.utils.dependencies import get_current_user


router = APIRouter(
    prefix="/upload",
    tags=["File Management"],
)


# =========================================================
# UPLOAD DIRECTORY
# =========================================================

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


# =========================================================
# ALLOWED FILE TYPES
# =========================================================

ALLOWED_EXTENSIONS = {
    ".pdf",
    ".doc",
    ".docx",
    ".xlsx",
    ".png",
    ".jpg",
    ".jpeg",
    ".txt",
}


# =========================================================
# CHECK WORKSPACE
# =========================================================

def check_workspace(
    workspace_id: int,
    current_user: User,
    db: Session,
):
    workspace = (
        db.query(Workspace)
        .filter(Workspace.id == workspace_id)
        .first()
    )

    if not workspace:
        raise HTTPException(
            status_code=404,
            detail="Workspace not found",
        )

    if workspace.owner_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Only workspace owner can manage files",
        )

    return workspace


# =========================================================
# GET USER DOCUMENT
# =========================================================

def get_user_document(
    document_id: int,
    current_user: User,
    db: Session,
):
    document = (
        db.query(Document)
        .filter(Document.id == document_id)
        .first()
    )

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found",
        )

    workspace = (
        db.query(Workspace)
        .filter(Workspace.id == document.workspace_id)
        .first()
    )

    if not workspace:
        raise HTTPException(
            status_code=404,
            detail="Workspace not found",
        )

    if workspace.owner_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to manage this file",
        )

    return document


# =========================================================
# UPLOAD DOCUMENT
# =========================================================

@router.post("/")
async def upload_document_file(
    workspace_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Check workspace
    workspace = check_workspace(
        workspace_id,
        current_user,
        db,
    )

    # Check filename
    original_filename = (file.filename or "").strip()

    if not original_filename:
        raise HTTPException(
            status_code=400,
            detail="Filename is required",
        )

    # Prevent path traversal
    original_filename = Path(original_filename).name

    # Get extension
    extension = Path(original_filename).suffix.lower()

    # Check extension
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=(
                "Only PDF, DOC, DOCX, XLSX, PNG, JPG, "
                "JPEG and TXT files are allowed"
            ),
        )

    # Generate unique physical filename
    unique_filename = f"{uuid.uuid4()}{extension}"

    file_path = UPLOAD_DIR / unique_filename

    # Save physical file
    try:
        with open(file_path, "wb") as buffer:
            while True:
                chunk = await file.read(1024 * 1024)

                if not chunk:
                    break

                buffer.write(chunk)

    except Exception as e:

        if file_path.exists():
            file_path.unlink()

        raise HTTPException(
            status_code=500,
            detail=f"Could not save file: {str(e)}",
        )

    finally:
        await file.close()

    # Create database document
    document = Document(
        workspace_id=workspace.id,
        owner_id=current_user.id,
        title=original_filename,
        content=f"Uploaded file: {original_filename}",
        file_name=original_filename,
        file_path=str(file_path),
    )

    # Save document
    try:
        db.add(document)
        db.commit()
        db.refresh(document)

    except Exception as e:

        db.rollback()

        if file_path.exists():
            file_path.unlink()

        raise HTTPException(
            status_code=500,
            detail=f"Could not save document: {str(e)}",
        )

    return {
        "message": "File uploaded successfully",
        "filename": original_filename,
        "saved_as": unique_filename,
        "document_id": document.id,
        "workspace_id": workspace.id,
        "file_path": str(file_path),
    }


# =========================================================
# LIST WORKSPACE FILES
# =========================================================

@router.get("/workspace/{workspace_id}")
async def list_workspace_files(
    workspace_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Check workspace
    workspace = check_workspace(
        workspace_id,
        current_user,
        db,
    )

    # Get documents
    documents = (
        db.query(Document)
        .filter(
            Document.workspace_id == workspace.id
        )
        .order_by(Document.id.desc())
        .all()
    )

    files = []

    for document in documents:

        files.append(
            {
                "id": document.id,
                "title": document.title,
                "file_name": document.file_name,
                "file_path": document.file_path,
                "workspace_id": document.workspace_id,
                "owner_id": document.owner_id,
                "folder_id": document.folder_id,
                "created_at": document.created_at,
                "download_url": (
                    f"/upload/{document.id}/download"
                ),
            }
        )

    return {
        "workspace_id": workspace.id,
        "count": len(files),
        "files": files,
    }


# =========================================================
# DOWNLOAD FILE
# =========================================================

@router.get("/{document_id}/download")
async def download_file(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    document = get_user_document(
        document_id,
        current_user,
        db,
    )

    if not document.file_path:
        raise HTTPException(
            status_code=404,
            detail="File path not found",
        )

    file_path = Path(document.file_path)

    if not file_path.exists():
        raise HTTPException(
            status_code=404,
            detail="Physical file not found",
        )

    return FileResponse(
        path=str(file_path),
        filename=(
            document.file_name
            or document.title
            or "download"
        ),
        media_type="application/octet-stream",
    )


# =========================================================
# RENAME FILE
# =========================================================

@router.put("/{document_id}/rename")
async def rename_file(
    document_id: int,
    new_name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    document = get_user_document(
        document_id,
        current_user,
        db,
    )

    new_name = new_name.strip()

    if not new_name:
        raise HTTPException(
            status_code=400,
            detail="New filename is required",
        )

    # Prevent path traversal
    new_name = Path(new_name).name

    old_name = (
        document.file_name
        or document.title
        or ""
    )

    old_extension = Path(old_name).suffix.lower()
    new_extension = Path(new_name).suffix.lower()

    # If extension isn't provided, keep old extension
    if not new_extension:
        new_name += old_extension
        new_extension = old_extension

    if new_extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=(
                "Only PDF, DOC, DOCX, XLSX, PNG, "
                "JPG, JPEG and TXT files are allowed"
            ),
        )

    document.title = new_name
    document.file_name = new_name

    try:
        db.commit()
        db.refresh(document)

    except Exception as e:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Could not rename file: {str(e)}",
        )

    return {
        "message": "File renamed successfully",
        "document_id": document.id,
        "old_name": old_name,
        "new_name": new_name,
    }


# =========================================================
# DELETE FILE
# =========================================================

@router.delete("/{document_id}")
async def delete_file(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    document = get_user_document(
        document_id,
        current_user,
        db,
    )

    # Delete physical file
    if document.file_path:

        file_path = Path(document.file_path)

        if file_path.exists():

            try:
                file_path.unlink()

            except Exception as e:

                raise HTTPException(
                    status_code=500,
                    detail=(
                        "Could not delete physical file: "
                        f"{str(e)}"
                    ),
                )

    # Delete database record
    try:
        db.delete(document)
        db.commit()

    except Exception as e:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Could not delete document: {str(e)}",
        )

    return {
        "message": "File deleted successfully",
        "document_id": document_id,
    }


# =========================================================
# MOVE FILE TO FOLDER
# =========================================================

@router.put("/{document_id}/move")
async def move_file(
    document_id: int,
    folder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    document = get_user_document(
        document_id,
        current_user,
        db,
    )

    folder = (
        db.query(Folder)
        .filter(Folder.id == folder_id)
        .first()
    )

    if not folder:
        raise HTTPException(
            status_code=404,
            detail="Folder not found",
        )

    if folder.workspace_id != document.workspace_id:
        raise HTTPException(
            status_code=400,
            detail="Folder does not belong to this workspace",
        )

    document.folder_id = folder.id

    try:
        db.commit()
        db.refresh(document)

    except Exception as e:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Could not move file: {str(e)}",
        )

    return {
        "message": "File moved successfully",
        "document_id": document.id,
        "folder_id": folder.id,
    }


# =========================================================
# MOVE FILE TO WORKSPACE ROOT
# =========================================================

@router.put("/{document_id}/move-root")
async def move_file_to_root(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    document = get_user_document(
        document_id,
        current_user,
        db,
    )

    document.folder_id = None

    try:
        db.commit()
        db.refresh(document)

    except Exception as e:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                f"Could not move file to root: {str(e)}"
            ),
        )

    return {
        "message": "File moved to workspace root",
        "document_id": document.id,
        "folder_id": None,
    }
