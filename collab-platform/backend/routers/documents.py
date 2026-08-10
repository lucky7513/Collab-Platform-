from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.database import get_db
from core.deps import get_current_user
from models.user import User
from models.document import Document
from models.permission import Permission, RoleEnum
from schemas.schemas import DocumentOut, UpdateTitleRequest, SaveContentRequest, ShareRequest
from services import document_service
from typing import List
import random, string

router = APIRouter(prefix="/api/documents", tags=["documents"])

def generate_code_str():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

@router.get("", response_model=List[DocumentOut])
def get_all(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return document_service.get_all_documents(user, db)

@router.post("", response_model=DocumentOut)
def create(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return document_service.create_document(user, db)

@router.get("/shared/{token}", response_model=DocumentOut)
def get_shared(token: str, db: Session = Depends(get_db)):
    return document_service.get_by_share_token(token, db)

@router.get("/join/{code}")
def join_by_code(code: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.share_token == code).first()
    if doc:
        role = RoleEnum.EDITOR
    else:
        doc = db.query(Document).filter(Document.viewer_token == code).first()
        if doc:
            role = RoleEnum.VIEWER
        else:
            raise HTTPException(status_code=404, detail="Invalid code")
    existing = db.query(Permission).filter_by(document_id=doc.id, user_id=user.id).first()
    if existing:
        existing.role = role
        db.commit()
    else:
        db.add(Permission(document_id=doc.id, user_id=user.id, role=role))
        db.commit()
    return {"document_id": str(doc.id), "title": doc.title, "role": role.value}

@router.get("/{doc_id}/my-role")
def get_my_role(doc_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.owner_id == user.id:
        return {"role": "OWNER"}
    perm = db.query(Permission).filter_by(document_id=doc.id, user_id=user.id).first()
    if not perm:
        raise HTTPException(status_code=403, detail="Access denied")
    return {"role": perm.role.value}

@router.get("/{doc_id}", response_model=DocumentOut)
def get_one(doc_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return document_service.get_document(doc_id, user, db)

@router.patch("/{doc_id}/title", response_model=DocumentOut)
def update_title(doc_id: str, req: UpdateTitleRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return document_service.update_title(doc_id, req.title, user, db)

@router.patch("/{doc_id}/content", response_model=DocumentOut)
def save_content(doc_id: str, req: SaveContentRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return document_service.save_content(doc_id, req.content, user, db)

@router.delete("/{doc_id}/leave")
def leave_document(doc_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.owner_id == user.id:
        raise HTTPException(status_code=400, detail="Owner cannot leave, only delete")
    perm = db.query(Permission).filter_by(document_id=doc.id, user_id=user.id).first()
    if perm:
        db.delete(perm)
        db.commit()
    return {"message": "Left document"}

@router.delete("/{doc_id}")
def delete(doc_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    document_service.delete_document(doc_id, user, db)
    return {"message": "Deleted"}

@router.post("/{doc_id}/generate-code")
def generate_code(doc_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Only owner can generate codes")
    editor_code = generate_code_str()
    viewer_code = generate_code_str()
    doc.share_token = editor_code
    doc.viewer_token = viewer_code
    db.commit()
    return {"editor_code": editor_code, "viewer_code": viewer_code}

@router.post("/{doc_id}/share")
def share(doc_id: str, req: ShareRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    document_service.share_document(doc_id, req.email, req.role, user, db)
    return {"message": "Shared"}