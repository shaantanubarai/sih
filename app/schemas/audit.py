from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class AuditLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    event_id: str
    actor_user_id: UUID | None
    action: str
    entity_type: str
    entity_id: str | None
    case_id: UUID | None
    timestamp: datetime | None
    ip_address: str | None
    metadata_json: dict | None
    previous_event_hash: str
    event_hash: str


class AuditVerifyOut(BaseModel):
    valid: bool
    events_checked: int
    broken_at_index: int | None


class SignatureOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    document_id: UUID
    version_id: UUID
    signer_id: UUID
    document_hash: str
    algorithm: str
    is_mock: bool
    signed_at: datetime | None


class SignatureVerifyOut(BaseModel):
    valid: bool
    is_mock: bool
    disclaimer: str
