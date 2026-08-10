from pydantic import BaseModel, EmailStr
from datetime import datetime
from uuid import UUID
from typing import Optional


# ── Auth ────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class AuthResponse(BaseModel):
    token: str
    name: str
    email: str
    avatar_color: str


# ── Documents ────────────────────────────────────────────────────────────────

class DocumentOut(BaseModel):
    id: UUID
    title: str
    owner_name: str
    owner_email: str
    share_token: Optional[str]
    is_public: bool
    content: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class UpdateTitleRequest(BaseModel):
    title: str

class SaveContentRequest(BaseModel):
    content: str

class ShareRequest(BaseModel):
    email: EmailStr
    role: str  # VIEWER | EDITOR


# ── AI ───────────────────────────────────────────────────────────────────────

class AIRequest(BaseModel):
    action: str
    text: str

class AIResponse(BaseModel):
    result: str
