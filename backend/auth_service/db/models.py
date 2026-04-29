from sqlalchemy.orm import declarative_base
from sqlalchemy import (
    Column, String, Boolean, DateTime, Text, ForeignKey
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id             = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email          = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role           = Column(String, default="officer")
    is_active      = Column(Boolean, default=True)
    created_at     = Column(DateTime(timezone=True), server_default=func.now())


class Session(Base):
    """Stores per-user facial reconstruction sessions."""
    __tablename__ = "sessions"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id    = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    z_current  = Column(Text, nullable=True)       # JSON-serialised latent vector
    parameters = Column(Text, nullable=True)       # JSON-serialised param dict
    preset     = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class AuditLog(Base):
    """Immutable audit trail for every parameter change / image export."""
    __tablename__ = "audit_logs"

    id           = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id   = Column(UUID(as_uuid=True), ForeignKey("sessions.id", ondelete="SET NULL"), nullable=True)
    user_id      = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action       = Column(String, nullable=False)   # e.g. "param_change", "export_image"
    params_before = Column(Text, nullable=True)     # JSON snapshot before change
    params_after  = Column(Text, nullable=True)     # JSON snapshot after change
    image_url    = Column(String, nullable=True)
    timestamp    = Column(DateTime(timezone=True), server_default=func.now())