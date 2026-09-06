from uuid import UUID, uuid4

from fastapi import APIRouter, File, Form, Request, UploadFile
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependencies import CurrentUser, DbSession
from app.core.exceptions import AppError, ForbiddenError, NotFoundError
from app.core.middleware import client_ip
from app.db.models.audit import AuditAction
from app.db.models.document import (
    Document,
    DocumentPermission,
    DocumentStatus,
    DocumentTag,
    DocumentType,
    DocumentVersion,
    OcrStatus,
    PermissionType,
    VirusScanStatus,
)
from app.schemas.common import Pagination, paginate
from app.schemas.documents import (
    DocumentCreate,
    DocumentMetadataUpdate,
    DocumentOut,
    PermissionCreate,
    PermissionOut,
    VersionOut,
)
from app.services.antivirus import get_antivirus
from app.services.audit import AuditService
from app.services.authorization import AuthorizationService
from app.services.files import detect_mime, enforce_size
from app.services.hashing import sha256_bytes
from app.services.ocr import get_ocr
from app.services.storage import get_storage

router = APIRouter(tags=["documents"])


def _enqueue_or_run_scan(db: Session, version: DocumentVersion, data: bytes) -> None:
    result = get_antivirus().scan(data, version.original_filename)
    version.virus_scan_status = result
    text, status = get_ocr().extract(data, version.mime_type)
    version.ocr_text = text
    version.ocr_status = status
    version.extracted_metadata_json = f'{{"bytes": {len(data)}, "mime": "{version.mime_type}"}}'


def create_version(
    db: Session,
    document: Document,
    user,
    file_bytes: bytes,
    filename: str,
    declared_mime: str | None,
    change_reason: str | None,
    request: Request,
) -> DocumentVersion:
    enforce_size(file_bytes)
    mime = detect_mime(file_bytes, filename, declared_mime)
    upload_digest = sha256_bytes(file_bytes)
    latest = db.scalar(
        select(DocumentVersion)
        .where(DocumentVersion.document_id == document.id)
        .order_by(DocumentVersion.version_number.desc())
    )
    version_number = (latest.version_number + 1) if latest else 1
    storage_key = f"cases/{document.case_id}/documents/{document.id}/v{version_number}-{uuid4().hex}"
    storage = get_storage()
    storage.put(storage_key, file_bytes, mime)
    # The ledger must attest to the bytes actually persisted, not merely the
    # request body.  This detects a broken storage adapter or corrupt write.
    stored_bytes = storage.get(storage_key)
    digest = sha256_bytes(stored_bytes)
    if digest != upload_digest or len(stored_bytes) != len(file_bytes):
        raise AppError(
            "STORAGE_INTEGRITY_FAILURE",
            "Stored object does not match the uploaded content.",
            503,
        )
    version = DocumentVersion(
        document_id=document.id,
        version_number=version_number,
        storage_key=storage_key,
        original_filename=filename,
        mime_type=mime,
        file_size=len(file_bytes),
        sha256_hash=digest,
        uploaded_by=user.id,
        change_reason=change_reason,
        virus_scan_status=VirusScanStatus.PENDING,
        ocr_status=OcrStatus.QUEUED,
    )
    db.add(version)
    db.flush()
    _enqueue_or_run_scan(db, version, file_bytes)
    document.current_version_id = version.id
    AuditService(db).record(
        action=AuditAction.DOCUMENT_VERSION_CREATE,
        entity_type="document_version",
        actor_user_id=user.id,
        entity_id=str(version.id),
        case_id=document.case_id,
        ip_address=client_ip(request),
        user_agent=request.headers.get("user-agent"),
        metadata={
            "document_id": str(document.id),
            "version": version_number,
            "sha256": digest,
            "filename": filename,
        },
    )
    return version


