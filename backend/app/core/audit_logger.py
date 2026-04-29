from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import AuditLog
from app.schemas.audit import AuditLogEntry


async def write_audit_log(db: AsyncSession, entry: AuditLogEntry) -> AuditLog:
    """Write an audit log entry with structured columns."""
    record = AuditLog(
        session_id=UUID(entry.session_id) if entry.session_id else None,
        user_id=UUID(entry.user_id) if entry.user_id else None,
        action=entry.action,
        params_before=entry.params_before,
        params_after=entry.params_after,
        image_url=entry.image_url,
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record


async def log_action(
    db: AsyncSession,
    session_id: str,
    user_id: str,
    action: str,
    params_before: dict,
    params_after: dict,
    image_url: str | None = None,
) -> AuditLog:
    """Convenience helper to log an action with before/after parameters."""
    entry = AuditLogEntry(
        session_id=session_id,
        user_id=user_id,
        action=action,
        params_before=params_before,
        params_after=params_after,
        image_url=image_url,
    )
    return await write_audit_log(db, entry)
