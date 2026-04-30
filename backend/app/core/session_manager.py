from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import SessionRecord


def _to_uuid(value: str | UUID) -> UUID:
    """Ensure value is a UUID object (accepts string or UUID)."""
    return UUID(str(value)) if not isinstance(value, UUID) else value


async def create_session(
    db: AsyncSession,
    user_id: str,
    case_id: str | None = None,
    preset: str | None = None,
    parameters: dict | None = None,
    description: str | None = None,
    gender: str = "male",
) -> SessionRecord:
    """Create a new session for a user."""
    # Use a deterministic seed based on the initial description to ensure 
    # that the same prompt in different sessions yields the same base image.
    import hashlib
    seed_hash = hashlib.md5((description or "standard").encode()).hexdigest()
    deterministic_seed = int(seed_hash[:8], 16) % 1000000

    record = SessionRecord(
        user_id=_to_uuid(user_id),
        case_id=_to_uuid(case_id) if case_id else None,
        parameters=parameters or {},
        preset=preset,
        description=description,
        gender=gender,
        z_current=str(deterministic_seed)
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record


async def get_session(db: AsyncSession, session_id: str) -> SessionRecord | None:
    """Retrieve a session by ID."""
    result = await db.execute(
        select(SessionRecord).where(SessionRecord.id == _to_uuid(session_id))
    )
    return result.scalar_one_or_none()


async def list_sessions(db: AsyncSession, user_id: str) -> list[SessionRecord]:
    """List all sessions for a user, ordered by recency."""
    result = await db.execute(
        select(SessionRecord)
        .where(SessionRecord.user_id == _to_uuid(user_id))
        .order_by(SessionRecord.updated_at.desc())
    )
    return list(result.scalars().all())


async def save_session(db: AsyncSession, session: SessionRecord) -> SessionRecord:
    """Save session changes (merge/update)."""
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session
