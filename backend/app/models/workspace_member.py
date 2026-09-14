from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class WorkspaceMember(Base):
    __tablename__ = "workspace_members"

    id = Column(Integer, primary_key=True, index=True)

    workspace_id = Column(
        Integer,
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    role = Column(
        String,
        nullable=False,
        default="viewer"
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    # Relationships
    user = relationship(
        "User",
        back_populates="workspace_members"
    )

    workspace = relationship(
        "Workspace",
        back_populates="members"
    )