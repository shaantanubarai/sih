from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base


class DocumentSignature(Base):
    __tablename__ = "document_signatures"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    document_id: Mapped[UUID] = mapped_column(ForeignKey("documents.id"), index=True)
    version_id: Mapped[UUID] = mapped_column(ForeignKey("document_versions.id"), index=True)
    signer_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"))
    document_hash: Mapped[str] = mapped_column(String(64))
    signature_value: Mapped[str] = mapped_column(Text)
    algorithm: Mapped[str] = mapped_column(String(64), default="MOCK-HMAC-SHA256")
    is_mock: Mapped[bool] = mapped_column(Boolean, default=True)
    signed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
