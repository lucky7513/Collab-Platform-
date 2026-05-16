from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from db.database import get_db
from core.deps import get_current_user
from models.user import User
from schemas.schemas import DocumentOut, UpdateTitleRequest, SaveContentRequest, ShareRequest
from services import document_service
from typing import List

router = APIRouter(prefix="/api/documents", tags=["documents"])


@router.get("", response_model=List[DocumentOut])
def get_all(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return document_service.get_all_documents(user, db)


@router.post("", response_model=DocumentOut)
def create(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return document_service.create_document(user, db)


@router.get("/shared/{token}", response_model=DocumentOut)
def get_shared(token: str, db: Session = Depends(get_db)):
    return document_service.get_by_share_token(token, db)


@router.get("/{doc_id}", response_model=DocumentOut)
def get_one(doc_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return document_service.get_document(doc_id, user, db)


@router.patch("/{doc_id}/title", response_model=DocumentOut)
def update_title(doc_id: str, req: UpdateTitleRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return document_service.update_title(doc_id, req.title, user, db)


@router.patch("/{doc_id}/content", response_model=DocumentOut)
def save_content(doc_id: str, req: SaveContentRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return document_service.save_content(doc_id, req.content, user, db)


@router.delete("/{doc_id}")
def delete(doc_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    document_service.delete_document(doc_id, user, db)
    return {"message": "Deleted"}


@router.post("/{doc_id}/share")
def share(doc_id: str, req: ShareRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    document_service.share_document(doc_id, req.email, req.role, user, db)
    return {"message": "Shared"}
