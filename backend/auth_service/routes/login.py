from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from core.security import verify_password, create_token
from core.user_crud import get_user_by_email

router = APIRouter()

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

@router.post("/auth/login")
async def login(req: LoginRequest):
    user = await get_user_by_email(req.email)

    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(401, "Invalid credentials")

    return {
        "access_token": create_token(str(user.id), user.role),
        "token_type": "bearer"
    }