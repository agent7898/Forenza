from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.session_manager import create_session, get_session, list_sessions
from app.dependencies import get_current_user, get_db
from app.schemas.session import SessionStateCreate, SessionStateRead

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.get("")
async def read_sessions(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> list[SessionStateRead]:
    """List all sessions for the current user."""
    user_id = current_user.get("sub")
    sessions = await list_sessions(db, user_id)
    return [SessionStateRead.from_orm(s) for s in sessions]


@router.post("")
async def create_new_session(
    req: SessionStateCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> SessionStateRead:
    """Create a new session for the current user."""
    user_id = current_user.get("sub")
    session = await create_session(
        db,
        user_id=user_id,
        preset=req.preset,
        parameters=req.parameters.model_dump(),
    )
    return SessionStateRead.from_orm(session)


@router.get("/{session_id}")
async def read_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> SessionStateRead:
    """Retrieve a specific session."""
    session = await get_session(db, session_id)
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found",
        )

    user_id = current_user.get("sub")
    if str(session.user_id) != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden",
        )

    return SessionStateRead.from_orm(session)
