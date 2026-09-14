from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(255), nullable=False)

    email = Column(String, unique=True, nullable=False, index=True)

    password_hash = Column(String, nullable=False)

    is_verified = Column(Boolean, default=False, nullable=False)

    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(
        DateTime,
        server_default=func.now(),
        nullable=False
    )

    verification_token = Column(String, nullable=True)

    reset_token = Column(String, nullable=True)

    role = Column(
        String(20),
        default="user",
        nullable=False
    )

    workspace_members = relationship(
        "WorkspaceMember",
        back_populates="user",
        cascade="all, delete-orphan"
    )