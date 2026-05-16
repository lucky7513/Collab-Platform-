<<<<<<< HEAD
import bcrypt
=======
from passlib.context import CryptContext
>>>>>>> 4a7c6333f502c497bda1b34a40c0fccdee606aae
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from models.user import User
from schemas.schemas import RegisterRequest, LoginRequest, AuthResponse
from core.jwt import create_access_token

<<<<<<< HEAD

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
=======
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
>>>>>>> 4a7c6333f502c497bda1b34a40c0fccdee606aae


def register_user(req: RegisterRequest, db: Session) -> AuthResponse:
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        name=req.name,
        email=req.email,
<<<<<<< HEAD
        password_hash=hash_password(req.password),
=======
        password_hash=pwd_context.hash(req.password),
>>>>>>> 4a7c6333f502c497bda1b34a40c0fccdee606aae
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.email)
    return AuthResponse(token=token, name=user.name, email=user.email, avatar_color=user.avatar_color)


def login_user(req: LoginRequest, db: Session) -> AuthResponse:
    user = db.query(User).filter(User.email == req.email).first()
<<<<<<< HEAD
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_access_token(user.email)
    return AuthResponse(token=token, name=user.name, email=user.email, avatar_color=user.avatar_color)
=======
    if not user or not pwd_context.verify(req.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_access_token(user.email)
    return AuthResponse(token=token, name=user.name, email=user.email, avatar_color=user.avatar_color)
>>>>>>> 4a7c6333f502c497bda1b34a40c0fccdee606aae
