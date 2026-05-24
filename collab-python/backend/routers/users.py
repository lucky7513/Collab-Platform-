from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.database import get_db
from core.deps import get_current_user
from models.user import User
from models.document import Document
from models.permission import Permission
from pydantic import BaseModel
from typing import Optional
import bcrypt

router = APIRouter(prefix="/api/users", tags=["users"])

class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    avatar_color: Optional[str] = None
    avatar_image: Optional[str] = None

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

@router.get("/me")
def get_profile(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    owned_docs = db.query(Document).filter(Document.owner_id == user.id).count()
    shared_docs = db.query(Permission).filter(Permission.user_id == user.id).count()
    return {
        "id": str(user.id),
        "name": user.name,
        "email": user.email,
        "avatar_color": user.avatar_color,
        "avatar_image": user.avatar_image,
        "created_at": user.created_at,
        "stats": {
            "owned_documents": owned_docs,
            "shared_documents": shared_docs,
        }
    }

@router.patch("/me")
def update_profile(req: UpdateProfileRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if req.name:
        user.name = req.name
    if req.avatar_color:
        user.avatar_color = req.avatar_color
    if req.avatar_image is not None:
    user.avatar_image = req.avatar_image if req.avatar_image != '' else None
    db.commit()
    db.refresh(user)
    return {
        "id": str(user.id),
        "name": user.name,
        "email": user.email,
        "avatar_color": user.avatar_color,
        "avatar_image": user.avatar_image,
        "created_at": user.created_at,
    }

@router.post("/me/change-password")
def change_password(req: ChangePasswordRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not bcrypt.checkpw(req.current_password.encode('utf-8'), user.password_hash.encode('utf-8')):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    user.password_hash = bcrypt.hashpw(req.new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    db.commit()
    return {"message": "Password changed successfully"}

@router.delete("/me")
def delete_account(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.delete(user)
    db.commit()
    return {"message": "Account deleted"}