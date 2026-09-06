from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.db.models.document import (
    Classification,
    DocumentStatus,
    DocumentType,
    OcrStatus,
    PermissionType,
    VirusScanStatus,
)


class DocumentCreate(BaseModel):
    document_number: str = Field(min_length=2, max_length=64)
    title: str = Field(min_length=2, max_length=255)
    description: str | None = None
    document_type: DocumentType
    classification: Classification = Classification.CONFIDENTIAL
    retention_until: date | None = None
    is_evidence: bool = False
    tags: list[str] = Field(default_factory=list)
    change_reason: str | None = "Initial upload"


class DocumentMetadataUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    classification: Classification | None = None
    status: DocumentStatus | None = None
    retention_until: date | None = None
    tags: list[str] | None = None


class DocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    case_id: UUID
    document_number: str
    title: str
    description: str | None
    document_type: DocumentType
    classification: Classification
    status: DocumentStatus
    current_version_id: UUID | None
    uploaded_by: UUID
    owner_department_id: UUID | None
    retention_until: date | None
    is_evidence: bool
    created_at: datetime | None


class VersionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    document_id: UUID
    version_number: int
    original_filename: str
    mime_type: str
    file_size: int
    sha256_hash: str
    uploaded_by: UUID
    change_reason: str | None
    virus_scan_status: VirusScanStatus
    ocr_status: OcrStatus
    created_at: datetime | None


class PermissionCreate(BaseModel):
    user_id: UUID | None = None
    role: str | None = None
    permission_type: PermissionType
    expires_at: datetime | None = None


class PermissionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    document_id: UUID
    user_id: UUID | None
    role: str | None
    permission_type: PermissionType
    expires_at: datetime | None
    granted_by: UUID
    created_at: datetime | None


class ShareLinkCreate(BaseModel):
    recipient_email: EmailStr | None = None
    expires_minutes: int = Field(60, ge=5, le=10080)
    max_downloads: int = Field(1, ge=1, le=50)


class ShareLinkOut(BaseModel):
    id: UUID
    document_id: UUID
    token: str | None = None
    recipient_email: str | None
    expires_at: datetime
    max_downloads: int
    download_count: int
    is_revoked: bool


class CommentCreate(BaseModel):
    content: str = Field(min_length=1, max_length=4000)
    version_id: UUID | None = None
    page_number: int | None = Field(default=None, ge=1)


class CommentUpdate(BaseModel):
    content: str = Field(min_length=1, max_length=4000)


class CommentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    document_id: UUID
    version_id: UUID | None
    user_id: UUID
    content: str
    page_number: int | None
    is_resolved: bool
    created_at: datetime | None
