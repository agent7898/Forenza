from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit_logger import log_action
from app.core.ml_client import ml_post
from app.core.session_manager import get_session, save_session
from app.core.storage import upload_image
from app.dependencies import get_current_user, get_db
from app.schemas.session import FaceParams

router = APIRouter(prefix="/sessions", tags=["refine"])


class RefineRequest(BaseModel):
    """Refine endpoint request with new parameters."""
    parameters: FaceParams


@router.post("/{session_id}/refine")
async def refine_face(
    session_id: str,
    req: RefineRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Refine face with new parameters via latent vector manipulation.
    
    - Validates session ownership
    - Calls ML service with updated parameters
    - Uploads result to R2
    - Writes audit log with before/after params
    """
    session = await get_session(db, session_id)
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )

    user_id = current_user.get("sub")
    if str(session.user_id) != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden"
        )

    # Record before state
    params_before = session.parameters or {}
    params_after = req.parameters.model_dump()

    # Call ML service
    result = await ml_post("/ml/refine", {
        "z_vector": session.z_current,
        "parameters": params_after,
    })
    if not result.get("image_base64"):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="ML service returned invalid response"
        )

    # Upload to R2
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    image_url = upload_image(session_id, timestamp, "refine", result["image_base64"])

    # Update session
    session.parameters = params_after
    session.updated_at = datetime.now(timezone.utc)
    await save_session(db, session)

    # Write audit log
    await log_action(
        db,
        session_id=session_id,
        user_id=user_id,
        action="refine",
        params_before=params_before,
        params_after=params_after,
        image_url=image_url,
    )

    return {
        "session_id": session_id,
        "image_url": image_url,
        "z_current": session.z_current,
        "parameters": params_after,
        "timestamp": timestamp,
    }
