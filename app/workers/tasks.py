import logging
from uuid import UUID

from app.services.antivirus import get_antivirus
from app.services.hashing import sha256_bytes
from app.services.notifications import get_notifications
from app.services.ocr import get_ocr
from app.services.storage import get_storage
from app.workers.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="app.workers.tasks.scan_version")
def scan_version(version_id: str) -> str:
    from app.db.models.document import DocumentVersion, VirusScanStatus
    from app.db.session import get_session_factory

    db = get_session_factory()()
    try:
        version = db.get(DocumentVersion, UUID(version_id))
        if not version:
            return "missing"
        data = get_storage().get(version.storage_key)
        version.virus_scan_status = get_antivirus().scan(data, version.original_filename)
        db.commit()
        return version.virus_scan_status.value
    finally:
        db.close()


@celery_app.task(name="app.workers.tasks.extract_ocr")
def extract_ocr(version_id: str) -> str:
    from app.db.models.document import DocumentVersion
    from app.db.session import get_session_factory

    db = get_session_factory()()
    try:
        version = db.get(DocumentVersion, UUID(version_id))
        if not version:
            return "missing"
        data = get_storage().get(version.storage_key)
        text, status = get_ocr().extract(data, version.mime_type)
        version.ocr_text = text
        version.ocr_status = status
        db.commit()
        return status.value
    finally:
        db.close()


@celery_app.task(name="app.workers.tasks.verify_integrity_job")
def verify_integrity_job(version_id: str) -> bool:
    from app.db.models.document import DocumentVersion
    from app.db.session import get_session_factory

    db = get_session_factory()()
    try:
        version = db.get(DocumentVersion, UUID(version_id))
        if not version:
            return False
        data = get_storage().get(version.storage_key)
        return sha256_bytes(data) == version.sha256_hash
    finally:
        db.close()


@celery_app.task(name="app.workers.tasks.notify_retention")
def notify_retention(email: str, document_id: str) -> None:
    get_notifications().send(
        email,
        "Retention notice",
        f"Document {document_id} is approaching its retention date. This is a demo notification.",
    )


@celery_app.task(name="app.workers.tasks.update_search_index")
def update_search_index(document_id: str) -> str:
    logger.info("search index update queued for %s (PostgreSQL FTS / future OpenSearch)", document_id)
    return "queued"
