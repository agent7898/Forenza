import os
from dotenv import load_dotenv

# Load .env once, here
load_dotenv()

# --- Required settings ---
DATABASE_URL = os.getenv("DATABASE_URL")
JWT_SECRET = os.getenv("JWT_SECRET")

# --- Optional defaults ---
JWT_ALGO = "HS256"
JWT_EXPIRY_HOURS = 24

# --- Basic validation (fail fast) ---
missing = [k for k, v in {
    "DATABASE_URL": DATABASE_URL,
    "JWT_SECRET": JWT_SECRET,
}.items() if not v]

if missing:
    raise RuntimeError(f"Missing environment variables: {', '.join(missing)}")

# --- Normalize DB URL for async SQLAlchemy ---
# Supabase often gives postgres://, async driver needs postgresql+asyncpg://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace(
        "postgres://", "postgresql+asyncpg://", 1
    )