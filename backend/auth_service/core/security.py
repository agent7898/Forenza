from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta, timezone
import os

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET = os.environ["JWT_SECRET"]
ALGO = "HS256"
EXPIRY = 24

def hash_password(plain: str) -> str:
    if len(plain.encode("utf-8")) > 72:
        raise ValueError("Password too long")
    return pwd_ctx.hash(plain)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_ctx.verify(plain, hashed)

def create_token(user_id: str, role: str):
    exp = datetime.now(timezone.utc) + timedelta(hours=EXPIRY)
    return jwt.encode({"sub": user_id, "role": role, "exp": exp}, SECRET, algorithm=ALGO)

def decode_token(token: str):
    return jwt.decode(token, SECRET, algorithms=[ALGO])