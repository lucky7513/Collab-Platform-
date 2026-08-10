import bcrypt
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from models.user import User
from schemas.schemas import RegisterRequest, LoginRequest, AuthResponse
from core.jwt import create_access_token


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))


def register_user(req: RegisterRequest, db: Session) -> AuthResponse:
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        name=req.name,
        email=req.email,
        password_hash=hash_password(req.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.email)
    return AuthResponse(token=token, name=user.name, email=user.email, avatar_color=user.avatar_color)


def login_user(req: LoginRequest, db: Session) -> AuthResponse:
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_access_token(user.email)
    return AuthResponse(token=token, name=user.name, email=user.email, avatar_color=user.avatar_color)