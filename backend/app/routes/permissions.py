from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.permission import Permission
from app.models.document import Document
from app.models.user import User
from app.utils.dependencies import get_current_user


router = APIRouter(
    prefix="/permissions",
    tags=["Permissions"]
)


VALID_ROLES = ["owner", "editor", "commenter", "viewer"]


# ---------------------------------------------------------
# CREATE / UPDATE PERMISSION
# ---------------------------------------------------------
@router.post("/")
def create_permission(
    document_id: int,
    user_id: int,
    role: str,
    workspace_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if role not in VALID_ROLES:
        raise HTTPException(
            status_code=400,
            detail="Invalid role. Use owner, editor, commenter or viewer."
        )

    document = db.query(Document).filter(
        Document.id == document_id
    ).first()

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    # Only owner can manage sharing
    if document.owner_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Only document owner can assign permissions"
        )

    # Owner permission should not be assigned to another user
    if role == "owner" and user_id != document.owner_id:
        raise HTTPException(
            status_code=400,
            detail="Only document owner can have owner role"
        )

    # Automatically determine permission from role
    permission_map = {
        "owner": "delete",
        "editor": "edit",
        "commenter": "comment",
        "viewer": "view"
    }

    permission_value = permission_map[role]

    existing = db.query(Permission).filter(
        Permission.document_id == document_id,
        Permission.user_id == user_id
    ).first()

    if existing:
        existing.role = role
        existing.permission = permission_value
        existing.workspace_id = workspace_id
    else:
        new_permission = Permission(
            document_id=document_id,
            user_id=user_id,
            role=role,
            permission=permission_value,
            workspace_id=workspace_id
        )

        db.add(new_permission)

    db.commit()

    return {
        "message": "Permission assigned successfully",
        "document_id": document_id,
        "user_id": user_id,
        "role": role,
        "permission": permission_value
    }


# ---------------------------------------------------------
# GET DOCUMENT PERMISSIONS
# ---------------------------------------------------------
@router.get("/{document_id}")
def get_document_permissions(
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

    # Check whether current user is owner
    # or already has permission
    if document.owner_id != current_user.id:

        user_permission = db.query(Permission).filter(
            Permission.document_id == document_id,
            Permission.user_id == current_user.id
        ).first()

        if not user_permission:
            raise HTTPException(
                status_code=403,
                detail="You do not have access to this document"
            )

    permissions = db.query(Permission).filter(
        Permission.document_id == document_id
    ).all()

    result = []

    # Add document owner
    result.append({
        "user_id": document.owner_id,
        "role": "owner",
        "permission": "delete"
    })

    # Add shared users
    for item in permissions:

        # Avoid duplicate owner
        if item.user_id == document.owner_id:
            continue

        result.append({
            "id": item.id,
            "user_id": item.user_id,
            "role": item.role,
            "permission": item.permission,
            "workspace_id": item.workspace_id,
            "created_at": item.created_at
        })

    return result


# ---------------------------------------------------------
# UPDATE ROLE
# ---------------------------------------------------------
@router.put("/{permission_id}")
def update_permission(
    permission_id: int,
    role: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if role not in VALID_ROLES:
        raise HTTPException(
            status_code=400,
            detail="Invalid role"
        )

    permission = db.query(Permission).filter(
        Permission.id == permission_id
    ).first()

    if not permission:
        raise HTTPException(
            status_code=404,
            detail="Permission not found"
        )

    document = db.query(Document).filter(
        Document.id == permission.document_id
    ).first()

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    if document.owner_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Only document owner can update permissions"
        )

    if role == "owner":
        raise HTTPException(
            status_code=400,
            detail="Owner role cannot be assigned using this endpoint"
        )

    permission_map = {
        "editor": "edit",
        "commenter": "comment",
        "viewer": "view"
    }

    permission.role = role
    permission.permission = permission_map[role]

    db.commit()

    return {
        "message": "Permission updated successfully",
        "permission_id": permission.id,
        "role": role,
        "permission": permission.permission
    }


# ---------------------------------------------------------
# DELETE / REMOVE ACCESS
# ---------------------------------------------------------
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

    document = db.query(Document).filter(
        Document.id == permission.document_id
    ).first()

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    if document.owner_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Only document owner can remove permissions"
        )

    db.delete(permission)
    db.commit()

    return {
        "message": "Permission removed successfully"
    }