from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.db.models.evidence import EvidenceStatus


class EvidenceCreate(BaseModel):
    evidence_number: str = Field(min_length=2, max_length=64)
    description: str = Field(min_length=3)
    document_id: UUID | None = None
    collected_at: datetime
    location_collected: str | None = None


class EvidenceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    case_id: UUID
    document_id: UUID | None
    evidence_number: str
    description: str
    collected_by: UUID
    collected_at: datetime
    location_collected: str | None
    current_custodian: UUID
    status: EvidenceStatus
    created_at: datetime | None


class CustodyTransferCreate(BaseModel):
    to_user_id: UUID
    reason: str = Field(min_length=3)
    location: str | None = None
    notes: str | None = None
    digital_signature_reference: str | None = None


class CustodyTransferOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    evidence_item_id: UUID
    from_user_id: UUID
    to_user_id: UUID
    transferred_at: datetime | None
    reason: str
    location: str | None
    notes: str | None
    digital_signature_reference: str | None
    created_at: datetime | None
