from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit_logger import log_action
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

    z_current = session.z_current
    params_before = session.parameters or {}

    # Call Image Generation Engine
    from app.core.image_gen import generate_forensic_image
    from app.core.storage import upload_image_bytes
    from app.core.similarity import compute_phash, hash_to_string
    
    try:
        raw_image_bytes = await generate_forensic_image(
            params_before, 
            z_current, 
            refinement_text=session.description,
            gender=session.gender,
            view="front"
        )

        # Compute pHash for similarity matching
        phash_arr = compute_phash(raw_image_bytes)
        phash_str = hash_to_string(phash_arr)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate image: {str(e)}"
        )
        
    # Upload to R2
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    image_url = upload_image_bytes(session_id, timestamp, "generate", raw_image_bytes)

    # Update session
    session.updated_at = datetime.now(timezone.utc)
    await save_session(db, session)

    # Log initial state
    await log_action(
        db,
        session_id=session_id,
        user_id=user_id,
        case_id=str(session.case_id) if session.case_id else None,
        action="generate",
        params_before={},
        params_after=params_before,
        image_url=image_url,
        phash=phash_str,
    )

    return {
        "session_id": session_id,
        "image_url": image_url,
        "z_current": z_current,
        "timestamp": timestamp,
    }
