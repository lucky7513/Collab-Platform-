<<<<<<< HEAD

=======
>>>>>>> 4a7c6333f502c497bda1b34a40c0fccdee606aae
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from core.config import get_settings

settings = get_settings()

<<<<<<< HEAD
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
    pool_size=5,
    max_overflow=10,
)
=======
engine = create_engine(settings.DATABASE_URL)
>>>>>>> 4a7c6333f502c497bda1b34a40c0fccdee606aae
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
<<<<<<< HEAD
    Base.metadata.create_all(bind=engine)
=======
    """Create all tables on startup."""
    Base.metadata.create_all(bind=engine)
>>>>>>> 4a7c6333f502c497bda1b34a40c0fccdee606aae