@router.post("/cases/{case_id}/documents", response_model=dict, status_code=201)
async def create_document(
    case_id,
    request: Request,
    db: DbSession,
    user: CurrentUser,
    file: UploadFile = File(...),
    document_number: str = Form(...),
    title: str = Form(...),
    document_type: DocumentType = Form(...),
    description: str | None = Form(None),
    classification: str = Form("CONFIDENTIAL"),
    is_evidence: bool = Form(False),
    tags: str = Form(""),
    change_reason: str = Form("Initial upload"),
):
    auth = AuthorizationService(db, user)
    case = auth.get_case(case_id)
    auth.require_upload(case)
    payload = DocumentCreate(
        document_number=document_number,
        title=title,
        description=description,
        document_type=document_type,
        is_evidence=is_evidence,
        change_reason=change_reason,
        tags=[t.strip() for t in tags.split(",") if t.strip()],
    )
    document = Document(
        case_id=case.id,
        document_number=payload.document_number,
        title=payload.title,
        description=payload.description,
        document_type=payload.document_type,
        classification=payload.classification,
        status=DocumentStatus.ACTIVE,
        uploaded_by=user.id,
        owner_department_id=user.department_id,
        is_evidence=payload.is_evidence,
    )
    db.add(document)
    db.flush()
    for tag in payload.tags:
        db.add(DocumentTag(document_id=document.id, tag=tag.lower()))
    data = await file.read()
    version = create_version(
        db, document, user, data, file.filename or "upload.bin", file.content_type, payload.change_reason, request
    )
    AuditService(db).record(
        action=AuditAction.DOCUMENT_CREATE,
        entity_type="document",
        actor_user_id=user.id,
        entity_id=str(document.id),
        case_id=case.id,
        ip_address=client_ip(request),
        user_agent=request.headers.get("user-agent"),
        metadata={"title": document.title, "type": document.document_type.value},
    )
    db.commit()
    db.refresh(document)
    db.refresh(version)
    return {
        "document": DocumentOut.model_validate(document).model_dump(),
        "version": VersionOut.model_validate(version).model_dump(),
    }


@router.get("/cases/{case_id}/documents", response_model=dict)
def list_case_documents(
    case_id, db: DbSession, user: CurrentUser, params: Pagination  # type: ignore[assignment]
):
    auth = AuthorizationService(db, user)
    case = auth.get_case(case_id)
    auth.require_case_access(case)
    query = (
        select(Document)
        .where(Document.case_id == case.id, Document.deleted_at.is_(None))
        .order_by(Document.created_at.desc())
    )
    items, total = paginate(query, db, params)
    return {
        "items": [DocumentOut.model_validate(i).model_dump() for i in items],
        "total": total,
        "page": params.page,
        "page_size": params.page_size,
    }


@router.get("/documents/{document_id}", response_model=DocumentOut)
def get_document(document_id, request: Request, db: DbSession, user: CurrentUser):
    auth = AuthorizationService(db, user)
    document = auth.get_document(document_id)
    auth.require_document_access(document, PermissionType.VIEW)
    AuditService(db).record(
        action=AuditAction.DOCUMENT_VIEW,
        entity_type="document",
        actor_user_id=user.id,
        entity_id=str(document.id),
        case_id=document.case_id,
        ip_address=client_ip(request),
        user_agent=request.headers.get("user-agent"),
    )
    db.commit()
    return document


@router.patch("/documents/{document_id}/metadata", response_model=DocumentOut)
def update_metadata(
    document_id, payload: DocumentMetadataUpdate, request: Request, db: DbSession, user: CurrentUser
):
    auth = AuthorizationService(db, user)
    document = auth.get_document(document_id)
    auth.require_version_upload(document)
    data = payload.model_dump(exclude_unset=True)
    tags = data.pop("tags", None)
    for key, value in data.items():
        setattr(document, key, value)
    if tags is not None:
        existing = db.scalars(select(DocumentTag).where(DocumentTag.document_id == document.id))
        for row in existing:
            db.delete(row)
        for tag in tags:
            db.add(DocumentTag(document_id=document.id, tag=tag.lower()))
    AuditService(db).record(
        action=AuditAction.DOCUMENT_METADATA_UPDATE,
        entity_type="document",
        actor_user_id=user.id,
        entity_id=str(document.id),
        case_id=document.case_id,
        ip_address=client_ip(request),
        user_agent=request.headers.get("user-agent"),
    )
    db.commit()
    db.refresh(document)
    return document


