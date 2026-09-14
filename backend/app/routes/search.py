from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models.document import Document
from app.models.user import User
from app.utils.dependencies import get_current_user

router = APIRouter(
    prefix="/search",
    tags=["Search"]
)


@router.get("/")
def search_documents(
    q: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    documents = db.query(Document).filter(
        Document.owner_id == current_user.id,
        or_(
            Document.title.ilike(f"%{q}%"),
            Document.content.ilike(f"%{q}%")
        )
    ).all()

    return documents