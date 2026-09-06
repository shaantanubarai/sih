from datetime import timedelta
from hashlib import sha256
from secrets import token_urlsafe

from fastapi import APIRouter, Request
from fastapi.responses import Response
from sqlalchemy import select

from app.core.dependencies import CurrentUser, DbSession
from app.core.exceptions import AppError, NotFoundError
from app.core.middleware import client_ip
from app.core.security import utcnow
from app.db.models.audit import AuditAction
from app.db.models.document import PermissionType, VirusScanStatus
from app.db.models.sharing import ShareLink
from app.schemas.common import Pagination, paginate
from app.schemas.documents import ShareLinkCreate, ShareLinkOut
from app.services.audit import AuditService
from app.services.authorization import AuthorizationService
from app.services.storage import get_storage
from app.db.models.document import DocumentVersion

router = APIRouter(tags=["sharing"])


def _hash(token: str) -> str:
    return sha256(token.encode()).hexdigest()


@router.post("/documents/{document_id}/share-links", response_model=ShareLinkOut, status_code=201)
def create_share_link(
    document_id, payload: ShareLinkCreate, request: Request, db: DbSession, user: CurrentUser
):
    auth = AuthorizationService(db, user)
    document = auth.get_document(document_id)
    auth.require_document_access(document, PermissionType.SHARE)
    raw = token_urlsafe(32)
    link = ShareLink(
        document_id=document.id,
        created_by=user.id,
        token_hash=_hash(raw),
        recipient_email=str(payload.recipient_email) if payload.recipient_email else None,
        expires_at=utcnow() + timedelta(minutes=payload.expires_minutes),
        max_downloads=payload.max_downloads,
    )
    db.add(link)
    db.flush()
    AuditService(db).record(
        action=AuditAction.SHARE_LINK_CREATE,
        entity_type="share_link",
        actor_user_id=user.id,
        entity_id=str(link.id),
        case_id=document.case_id,
        ip_address=client_ip(request),
        user_agent=request.headers.get("user-agent"),
        metadata={"recipient": link.recipient_email},
    )
    db.commit()
    db.refresh(link)
    out = ShareLinkOut(
        id=link.id,
        document_id=link.document_id,
        token=raw,
        recipient_email=link.recipient_email,
        expires_at=link.expires_at,
        max_downloads=link.max_downloads,
        download_count=link.download_count,
        is_revoked=link.is_revoked,
    )
    return out


@router.get("/documents/{document_id}/share-links", response_model=dict)
def list_share_links(
    document_id, db: DbSession, user: CurrentUser, params: Pagination,
):
    auth = AuthorizationService(db, user)
    document = auth.get_document(document_id)
    auth.require_document_access(document, PermissionType.SHARE)
    query = select(ShareLink).where(ShareLink.document_id == document.id)
    items, total = paginate(query, db, params)
    return {
        "items": [
            ShareLinkOut(
                id=i.id,
                document_id=i.document_id,
                token=None,
                recipient_email=i.recipient_email,
                expires_at=i.expires_at,
                max_downloads=i.max_downloads,
                download_count=i.download_count,
                is_revoked=i.is_revoked,
            ).model_dump()
            for i in items
        ],
        "total": total,
        "page": params.page,
        "page_size": params.page_size,
    }


@router.post("/share-links/{share_token}/download")
def download_share_link(share_token: str, request: Request, db: DbSession):
    link = db.scalar(select(ShareLink).where(ShareLink.token_hash == _hash(share_token)))
    if not link:
        raise NotFoundError("Share link not found.")
    if link.is_revoked or link.expires_at.replace(tzinfo=None) < utcnow().replace(tzinfo=None):
        raise AppError("SHARE_EXPIRED", "Share link is expired or revoked.", 403)
    if link.download_count >= link.max_downloads:
        raise AppError("SHARE_LIMIT", "Download limit reached.", 403)
    from app.db.models.document import Document

    document = db.get(Document, link.document_id)
    if not document or not document.current_version_id:
        raise NotFoundError("Document not found.")
    version = db.get(DocumentVersion, document.current_version_id)
    if not version or version.virus_scan_status != VirusScanStatus.CLEAN:
        raise AppError("FILE_NOT_APPROVED", "File is not approved for download.", 403)
    data = get_storage().get(version.storage_key)
    link.download_count += 1
    AuditService(db).record(
        action=AuditAction.SHARE_LINK_DOWNLOAD,
        entity_type="share_link",
        entity_id=str(link.id),
        case_id=document.case_id,
        ip_address=client_ip(request),
        user_agent=request.headers.get("user-agent"),
    )
    db.commit()
    return Response(
        content=data,
        media_type=version.mime_type,
        headers={"Content-Disposition": f'attachment; filename="{version.original_filename}"'},
    )


@router.post("/share-links/{share_token}/revoke", status_code=204)
def revoke_share_link(share_token: str, request: Request, db: DbSession, user: CurrentUser):
    link = db.scalar(select(ShareLink).where(ShareLink.token_hash == _hash(share_token)))
    if not link:
        raise NotFoundError("Share link not found.")
    auth = AuthorizationService(db, user)
    document = auth.get_document(link.document_id)
    auth.require_document_access(document, PermissionType.SHARE)
    link.is_revoked = True
    AuditService(db).record(
        action=AuditAction.SHARE_LINK_REVOKE,
        entity_type="share_link",
        actor_user_id=user.id,
        entity_id=str(link.id),
        case_id=document.case_id,
        ip_address=client_ip(request),
        user_agent=request.headers.get("user-agent"),
    )
    db.commit()
