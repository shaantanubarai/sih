from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import utcnow
from app.db.models.audit import AuditLog
from app.services.hashing import canonical_json, mask_metadata, sha256_text

GENESIS_HASH = "0" * 64


class AuditService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def last_event(self) -> AuditLog | None:
        return self.db.scalar(select(AuditLog).order_by(AuditLog.timestamp.desc(), AuditLog.id.desc()))

    def record(
        self,
        *,
        action: str,
        entity_type: str,
        actor_user_id=None,
        entity_id: str | None = None,
        case_id=None,
        ip_address: str | None = None,
        user_agent: str | None = None,
        metadata: dict | None = None,
    ) -> AuditLog:
        previous = self.last_event()
        previous_hash = previous.event_hash if previous else GENESIS_HASH
        event_id = str(uuid4())
        ts = utcnow()
        safe_meta = mask_metadata(metadata)
        payload = {
            "event_id": event_id,
            "actor_user_id": str(actor_user_id) if actor_user_id else None,
            "action": action,
            "entity_type": entity_type,
            "entity_id": str(entity_id) if entity_id else None,
            "case_id": str(case_id) if case_id else None,
            "timestamp": ts.isoformat(),
            "metadata": safe_meta,
            "previous_event_hash": previous_hash,
        }
        event_hash = sha256_text(canonical_json(payload) + previous_hash)
        entry = AuditLog(
            event_id=event_id,
            actor_user_id=actor_user_id,
            action=action,
            entity_type=entity_type,
            entity_id=str(entity_id) if entity_id else None,
            case_id=case_id,
            timestamp=ts,
            ip_address=ip_address,
            user_agent=(user_agent or "")[:512] or None,
            metadata_json=safe_meta,
            previous_event_hash=previous_hash,
            event_hash=event_hash,
        )
        self.db.add(entry)
        self.db.flush()
        return entry

    def verify_chain(self) -> dict:
        rows = list(self.db.scalars(select(AuditLog).order_by(AuditLog.timestamp.asc(), AuditLog.id.asc())))
        expected_prev = GENESIS_HASH
        broken_at = None
        for index, row in enumerate(rows):
            payload = {
                "event_id": row.event_id,
                "actor_user_id": str(row.actor_user_id) if row.actor_user_id else None,
                "action": row.action,
                "entity_type": row.entity_type,
                "entity_id": row.entity_id,
                "case_id": str(row.case_id) if row.case_id else None,
                "timestamp": row.timestamp.isoformat() if row.timestamp else None,
                "metadata": row.metadata_json or {},
                "previous_event_hash": row.previous_event_hash,
            }
            recomputed = sha256_text(canonical_json(payload) + row.previous_event_hash)
            if row.previous_event_hash != expected_prev or recomputed != row.event_hash:
                broken_at = index
                break
            expected_prev = row.event_hash
        return {
            "valid": broken_at is None,
            "events_checked": len(rows),
            "broken_at_index": broken_at,
        }
