from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class Folder(Base):
    __tablename__ = "folders"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String(255),
        nullable=False
    )

    workspace_id = Column(
        Integer,
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False
    )

    owner_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    # Documents inside this folder
    documents = relationship(
        "Document",
        back_populates="folder"
    )
