import uuid
from sqlalchemy import Column, String, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from db.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    avatar_color = Column(String(7), default="#6366f1")
    avatar_image = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())