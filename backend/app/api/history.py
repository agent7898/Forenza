from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.session_manager import get_session
from app.db.models import AuditLog
from app.dependencies import get_current_user, get_db
from app.schemas.audit import AuditLogRead

router = APIRouter(prefix="/sessions", tags=["history"])


@router.get("/{session_id}/history")
async def session_history(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Get complete audit trail (history) for a session.
    
    Shows all actions, parameter changes, and generated outputs.
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

    # Fetch all audit logs for this session
    result = await db.execute(
        select(AuditLog)
        .where(AuditLog.session_id == session_id)
        .order_by(AuditLog.timestamp.asc())
    )
    logs = result.scalars().all()

    return {
        "session_id": session_id,
        "history": [AuditLogRead.from_orm(log).model_dump() for log in logs],
    }
