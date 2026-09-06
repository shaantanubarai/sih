from datetime import datetime
from enum import StrEnum
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import JSON

from app.db.base_class import Base


class AuditAction(StrEnum):
    LOGIN = "LOGIN"
    LOGIN_FAILED = "LOGIN_FAILED"
    LOGOUT = "LOGOUT"
    REGISTER = "REGISTER"
    PASSWORD_CHANGE = "PASSWORD_CHANGE"
    USER_STATUS_CHANGE = "USER_STATUS_CHANGE"
    DEPARTMENT_CREATE = "DEPARTMENT_CREATE"
    DEPARTMENT_UPDATE = "DEPARTMENT_UPDATE"
    CASE_CREATE = "CASE_CREATE"
    CASE_UPDATE = "CASE_UPDATE"
    CASE_CLOSE = "CASE_CLOSE"
    CASE_MEMBER_ADD = "CASE_MEMBER_ADD"
    CASE_MEMBER_REMOVE = "CASE_MEMBER_REMOVE"
    DOCUMENT_CREATE = "DOCUMENT_CREATE"
    DOCUMENT_METADATA_UPDATE = "DOCUMENT_METADATA_UPDATE"
    DOCUMENT_VERSION_CREATE = "DOCUMENT_VERSION_CREATE"
    DOCUMENT_VERSION_VIEW = "DOCUMENT_VERSION_VIEW"
    DOCUMENT_VIEW = "DOCUMENT_VIEW"
    DOCUMENT_DOWNLOAD = "DOCUMENT_DOWNLOAD"
    DOCUMENT_ACCESS_DENIED = "DOCUMENT_ACCESS_DENIED"
    DOCUMENT_PERMISSION_GRANT = "DOCUMENT_PERMISSION_GRANT"
    DOCUMENT_PERMISSION_REVOKE = "DOCUMENT_PERMISSION_REVOKE"
    SHARE_LINK_CREATE = "SHARE_LINK_CREATE"
    SHARE_LINK_DOWNLOAD = "SHARE_LINK_DOWNLOAD"
    SHARE_LINK_REVOKE = "SHARE_LINK_REVOKE"
    COMMENT_CREATE = "COMMENT_CREATE"
    COMMENT_UPDATE = "COMMENT_UPDATE"
    COMMENT_RESOLVE = "COMMENT_RESOLVE"
    EVIDENCE_CREATE = "EVIDENCE_CREATE"
    CUSTODY_TRANSFER = "CUSTODY_TRANSFER"
    SIGNATURE_CREATE = "SIGNATURE_CREATE"
    SIGNATURE_VERIFY = "SIGNATURE_VERIFY"
    AUDIT_VERIFY = "AUDIT_VERIFY"
    INTEGRITY_VERIFY = "INTEGRITY_VERIFY"
    RETENTION_ARCHIVE = "RETENTION_ARCHIVE"


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    event_id: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    actor_user_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("users.id"), nullable=True, index=True
    )
    action: Mapped[str] = mapped_column(String(64), index=True)
    entity_type: Mapped[str] = mapped_column(String(64), index=True)
    entity_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    case_id: Mapped[UUID | None] = mapped_column(ForeignKey("cases.id"), nullable=True, index=True)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )
    ip_address: Mapped[str | None] = mapped_column(String(64), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(512), nullable=True)
    metadata_json: Mapped[dict | None] = mapped_column(JSON().with_variant(JSONB, "postgresql"))
    previous_event_hash: Mapped[str] = mapped_column(String(64))
    event_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)
