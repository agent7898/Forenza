from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from core.security import decode_token
from core.user_crud import get_user_by_id

router = APIRouter()

# 🔒 Enables Authorize button in Swagger
security = HTTPBearer()


@router.get("/auth/me")
async def me(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = decode_token(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user = await get_user_by_id(payload["sub"])
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    return {
        "user_id": str(user.id),
        "email": user.email,
        "role": user.role,
        "is_active": user.is_active,
    }