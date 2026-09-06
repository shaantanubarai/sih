from datetime import datetime
from enum import StrEnum
from uuid import UUID, uuid4

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class EvidenceStatus(StrEnum):
    COLLECTED = "COLLECTED"
    IN_CUSTODY = "IN_CUSTODY"
    TRANSFERRED = "TRANSFERRED"
    SUBMITTED_TO_COURT = "SUBMITTED_TO_COURT"
    ARCHIVED = "ARCHIVED"


class EvidenceItem(Base):
    __tablename__ = "evidence_items"
    __table_args__ = (UniqueConstraint("case_id", "evidence_number", name="uq_case_evidence_number"),)

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    case_id: Mapped[UUID] = mapped_column(ForeignKey("cases.id"), index=True)
    document_id: Mapped[UUID | None] = mapped_column(ForeignKey("documents.id"), nullable=True)
    evidence_number: Mapped[str] = mapped_column(String(64), index=True)
    description: Mapped[str] = mapped_column(Text)
    collected_by: Mapped[UUID] = mapped_column(ForeignKey("users.id"))
    collected_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    location_collected: Mapped[str | None] = mapped_column(String(255), nullable=True)
    current_custodian: Mapped[UUID] = mapped_column(ForeignKey("users.id"), index=True)
    status: Mapped[EvidenceStatus] = mapped_column(
        Enum(EvidenceStatus, name="evidence_status"), default=EvidenceStatus.COLLECTED
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    case = relationship("Case", back_populates="evidence_items")
    transfers = relationship("CustodyTransfer", back_populates="evidence_item")


class CustodyTransfer(Base):
    __tablename__ = "custody_transfers"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    evidence_item_id: Mapped[UUID] = mapped_column(ForeignKey("evidence_items.id"), index=True)
    from_user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"))
    to_user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"))
    transferred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    reason: Mapped[str] = mapped_column(Text)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    digital_signature_reference: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    evidence_item = relationship("EvidenceItem", back_populates="transfers")
