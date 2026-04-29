from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit_logger import log_action
from app.core.ml_client import ml_post
from app.core.session_manager import get_session, save_session
from app.core.storage import upload_image
from app.dependencies import get_current_user, get_db
from app.schemas.session import FaceParams

router = APIRouter(prefix="/sessions", tags=["generate"])


class GenerateResponse(dict):
    """Generate endpoint response."""
    pass


@router.post("/{session_id}/generate")
async def generate_face(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Generate a face image from current latent vector and parameters.
    
    - Validates session ownership via JWT 'sub' claim
    - Calls ML service with z_vector
    - Uploads result to R2
    - Writes audit log
    """
    session = await get_session(db, session_id)
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )

    user_id = current_user.get("sub")  # JWT claim = user_id
    if str(session.user_id) != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden"
        )

    # Extract z_current and parameters from session
    z_current = session.z_current
    params_before = session.parameters or {}

    # Call ML service
    result = await ml_post("/ml/generate", {"z_vector": z_current})
    if not result.get("image_base64"):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="ML service returned invalid response"
        )

    # Upload to R2 (never return raw bytes)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    image_url = upload_image(session_id, timestamp, "generate", result["image_base64"])

    # Update session
    session.updated_at = datetime.now(timezone.utc)
    await save_session(db, session)

    # Write audit log
    await log_action(
        db,
        session_id=session_id,
        user_id=user_id,
        action="generate",
        params_before=params_before,
        params_after=params_before,  # params didn't change
        image_url=image_url,
    )

    return {
        "session_id": session_id,
        "image_url": image_url,
        "z_current": z_current,
        "timestamp": timestamp,
    }
