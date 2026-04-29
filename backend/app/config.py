import os
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv


_HERE = Path(__file__).resolve()
_ENV_FILES = [
    _HERE.parent / ".env",            # backend/app/.env
    _HERE.parents[1] / ".env",        # backend/.env
    _HERE.parents[2] / ".env",        # project root .env
]

for env_file in _ENV_FILES:
    if env_file.exists():
        load_dotenv(env_file, override=False)


@lru_cache(maxsize=1)
def get_settings() -> dict[str, str]:
    raw_db_url = os.getenv("DATABASE_URL", "postgresql+asyncpg://user:password@localhost:5432/forenza")

    # Normalize Supabase / standard postgres:// URLs to the asyncpg driver scheme
    # required by SQLAlchemy's async engine.
    if raw_db_url.startswith("postgres://"):
        raw_db_url = raw_db_url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif raw_db_url.startswith("postgresql://"):
        raw_db_url = raw_db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

    return {
        "DATABASE_URL": raw_db_url,
        "JWT_SECRET": os.getenv("JWT_SECRET", "change-me"),
        "JWT_ALGORITHM": os.getenv("JWT_ALGORITHM", "HS256"),
        "ML_SERVICE_URL": os.getenv("ML_SERVICE_URL", "http://localhost:8001"),
        "R2_ACCOUNT_ID": os.getenv("R2_ACCOUNT_ID", ""),
        "R2_ACCESS_KEY_ID": os.getenv("R2_ACCESS_KEY_ID", ""),
        "R2_SECRET_ACCESS_KEY": os.getenv("R2_SECRET_ACCESS_KEY", ""),
        "R2_BUCKET": os.getenv("R2_BUCKET", "forensic-faces"),
        "AUTH_SERVICE_URL": os.getenv("AUTH_SERVICE_URL", "http://localhost:8002").rstrip("/"),
    }
