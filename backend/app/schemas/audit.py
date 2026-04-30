from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class AuditLogEntry(BaseModel):
    """Audit log entry for writing to database."""
    session_id: str
    user_id: str
    case_id: str | None = None
    action: str
    params_before: dict = Field(default_factory=dict)
    params_after: dict = Field(default_factory=dict)
    image_url: str | None = None
    side_image_url: str | None = None
    phash: str | None = None


class AuditLogRead(BaseModel):
    """Audit log entry for API responses."""
    id: str
    session_id: str | None
    user_id: str | None
    case_id: str | None = None
    action: str
    params_before: dict
    params_after: dict
    image_url: str | None = None
    side_image_url: str | None = None
    timestamp: datetime

    class Config:
        from_attributes = True

    @classmethod
    def from_orm(cls, obj):
        return cls(
            id=str(obj.id),
            session_id=str(obj.session_id) if obj.session_id else None,
            user_id=str(obj.user_id) if obj.user_id else None,
            case_id=str(obj.case_id) if obj.case_id else None,
            action=obj.action,
            params_before=obj.params_before or {},
            params_after=obj.params_after or {},
            image_url=obj.image_url,
            side_image_url=obj.side_image_url,
            timestamp=obj.timestamp,
        )
