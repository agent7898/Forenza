from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class FaceParams(BaseModel):
    """Face parameter set with [0,1] normalized values."""
    jaw_width: float = Field(default=0.5, ge=0.0, le=1.0)
    chin_length: float = Field(default=0.5, ge=0.0, le=1.0)
    face_length: float = Field(default=0.5, ge=0.0, le=1.0)
    eye_size: float = Field(default=0.5, ge=0.0, le=1.0)
    eye_spacing: float = Field(default=0.5, ge=0.0, le=1.0)
    eye_angle: float = Field(default=0.5, ge=0.0, le=1.0)
    nose_length: float = Field(default=0.5, ge=0.0, le=1.0)
    nose_width: float = Field(default=0.5, ge=0.0, le=1.0)
    lip_thickness: float = Field(default=0.5, ge=0.0, le=1.0)
    mouth_width: float = Field(default=0.5, ge=0.0, le=1.0)


class SessionStateRead(BaseModel):
    """Session state for API responses."""
    id: str          # serialised as string for frontend
    user_id: str
    parameters: dict = Field(default_factory=dict)
    preset: str | None = None
    z_current: str | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

    @classmethod
    def from_orm(cls, obj):
        # Convert UUID fields to str for JSON serialisation
        return cls(
            id=str(obj.id),
            user_id=str(obj.user_id),
            parameters=obj.parameters or {},
            preset=obj.preset,
            z_current=obj.z_current,
            created_at=obj.created_at,
            updated_at=obj.updated_at,
        )


class SessionStateCreate(BaseModel):
    """Session creation request."""
    parameters: FaceParams = Field(default_factory=FaceParams)
    preset: str | None = None
