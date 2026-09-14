from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class DocumentVersion(Base):
    __tablename__ = "document_versions"

    # =====================================================
    # PRIMARY KEY
    # =====================================================

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    # =====================================================
    # DOCUMENT ID
    # =====================================================

    document_id = Column(
        Integer,
        ForeignKey(
            "documents.id",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    # =====================================================
    # DOCUMENT TITLE
    # =====================================================

    title = Column(
        Text,
        nullable=False
    )

    # =====================================================
    # DOCUMENT CONTENT
    # =====================================================

    content = Column(
        Text,
        nullable=True
    )

    # =====================================================
    # VERSION NUMBER
    # =====================================================

    version_number = Column(
        Integer,
        nullable=False
    )

    # =====================================================
    # USER WHO CREATED THIS VERSION
    # =====================================================

    created_by = Column(
        Integer,
        ForeignKey(
            "users.id",
            ondelete="SET NULL"
        ),
        nullable=True
    )

    # =====================================================
    # CREATED DATE
    # =====================================================

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    # =====================================================
    # DOCUMENT RELATIONSHIP
    # =====================================================

    document = relationship(
        "Document",
        back_populates="versions"
    )

    # =====================================================
    # USER RELATIONSHIP
    # =====================================================

    user = relationship(
        "User"
    )