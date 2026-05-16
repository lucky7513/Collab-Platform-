from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from db.database import get_db
from core.deps import get_current_user
from models.user import User
from models.photo import Photo
from pydantic import BaseModel
from typing import List, Optional
import uuid

router = APIRouter(prefix="/api/photos", tags=["photos"])

class PhotoCreate(BaseModel):
    image_data: str
    caption: Optional[str] = ""

class PhotoOut(BaseModel):
    id: uuid.UUID
    caption: str
    image_data: str
    owner_name: str
    created_at: str

    class Config:
        from_attributes = True

@router.get("", response_model=List[PhotoOut])
def get_photos(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    photos = db.query(Photo).order_by(Photo.created_at.desc()).all()
    return [PhotoOut(
        id=p.id,
        caption=p.caption or "",
        image_data=p.image_data,
        owner_name=p.owner.name,
        created_at=str(p.created_at)
    ) for p in photos]

@router.post("", response_model=PhotoOut)
def upload_photo(req: PhotoCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    photo = Photo(user_id=user.id, image_data=req.image_data, caption=req.caption)
    db.add(photo)
    db.commit()
    db.refresh(photo)
    return PhotoOut(
        id=photo.id,
        caption=photo.caption or "",
        image_data=photo.image_data,
        owner_name=user.name,
        created_at=str(photo.created_at)
    )

@router.delete("/{photo_id}")
def delete_photo(photo_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    photo = db.query(Photo).filter(Photo.id == photo_id).first()
    if not photo:
        return {"error": "Not found"}
    if photo.user_id != user.id:
        return {"error": "Not authorized"}
    db.delete(photo)
    db.commit()
    return {"message": "Deleted"}