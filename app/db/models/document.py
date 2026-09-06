from datetime import date, datetime
from enum import StrEnum
from uuid import UUID, uuid4

from sqlalchemy import (
    BigInteger,
    Boolean,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy import event, inspect
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class DocumentType(StrEnum):
    FIR = "FIR"
    POLICE_REPORT = "POLICE_REPORT"
    INVESTIGATION_RECORD = "INVESTIGATION_RECORD"
    WITNESS_STATEMENT = "WITNESS_STATEMENT"
    CHARGE_SHEET = "CHARGE_SHEET"
    COURT_FILING = "COURT_FILING"
    EVIDENCE_RECORD = "EVIDENCE_RECORD"
    FORENSIC_REPORT = "FORENSIC_REPORT"
    LEGAL_NOTICE = "LEGAL_NOTICE"
    JUDGMENT = "JUDGMENT"
    OTHER = "OTHER"


class Classification(StrEnum):
    PUBLIC = "PUBLIC"
    INTERNAL = "INTERNAL"
    CONFIDENTIAL = "CONFIDENTIAL"
    RESTRICTED = "RESTRICTED"


class DocumentStatus(StrEnum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    ARCHIVED = "ARCHIVED"
    RETAINED = "RETAINED"


class VirusScanStatus(StrEnum):
    PENDING = "PENDING"
    CLEAN = "CLEAN"
    INFECTED = "INFECTED"
    SKIPPED = "SKIPPED"
    FAILED = "FAILED"


class OcrStatus(StrEnum):
    NOT_REQUESTED = "NOT_REQUESTED"
    QUEUED = "QUEUED"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class PermissionType(StrEnum):
    VIEW = "VIEW"
    DOWNLOAD = "DOWNLOAD"
    COMMENT = "COMMENT"
    SHARE = "SHARE"


class Document(Base):
    __tablename__ = "documents"
    __table_args__ = (UniqueConstraint("case_id", "document_number", name="uq_case_document_number"),)

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    case_id: Mapped[UUID] = mapped_column(ForeignKey("cases.id"), index=True)
    document_number: Mapped[str] = mapped_column(String(64), index=True)
    title: Mapped[str] = mapped_column(String(255), index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    document_type: Mapped[DocumentType] = mapped_column(
        Enum(DocumentType, name="document_type"), index=True
    )
    classification: Mapped[Classification] = mapped_column(
        Enum(Classification, name="classification"), default=Classification.CONFIDENTIAL
    )
    status: Mapped[DocumentStatus] = mapped_column(
        Enum(DocumentStatus, name="document_status"), default=DocumentStatus.ACTIVE
    )
    current_version_id: Mapped[UUID | None] = mapped_column(nullable=True)
    uploaded_by: Mapped[UUID] = mapped_column(ForeignKey("users.id"), index=True)
    owner_department_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("departments.id"), nullable=True
    )
    retention_until: Mapped[date | None] = mapped_column(Date, nullable=True)
    is_evidence: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    case = relationship("Case", back_populates="documents")
    versions = relationship("DocumentVersion", back_populates="document")
    permissions = relationship("DocumentPermission", back_populates="document")
    tags = relationship("DocumentTag", back_populates="document")


class DocumentVersion(Base):
    __tablename__ = "document_versions"
    __table_args__ = (UniqueConstraint("document_id", "version_number", name="uq_document_version"),)

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    document_id: Mapped[UUID] = mapped_column(ForeignKey("documents.id"), index=True)
    version_number: Mapped[int] = mapped_column(Integer)
    storage_key: Mapped[str] = mapped_column(String(512), unique=True)
    original_filename: Mapped[str] = mapped_column(String(255))
    mime_type: Mapped[str] = mapped_column(String(128))
    file_size: Mapped[int] = mapped_column(BigInteger)
    sha256_hash: Mapped[str] = mapped_column(String(64), index=True)
    uploaded_by: Mapped[UUID] = mapped_column(ForeignKey("users.id"))
    change_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    virus_scan_status: Mapped[VirusScanStatus] = mapped_column(
        Enum(VirusScanStatus, name="virus_scan_status"), default=VirusScanStatus.PENDING
    )
    ocr_status: Mapped[OcrStatus] = mapped_column(
        Enum(OcrStatus, name="ocr_status"), default=OcrStatus.NOT_REQUESTED
    )
    ocr_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    extracted_metadata_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    document = relationship("Document", back_populates="versions")


_IMMUTABLE_VERSION_COLUMNS = {
    "document_id",
    "version_number",
    "storage_key",
    "original_filename",
    "mime_type",
    "file_size",
    "sha256_hash",
    "uploaded_by",
    "change_reason",
    "created_at",
}


@event.listens_for(DocumentVersion, "before_update")
def prevent_document_version_content_mutation(_mapper, _connection, target: DocumentVersion) -> None:
    """Permit processing-status updates, but never alter version identity or evidence bytes metadata."""
    state = inspect(target)
    changed = {name for name in _IMMUTABLE_VERSION_COLUMNS if state.attrs[name].history.has_changes()}
    if changed:
        raise ValueError(f"Document versions are immutable; attempted to change: {', '.join(sorted(changed))}")


@event.listens_for(DocumentVersion, "before_delete")
def prevent_document_version_delete(_mapper, _connection, _target: DocumentVersion) -> None:
    raise ValueError("Document versions are immutable and cannot be deleted.")


class DocumentPermission(Base):
    __tablename__ = "document_permissions"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    document_id: Mapped[UUID] = mapped_column(ForeignKey("documents.id"), index=True)
    user_id: Mapped[UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    role: Mapped[str | None] = mapped_column(String(64), nullable=True)
    permission_type: Mapped[PermissionType] = mapped_column(
        Enum(PermissionType, name="permission_type")
    )
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    granted_by: Mapped[UUID] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    document = relationship("Document", back_populates="permissions")


class DocumentTag(Base):
    __tablename__ = "document_tags"
    __table_args__ = (UniqueConstraint("document_id", "tag", name="uq_document_tag"),)

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    document_id: Mapped[UUID] = mapped_column(ForeignKey("documents.id"), index=True)
    tag: Mapped[str] = mapped_column(String(64), index=True)

    document = relationship("Document", back_populates="tags")
