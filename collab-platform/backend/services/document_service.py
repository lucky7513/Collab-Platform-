import uuid
from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from models.user import User
from models.document import Document
from models.permission import Permission, RoleEnum
from schemas.schemas import DocumentOut


def _to_out(doc: Document) -> DocumentOut:
    return DocumentOut(
        id=doc.id,
        title=doc.title,
        owner_name=doc.owner.name,
        owner_email=doc.owner.email,
        share_token=doc.share_token,
        is_public=doc.is_public,
        content=doc.content or "",
        created_at=doc.created_at,
        updated_at=doc.updated_at,
    )


def _assert_can_read(doc: Document, user: User, db: Session):
    if doc.is_public:
        return
    if doc.owner_id == user.id:
        return
    perm = db.query(Permission).filter_by(document_id=doc.id, user_id=user.id).first()
    if not perm:
        raise HTTPException(status_code=403, detail="Access denied")


def _assert_can_edit(doc: Document, user: User, db: Session):
    if doc.owner_id == user.id:
        return
    perm = db.query(Permission).filter_by(document_id=doc.id, user_id=user.id).first()
    if not perm:
        raise HTTPException(status_code=403, detail="Access denied")
    if perm.role == RoleEnum.VIEWER:
        raise HTTPException(status_code=403, detail="Read-only access")


def get_all_documents(user: User, db: Session) -> list[DocumentOut]:
    owned = db.query(Document).filter(Document.owner_id == user.id)
    shared_ids = db.query(Permission.document_id).filter(Permission.user_id == user.id)
    shared = db.query(Document).filter(Document.id.in_(shared_ids))
    docs = owned.union(shared).order_by(Document.updated_at.desc()).all()
    return [_to_out(d) for d in docs]


def create_document(user: User, db: Session) -> DocumentOut:
    token = uuid.uuid4().hex[:12]
    doc = Document(owner_id=user.id, share_token=token)
    db.add(doc)
    db.flush()

    perm = Permission(document_id=doc.id, user_id=user.id, role=RoleEnum.OWNER)
    db.add(perm)
    db.commit()
    db.refresh(doc)
    return _to_out(doc)


def get_document(doc_id: str, user: User, db: Session) -> DocumentOut:
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    _assert_can_read(doc, user, db)
    return _to_out(doc)


def update_title(doc_id: str, title: str, user: User, db: Session) -> DocumentOut:
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    _assert_can_edit(doc, user, db)
    doc.title = title
    db.commit()
    db.refresh(doc)
    return _to_out(doc)


def save_content(doc_id: str, content: str, user: User, db: Session) -> DocumentOut:
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    _assert_can_edit(doc, user, db)
    doc.content = content
    db.commit()
    db.refresh(doc)
    return _to_out(doc)


def delete_document(doc_id: str, user: User, db: Session):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Only owner can delete")
    db.delete(doc)
    db.commit()


def get_by_share_token(token: str, db: Session) -> DocumentOut:
    doc = db.query(Document).filter(Document.share_token == token).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return _to_out(doc)


def share_document(doc_id: str, target_email: str, role: str, user: User, db: Session):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Only owner can share")

    target = db.query(User).filter(User.email == target_email).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    role_enum = RoleEnum[role.upper()]
    existing = db.query(Permission).filter_by(document_id=doc.id, user_id=target.id).first()
    if existing:
        existing.role = role_enum
    else:
        db.add(Permission(document_id=doc.id, user_id=target.id, role=role_enum))
    db.commit()
