from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.document import Document
from app.models.document_version import DocumentVersion
from app.models.user import User
from app.utils.dependencies import get_current_user

router = APIRouter(
    prefix="/document-versions",
    tags=["Document Versions"]
)


@router.post("/")
def create_version(
    document_id: int,
    content: str | None = None,
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
            detail="Only document owner can create versions"
        )

    last_version = db.query(DocumentVersion).filter(
        DocumentVersion.document_id == document_id
    ).order_by(
        DocumentVersion.version_number.desc()
    ).first()

    version_number = 1

    if last_version:
        version_number = last_version.version_number + 1

    version = DocumentVersion(
        document_id=document_id,
        version_number=version_number,
        content=content,
        created_by=current_user.id,
        user_id=current_user.id
    )

    db.add(version)
    db.commit()
    db.refresh(version)

    return version


@router.get("/{document_id}")
def get_versions(
    document_id: int,
    content: str | None = None,
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
            detail="Only document owner can create versions"
        )

    last_version = db.query(DocumentVersion).filter(
        DocumentVersion.document_id == document_id
    ).order_by(
        DocumentVersion.version_number.desc()
    ).first()

    version_number = 1

    if last_version:
        version_number = last_version.version_number + 1

    version = DocumentVersion(
        document_id=document_id,
        title=document.title,              # ✅ FIX
        version_number=version_number,
        content=content,
        created_by=current_user.id,
        user_id=current_user.id
    )

    db.add(version)
    db.commit()
    db.refresh(version)

    return version
    return db.query(DocumentVersion).filter(
        DocumentVersion.document_id == document_id
    ).order_by(
        DocumentVersion.version_number.desc()
    ).all()


@router.get("/{document_id}/{version_number}")
def get_version(
    document_id: int,
    version_number: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    version = db.query(DocumentVersion).filter(
        DocumentVersion.document_id == document_id,
        DocumentVersion.version_number == version_number
    ).first()

    if not version:
        raise HTTPException(
            status_code=404,
            detail="Version not found"
        )

    return version