@router.post("/documents/{document_id}/versions", response_model=VersionOut, status_code=201)
async def add_version(
    document_id,
    request: Request,
    db: DbSession,
    user: CurrentUser,
    file: UploadFile = File(...),
    change_reason: str = Form("Updated version"),
):
    auth = AuthorizationService(db, user)
    document = auth.get_document(document_id)
    auth.require_version_upload(document)
    # Serialize version-number allocation for this document. PostgreSQL locks
    # the document row until the new immutable version is committed.
    document = db.scalar(select(Document).where(Document.id == document.id).with_for_update())
    data = await file.read()
    version = create_version(
        db, document, user, data, file.filename or "upload.bin", file.content_type, change_reason, request
    )
    db.commit()
    db.refresh(version)
    return version


@router.get("/documents/{document_id}/versions", response_model=dict)
def list_versions(
    document_id, db: DbSession, user: CurrentUser, params: Pagination  # type: ignore[assignment]
):
    auth = AuthorizationService(db, user)
    document = auth.get_document(document_id)
    auth.require_document_access(document)
    AuditService(db).record(
        action=AuditAction.DOCUMENT_VERSION_VIEW,
        entity_type="document",
        actor_user_id=user.id,
        entity_id=str(document.id),
        case_id=document.case_id,
        ip_address=None,
        metadata={"operation": "list_versions"},
    )
    db.commit()
    query = (
        select(DocumentVersion)
        .where(DocumentVersion.document_id == document.id)
        .order_by(DocumentVersion.version_number.desc())
    )
    items, total = paginate(query, db, params)
    return {
        "items": [VersionOut.model_validate(i).model_dump() for i in items],
        "total": total,
        "page": params.page,
        "page_size": params.page_size,
    }


@router.get("/documents/{document_id}/versions/{version_id}", response_model=VersionOut)
def get_version(document_id, version_id, request: Request, db: DbSession, user: CurrentUser):
    auth = AuthorizationService(db, user)
    document = auth.get_document(document_id)
    auth.require_document_access(document)
    version = db.get(DocumentVersion, version_id)
    if not version or version.document_id != document.id:
        raise NotFoundError("Version not found.")
    AuditService(db).record(
        action=AuditAction.DOCUMENT_VERSION_VIEW,
        entity_type="document_version",
        actor_user_id=user.id,
        entity_id=str(version.id),
        case_id=document.case_id,
        ip_address=client_ip(request),
        user_agent=request.headers.get("user-agent"),
    )
    db.commit()
    return version


@router.get("/documents/{document_id}/download")
def download_document(document_id, request: Request, db: DbSession, user: CurrentUser, version_id=None):
    auth = AuthorizationService(db, user)
    document = auth.get_document(document_id)
    try:
        auth.require_document_access(document, PermissionType.DOWNLOAD)
    except ForbiddenError:
        AuditService(db).record(
            action=AuditAction.DOCUMENT_ACCESS_DENIED,
            entity_type="document",
            actor_user_id=user.id,
            entity_id=str(document.id),
            case_id=document.case_id,
            ip_address=client_ip(request),
            user_agent=request.headers.get("user-agent"),
            metadata={"operation": "download"},
        )
        db.commit()
        raise
    vid = version_id or document.current_version_id
    version = db.get(DocumentVersion, vid) if vid else None
    if not version or version.document_id != document.id:
        raise NotFoundError("Version not found.")
    if version.virus_scan_status != VirusScanStatus.CLEAN:
        raise AppError("FILE_NOT_APPROVED", "File is not approved for download.", 403)
    data = get_storage().get(version.storage_key)
    AuditService(db).record(
        action=AuditAction.DOCUMENT_DOWNLOAD,
        entity_type="document_version",
        actor_user_id=user.id,
        entity_id=str(version.id),
        case_id=document.case_id,
        ip_address=client_ip(request),
        user_agent=request.headers.get("user-agent"),
        metadata={"document_id": str(document.id)},
    )
    db.commit()
    return Response(
        content=data,
        media_type=version.mime_type,
        headers={"Content-Disposition": f'attachment; filename="{version.original_filename}"'},
    )


