from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import os
import shutil

from app.database import get_db
from app.models.document import Document
from app.models.document_version import DocumentVersion
from app.models.user import User
from app.utils.dependencies import get_current_user

router = APIRouter(
    prefix="/files",
    tags=["Files"]
)

UPLOAD_DIR = "uploads"

os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload/{document_id}")
def upload_file(
    document_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    document = db.query(Document).filter(
        Document.id == document_id
    ).first()

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    if document.owner_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Only document owner can upload files"
        )

    file_path = os.path.join(
        UPLOAD_DIR,
        file.filename
    )

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    version = DocumentVersion(
        document_id=document_id,
        version_number=(
            db.query(DocumentVersion)
            .filter(DocumentVersion.document_id == document_id)
            .count() + 1
        ),
        content=None,
        file_name=file.filename,
        file_path=file_path,
        created_by=current_user.id,
        user_id=current_user.id
    )

    db.add(version)
    db.commit()
    db.refresh(version)

    return {
        "message": "File uploaded successfully",
        "file_name": file.filename,
        "version_id": version.id
    }


@router.get("/download/{version_id}")
def download_file(
    version_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    version = db.query(DocumentVersion).filter(
        DocumentVersion.id == version_id
    ).first()

    if not version:
        raise HTTPException(
            status_code=404,
            detail="File version not found"
        )

    if not version.file_path:
        raise HTTPException(
            status_code=404,
            detail="No file attached to this version"
        )

    if not os.path.exists(version.file_path):
        raise HTTPException(
            status_code=404,
            detail="File not found on server"
        )

    return FileResponse(
        path=version.file_path,
        filename=version.file_name
    )