from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from core.security import decode_token

router = APIRouter()

security = HTTPBearer()


@router.post("/auth/logout")
async def logout(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Stateless JWT logout.
    The token is validated here so an invalid/expired token is rejected.
    Clients must delete the token on their side after a successful call.
    To enforce server-side invalidation, add a token-denylist (Redis) later.
    """
    try:
        decode_token(credentials.credentials)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return {"message": "Logged out successfully"}