@router.get("/documents/{document_id}/verify-integrity")
def verify_integrity(
    document_id,
    request: Request,
    db: DbSession,
    user: CurrentUser,
    version_id: UUID | None = None,
):
    auth = AuthorizationService(db, user)
    document = auth.get_document(document_id)
    auth.require_document_access(document)
    target_id = version_id or document.current_version_id
    version = db.get(DocumentVersion, target_id) if target_id else None
    if version and version.document_id != document.id:
        raise NotFoundError("Version not found.")
    if not version:
        raise NotFoundError("No current version.")
    stored = get_storage().get(version.storage_key)
    actual = sha256_bytes(stored)
    matches = actual == version.sha256_hash
    AuditService(db).record(
        action=AuditAction.INTEGRITY_VERIFY,
        entity_type="document_version",
        actor_user_id=user.id,
        entity_id=str(version.id),
        case_id=document.case_id,
        ip_address=client_ip(request),
        user_agent=request.headers.get("user-agent"),
        metadata={"matches": matches},
    )
    db.commit()
    return {
        "document_id": str(document.id),
        "version_id": str(version.id),
        "stored_sha256": version.sha256_hash,
        "computed_sha256": actual,
        "matches": matches,
    }


@router.post("/documents/{document_id}/permissions", response_model=PermissionOut, status_code=201)
def grant_permission(
    document_id, payload: PermissionCreate, request: Request, db: DbSession, user: CurrentUser
):
    auth = AuthorizationService(db, user)
    document = auth.get_document(document_id)
    auth.require_document_access(document, PermissionType.SHARE)
    perm = DocumentPermission(
        document_id=document.id,
        user_id=payload.user_id,
        role=payload.role,
        permission_type=payload.permission_type,
        expires_at=payload.expires_at,
        granted_by=user.id,
    )
    db.add(perm)
    db.flush()
    AuditService(db).record(
        action=AuditAction.DOCUMENT_PERMISSION_GRANT,
        entity_type="document_permission",
        actor_user_id=user.id,
        entity_id=str(perm.id),
        case_id=document.case_id,
        ip_address=client_ip(request),
        user_agent=request.headers.get("user-agent"),
        metadata={"to_user": str(payload.user_id) if payload.user_id else payload.role},
    )
    db.commit()
    db.refresh(perm)
    return perm


@router.get("/documents/{document_id}/permissions", response_model=dict)
def list_permissions(
    document_id, db: DbSession, user: CurrentUser, params: Pagination  # type: ignore[assignment]
):
    auth = AuthorizationService(db, user)
    document = auth.get_document(document_id)
    auth.require_document_access(document)
    query = select(DocumentPermission).where(
        DocumentPermission.document_id == document.id, DocumentPermission.revoked_at.is_(None)
    )
    items, total = paginate(query, db, params)
    return {
        "items": [PermissionOut.model_validate(i).model_dump() for i in items],
        "total": total,
        "page": params.page,
        "page_size": params.page_size,
    }


@router.delete("/documents/{document_id}/permissions/{permission_id}", status_code=204)
def revoke_permission(
    document_id, permission_id, request: Request, db: DbSession, user: CurrentUser
):
    from app.core.security import utcnow

    auth = AuthorizationService(db, user)
    document = auth.get_document(document_id)
    auth.require_document_access(document, PermissionType.SHARE)
    perm = db.get(DocumentPermission, permission_id)
    if not perm or perm.document_id != document.id:
        raise NotFoundError("Permission not found.")
    perm.revoked_at = utcnow()
    AuditService(db).record(
        action=AuditAction.DOCUMENT_PERMISSION_REVOKE,
        entity_type="document_permission",
        actor_user_id=user.id,
        entity_id=str(perm.id),
        case_id=document.case_id,
        ip_address=client_ip(request),
        user_agent=request.headers.get("user-agent"),
    )
    db.commit()
