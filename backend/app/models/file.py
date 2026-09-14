from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.models.folder import Folder
from app.database import Base


class File(Base):
    __tablename__ = "files"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    filename = Column(
        String(255),
        nullable=False
    )

    file_path = Column(
        String(500),
        nullable=True
    )

    file_type = Column(
        String(100),
        nullable=True
    )

    file_size = Column(
        Integer,
        nullable=True
    )

    document_id = Column(
        Integer,
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=True
    )

    folder_id = Column(
        Integer,
        ForeignKey("folders.id", ondelete="SET NULL"),
        nullable=True
    )

    uploaded_by = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )

    created_at = Column(
        DateTime,
        server_default=func.now()
    )
    