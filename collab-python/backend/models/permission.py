import uuid
import enum
from sqlalchemy import Column, Enum, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from db.database import Base


class RoleEnum(str, enum.Enum):
    VIEWER = "VIEWER"
    EDITOR = "EDITOR"
    OWNER = "OWNER"


class Permission(Base):
    __tablename__ = "permissions"
    __table_args__ = (UniqueConstraint("document_id", "user_id"),)

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    role = Column(Enum(RoleEnum), nullable=False)

    document = relationship("Document", back_populates="permissions")
    user = relationship("User")
