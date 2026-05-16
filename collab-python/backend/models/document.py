import uuid
from sqlalchemy import Column, String, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from db.database import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False, default="Untitled Document")
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    share_token = Column(String(100), unique=True)
    is_public = Column(Boolean, default=False)
    content = Column(Text, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    owner = relationship("User", foreign_keys=[owner_id])
    permissions = relationship("Permission", back_populates="document", cascade="all, delete-orphan")
