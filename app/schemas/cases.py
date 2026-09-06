from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.db.models.case import CasePriority, CaseStatus, CaseType, PermissionLevel


class CaseCreate(BaseModel):
    case_number: str = Field(min_length=3, max_length=64)
    title: str = Field(min_length=3, max_length=255)
    description: str | None = None
    case_type: CaseType
    priority: CasePriority = CasePriority.MEDIUM
    investigating_department_id: UUID | None = None
    assigned_officer_id: UUID | None = None


class CaseUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: CaseStatus | None = None
    priority: CasePriority | None = None
    assigned_officer_id: UUID | None = None


class CaseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    case_number: str
    title: str
    description: str | None
    case_type: CaseType
    status: CaseStatus
    priority: CasePriority
    investigating_department_id: UUID | None
    created_by: UUID
    assigned_officer_id: UUID | None
    opened_at: datetime | None
    closed_at: datetime | None
    created_at: datetime | None


class MemberCreate(BaseModel):
    user_id: UUID
    permission_level: PermissionLevel


class MemberOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    case_id: UUID
    user_id: UUID
    permission_level: PermissionLevel
    assigned_at: datetime | None
    assigned_by: UUID
