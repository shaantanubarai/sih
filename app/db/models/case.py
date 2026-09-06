from datetime import datetime
from enum import StrEnum
from uuid import UUID, uuid4

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class CaseType(StrEnum):
    CRIMINAL_INVESTIGATION = "CRIMINAL_INVESTIGATION"
    CIVIL = "CIVIL"
    INTERNAL_INQUIRY = "INTERNAL_INQUIRY"
    COURT_MATTER = "COURT_MATTER"


class CaseStatus(StrEnum):
    OPEN = "OPEN"
    UNDER_INVESTIGATION = "UNDER_INVESTIGATION"
    PENDING_REVIEW = "PENDING_REVIEW"
    CLOSED = "CLOSED"
    ARCHIVED = "ARCHIVED"


class CasePriority(StrEnum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class PermissionLevel(StrEnum):
    OWNER = "OWNER"
    EDITOR = "EDITOR"
    REVIEWER = "REVIEWER"
    VIEWER = "VIEWER"


class Case(Base):
    __tablename__ = "cases"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    case_number: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(255), index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    case_type: Mapped[CaseType] = mapped_column(Enum(CaseType, name="case_type"))
    status: Mapped[CaseStatus] = mapped_column(
        Enum(CaseStatus, name="case_status"), default=CaseStatus.OPEN, index=True
    )
    priority: Mapped[CasePriority] = mapped_column(
        Enum(CasePriority, name="case_priority"), default=CasePriority.MEDIUM
    )
    investigating_department_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("departments.id"), nullable=True, index=True
    )
    created_by: Mapped[UUID] = mapped_column(ForeignKey("users.id"), index=True)
    assigned_officer_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("users.id"), nullable=True, index=True
    )
    opened_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    members = relationship("CaseMember", back_populates="case")
    documents = relationship("Document", back_populates="case")
    evidence_items = relationship("EvidenceItem", back_populates="case")


class CaseMember(Base):
    __tablename__ = "case_members"
    __table_args__ = (UniqueConstraint("case_id", "user_id", name="uq_case_member"),)

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    case_id: Mapped[UUID] = mapped_column(ForeignKey("cases.id"), index=True)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), index=True)
    permission_level: Mapped[PermissionLevel] = mapped_column(
        Enum(PermissionLevel, name="permission_level")
    )
    assigned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    assigned_by: Mapped[UUID] = mapped_column(ForeignKey("users.id"))

    case = relationship("Case", back_populates="members")
    user = relationship("User", foreign_keys=[user_id])
