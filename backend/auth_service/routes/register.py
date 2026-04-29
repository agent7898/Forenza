from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr, field_validator
from core.security import hash_password
from core.user_crud import create_user, get_user_by_email

router = APIRouter()

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str):
        if len(v) < 8:
            raise ValueError("Password too short")
        if len(v.encode("utf-8")) > 72:
            raise ValueError("Password too long")
        return v

@router.post("/auth/register", status_code=201)
async def register(req: RegisterRequest):
    if await get_user_by_email(req.email):
        raise HTTPException(409, "Email already registered")

    user = await create_user(req.email, hash_password(req.password))

    return {
        "user_id": str(user.id),
        "email": user.email
    }