from fastapi import APIRouter, Request

from app.core.dependencies import CurrentUser, DbSession
from app.core.exceptions import NotFoundError
from app.core.middleware import client_ip
from app.db.models.audit import AuditAction
from app.db.models.document import DocumentVersion, PermissionType
from app.db.models.signature import DocumentSignature
from app.schemas.audit import SignatureOut, SignatureVerifyOut
from app.services.audit import AuditService
from app.services.authorization import AuthorizationService
from app.services.signatures import get_signature_provider
from app.services.storage import get_storage
from app.services.hashing import sha256_bytes

router = APIRouter(tags=["signatures"])

DISCLAIMER = (
    "This signature is a demonstration mock and is not legally valid. "
    "Do not treat it as a qualified electronic signature or court-admissible seal."
)


@router.post(
    "/documents/{document_id}/versions/{version_id}/sign",
    response_model=SignatureOut,
    status_code=201,
)
def sign_version(document_id, version_id, request: Request, db: DbSession, user: CurrentUser):
    auth = AuthorizationService(db, user)
    document = auth.get_document(document_id)
    auth.require_document_access(document, PermissionType.SHARE)
    version = db.get(DocumentVersion, version_id)
    if not version or version.document_id != document.id:
        raise NotFoundError("Version not found.")
    provider = get_signature_provider()
    value = provider.sign(version.sha256_hash, str(user.id), str(version.id))
    sig = DocumentSignature(
        document_id=document.id,
        version_id=version.id,
        signer_id=user.id,
        document_hash=version.sha256_hash,
        signature_value=value,
        algorithm="MOCK-HMAC-SHA256",
        is_mock=True,
    )
    db.add(sig)
    db.flush()
    AuditService(db).record(
        action=AuditAction.SIGNATURE_CREATE,
        entity_type="signature",
        actor_user_id=user.id,
        entity_id=str(sig.id),
        case_id=document.case_id,
        ip_address=client_ip(request),
        user_agent=request.headers.get("user-agent"),
        metadata={"version_id": str(version.id), "is_mock": True},
    )
    db.commit()
    db.refresh(sig)
    return sig


@router.get("/documents/{document_id}/signatures")
def list_signatures(document_id, db: DbSession, user: CurrentUser):
    auth = AuthorizationService(db, user)
    document = auth.get_document(document_id)
    auth.require_document_access(document)
    from sqlalchemy import select

    rows = list(
        db.scalars(select(DocumentSignature).where(DocumentSignature.document_id == document.id))
    )
    return {
        "items": [SignatureOut.model_validate(r).model_dump() for r in rows],
        "disclaimer": DISCLAIMER,
    }


@router.get("/signatures/{signature_id}/verify", response_model=SignatureVerifyOut)
def verify_signature(signature_id, request: Request, db: DbSession, user: CurrentUser):
    sig = db.get(DocumentSignature, signature_id)
    if not sig:
        raise NotFoundError("Signature not found.")
    auth = AuthorizationService(db, user)
    document = auth.get_document(sig.document_id)
    auth.require_document_access(document)
    version = db.get(DocumentVersion, sig.version_id)
    valid = False
    if version and version.document_id == document.id and version.sha256_hash == sig.document_hash:
        # A mock signature still binds to the immutable, persisted file bytes.
        actual_hash = sha256_bytes(get_storage().get(version.storage_key))
        valid = get_signature_provider().verify(
            sig.document_hash, str(sig.signer_id), str(sig.version_id), sig.signature_value
        ) and actual_hash == sig.document_hash
    AuditService(db).record(
        action=AuditAction.SIGNATURE_VERIFY,
        entity_type="signature",
        actor_user_id=user.id,
        entity_id=str(sig.id),
        case_id=document.case_id,
        ip_address=client_ip(request),
        user_agent=request.headers.get("user-agent"),
        metadata={"valid": valid, "version_id": str(sig.version_id)},
    )
    db.commit()
    return SignatureVerifyOut(valid=valid, is_mock=True, disclaimer=DISCLAIMER)
