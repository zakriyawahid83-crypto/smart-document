from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_, func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.document import Document
from app.models.document_version import DocumentVersion
from app.models.permission import Permission
from app.models.user import User
from app.models.workspace import Workspace
from app.models.workspace_member import WorkspaceMember
from app.models.folder import Folder
from app.utils.dependencies import get_current_user


router = APIRouter(
    prefix="/documents",
    tags=["Documents"]
)


# =========================================================
# PERMISSION CHECK
# =========================================================

def check_permission(
    document: Document,
    current_user: User,
    required_permission: str,
    db: Session
):
    # Document owner has full access
    if document.owner_id == current_user.id:
        return True

    permission = db.query(Permission).filter(
        Permission.document_id == document.id,
        Permission.user_id == current_user.id
    ).first()

    if not permission:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission"
        )

    # Owner role
    if permission.role == "owner":
        return True

    # Editor
    if permission.role == "editor":
        if required_permission in ["view", "edit"]:
            return True

    # Viewer
    if permission.role == "viewer":
        if required_permission == "view":
            return True

    # Commenter can view
    if permission.role == "commenter":
        if required_permission == "view":
            return True

    raise HTTPException(
        status_code=403,
        detail=f"You do not have {required_permission} permission"
    )


# =========================================================
# WORKSPACE MEMBERSHIP CHECK
# =========================================================

def check_workspace_membership(
    workspace_id: int,
    current_user: User,
    db: Session
):
    workspace = db.query(Workspace).filter(
        Workspace.id == workspace_id
    ).first()

    if not workspace:
        raise HTTPException(
            status_code=404,
            detail="Workspace not found"
        )

    # Workspace owner automatically has access
    if workspace.owner_id == current_user.id:
        return workspace

    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == current_user.id
    ).first()

    if not member:
        raise HTTPException(
            status_code=403,
            detail="You are not a member of this workspace"
        )

    return workspace


# =========================================================
# CREATE DOCUMENT
# =========================================================

