from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    title = Column(
        String(255),
        nullable=False
    )

    content = Column(
        Text,
        nullable=True
    )

    workspace_id = Column(
        Integer,
        ForeignKey("workspaces.id"),
        nullable=False
    )

    owner_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    # Folder relation
    folder_id = Column(
        Integer,
        ForeignKey("folders.id", ondelete="SET NULL"),
        nullable=True
    )

    file_name = Column(
        String(255),
        nullable=True
    )

    file_path = Column(
        String(500),
        nullable=True
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    # Workspace relationship
    workspace = relationship(
        "Workspace"
    )

    # Owner relationship
    owner = relationship(
        "User"
    )

    # Folder relationship
    folder = relationship(
        "Folder",
        back_populates="documents"
    )

    # Document version history
    versions = relationship(
        "DocumentVersion",
        back_populates="document",
        cascade="all, delete-orphan"
    )
