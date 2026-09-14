from sqlalchemy import Column, Integer, Text, ForeignKey, DateTime
from sqlalchemy.sql import func

from app.database import Base


class Comment(Base):
    __tablename__ = "comments"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    content = Column(
        Text,
        nullable=False
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    workspace_id = Column(
        Integer,
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False
    )

    document_id = Column(
        Integer,
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False
    )

    created_at = Column(
        DateTime,
        server_default=func.now(),
        nullable=False
    )