@router.post("/")
def create_document(
    workspace_id: int,
    title: str,
    content: Optional[str] = None,
    folder_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    title = title.strip()

    if not title:
        raise HTTPException(
            status_code=400,
            detail="Document title is required"
        )

    # Check workspace access
    check_workspace_membership(
        workspace_id,
        current_user,
        db
    )

    # Check folder if supplied
    if folder_id is not None:
        folder = db.query(Folder).filter(
            Folder.id == folder_id
        ).first()

        if not folder:
            raise HTTPException(
                status_code=404,
                detail="Folder not found"
            )

        if folder.workspace_id != workspace_id:
            raise HTTPException(
                status_code=400,
                detail="Folder does not belong to this workspace"
            )

    document = Document(
        workspace_id=workspace_id,
        owner_id=current_user.id,
        title=title,
        content=content,
        folder_id=folder_id
    )

    db.add(document)
    db.commit()
    db.refresh(document)

    return document


# =========================================================
# GET DOCUMENTS
# =========================================================

@router.get("/")
def get_documents(
    workspace_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get documents accessible by the current user.

    If workspace_id is supplied:
        Return documents from that workspace.

    If workspace_id is not supplied:
        Return documents from all workspaces where the user
        is owner/member.
    """

    # -----------------------------------------------------
    # Specific workspace
    # -----------------------------------------------------

    if workspace_id is not None:
        check_workspace_membership(
            workspace_id,
            current_user,
            db
        )

        documents = db.query(Document).filter(
            Document.workspace_id == workspace_id
        ).order_by(
            Document.id.desc()
        ).all()

    # -----------------------------------------------------
    # All accessible workspaces
    # -----------------------------------------------------

    else:
        owned_workspace_ids = db.query(
            Workspace.id
        ).filter(
            Workspace.owner_id == current_user.id
        ).all()

        member_workspace_ids = db.query(
            WorkspaceMember.workspace_id
        ).filter(
            WorkspaceMember.user_id == current_user.id
        ).all()

        workspace_ids = set()

        for row in owned_workspace_ids:
            workspace_ids.add(row[0])

        for row in member_workspace_ids:
            workspace_ids.add(row[0])

        if not workspace_ids:
            return []

        documents = db.query(Document).filter(
            Document.workspace_id.in_(workspace_ids)
        ).order_by(
            Document.id.desc()
        ).all()

    # -----------------------------------------------------
    # Apply document-level permissions
    # -----------------------------------------------------

    allowed_documents = []

    for document in documents:
        try:
            check_permission(
                document,
                current_user,
                "view",
                db
            )

            allowed_documents.append(document)

        except HTTPException:
            continue

    return allowed_documents


# =========================================================
# SEARCH DOCUMENTS
# =========================================================

@router.get("/search/")
def search_documents(
    workspace_id: int,
    query: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = query.strip()

    if not query:
        raise HTTPException(
            status_code=400,
            detail="Search query is required"
        )

    check_workspace_membership(
        workspace_id,
        current_user,
        db
    )

    documents = db.query(Document).filter(
        Document.workspace_id == workspace_id,
        or_(
            Document.title.ilike(f"%{query}%"),
            Document.content.ilike(f"%{query}%")
        )
    ).order_by(
        Document.id.desc()
    ).all()

    allowed_documents = []

    for document in documents:
        try:
            check_permission(
                document,
                current_user,
                "view",
                db
            )

            allowed_documents.append(document)

        except HTTPException:
            continue

    return allowed_documents


# =========================================================
# GET DOCUMENT VERSIONS
# =========================================================

@router.get("/{document_id}/versions")
def get_document_versions(
    document_id: int,
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

    check_permission(
        document,
        current_user,
        "view",
        db
    )

    versions = db.query(DocumentVersion).filter(
        DocumentVersion.document_id == document_id
    ).order_by(
        DocumentVersion.version_number.desc()
    ).all()

    return versions


# =========================================================
# MOVE DOCUMENT TO FOLDER
# =========================================================

@router.put("/{document_id}/move")
def move_document(
    document_id: int,
    folder_id: Optional[int] = None,
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

    check_permission(
        document,
        current_user,
        "edit",
        db
    )

    # Move to root
    if folder_id is None:
        document.folder_id = None

    else:
        folder = db.query(Folder).filter(
            Folder.id == folder_id
        ).first()

        if not folder:
            raise HTTPException(
                status_code=404,
                detail="Folder not found"
            )

        if folder.workspace_id != document.workspace_id:
            raise HTTPException(
                status_code=400,
                detail="Folder does not belong to document workspace"
            )

        document.folder_id = folder.id

    db.commit()
    db.refresh(document)

    return {
        "message": "Document moved successfully",
        "document": document
    }


# =========================================================
# UPDATE DOCUMENT
# =========================================================

@router.put("/{document_id}")
def update_document(
    document_id: int,
    title: str,
    content: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    title = title.strip()

    if not title:
        raise HTTPException(
            status_code=400,
            detail="Document title is required"
        )

    document = db.query(Document).filter(
        Document.id == document_id
    ).first()

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    check_permission(
        document,
        current_user,
        "edit",
        db
    )

    # Get latest version number
    last_version = db.query(
        func.max(DocumentVersion.version_number)
    ).filter(
        DocumentVersion.document_id == document.id
    ).scalar()

    next_version = (last_version or 0) + 1

    # Save current state before updating
    version = DocumentVersion(
        document_id=document.id,
        title=document.title,
        content=document.content,
        version_number=next_version,
        created_by=current_user.id
    )

    db.add(version)

    document.title = title
    document.content = content

    db.commit()
    db.refresh(document)

    return {
        "message": "Document updated successfully",
        "document": document,
        "version_created": next_version
    }


# =========================================================
# GET SINGLE DOCUMENT
# =========================================================

@router.get("/{document_id}")
def get_document(
    document_id: int,
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

    check_permission(
        document,
        current_user,
        "view",
        db
    )

    return document


# =========================================================
# RESTORE VERSION
# =========================================================

@router.post("/{document_id}/versions/{version_id}/restore")
def restore_document_version(
    document_id: int,
    version_id: int,
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

    check_permission(
        document,
        current_user,
        "edit",
        db
    )

    version = db.query(DocumentVersion).filter(
        DocumentVersion.id == version_id,
        DocumentVersion.document_id == document_id
    ).first()

    if not version:
        raise HTTPException(
            status_code=404,
            detail="Version not found"
        )

    # Create a new version containing current state
    last_version = db.query(
        func.max(DocumentVersion.version_number)
    ).filter(
        DocumentVersion.document_id == document.id
    ).scalar()

    next_version = (last_version or 0) + 1

    current_version = DocumentVersion(
        document_id=document.id,
        title=document.title,
        content=document.content,
        version_number=next_version,
        created_by=current_user.id
    )

    db.add(current_version)

    # Restore selected version
    document.title = version.title
    document.content = version.content

    db.commit()
    db.refresh(document)

    return {
        "message": "Document restored to version successfully",
        "document": document,
        "version_created": next_version
    }


# =========================================================
# DELETE DOCUMENT
# =========================================================

@router.delete("/{document_id}")
def delete_document(
    document_id: int,
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

    # Only owner can delete
    if document.owner_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Only document owner can delete this document"
        )

    db.query(DocumentVersion).filter(
        DocumentVersion.document_id == document.id
    ).delete(
        synchronize_session=False
    )

    db.delete(document)
    db.commit()

    return {
        "message": "Document deleted successfully",
        "document_id": document_id
    }
