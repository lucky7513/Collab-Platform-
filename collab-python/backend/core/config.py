from functools import lru_cache
import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    database_url: str = os.getenv("DATABASE_URL", "")
    secret_key: str = os.getenv("SECRET_KEY", "supersecretkey")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")

@lru_cache()
def get_settings():
    return Settings()