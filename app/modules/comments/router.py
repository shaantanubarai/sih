from fastapi import APIRouter, Request
from sqlalchemy import select

from app.core.dependencies import CurrentUser, DbSession
from app.core.exceptions import ForbiddenError, NotFoundError
from app.core.middleware import client_ip
from app.db.models.audit import AuditAction
from app.db.models.comment import Comment
from app.db.models.document import PermissionType
from app.schemas.common import Pagination, paginate
from app.schemas.documents import CommentCreate, CommentOut, CommentUpdate
from app.services.audit import AuditService
from app.services.authorization import AuthorizationService
from app.db.models.user import UserRole

router = APIRouter(tags=["comments"])


@router.post("/documents/{document_id}/comments", response_model=CommentOut, status_code=201)
def create_comment(document_id, payload: CommentCreate, request: Request, db: DbSession, user: CurrentUser):
    auth = AuthorizationService(db, user)
    document = auth.get_document(document_id)
    auth.require_document_access(document, PermissionType.COMMENT)
    if user.role == UserRole.VIEWER:
        raise ForbiddenError("Viewers cannot comment.")
    comment = Comment(
        document_id=document.id,
        version_id=payload.version_id or document.current_version_id,
        user_id=user.id,
        content=payload.content,
        page_number=payload.page_number,
    )
    db.add(comment)
    db.flush()
    AuditService(db).record(
        action=AuditAction.COMMENT_CREATE,
        entity_type="comment",
        actor_user_id=user.id,
        entity_id=str(comment.id),
        case_id=document.case_id,
        ip_address=client_ip(request),
        user_agent=request.headers.get("user-agent"),
    )
    db.commit()
    db.refresh(comment)
    return comment


@router.get("/documents/{document_id}/comments", response_model=dict)
def list_comments(
    document_id, db: DbSession, user: CurrentUser, params: Pagination,
):
    auth = AuthorizationService(db, user)
    document = auth.get_document(document_id)
    auth.require_document_access(document)
    query = (
        select(Comment)
        .where(Comment.document_id == document.id, Comment.deleted_at.is_(None))
        .order_by(Comment.created_at.desc())
    )
    items, total = paginate(query, db, params)
    return {
        "items": [CommentOut.model_validate(i).model_dump() for i in items],
        "total": total,
        "page": params.page,
        "page_size": params.page_size,
    }


@router.patch("/comments/{comment_id}", response_model=CommentOut)
def update_comment(comment_id, payload: CommentUpdate, request: Request, db: DbSession, user: CurrentUser):
    comment = db.get(Comment, comment_id)
    if not comment:
        raise NotFoundError("Comment not found.")
    if comment.user_id != user.id and user.role.value != "SYSTEM_ADMIN":
        raise ForbiddenError("You can only edit your own comments.")
    comment.content = payload.content
    AuditService(db).record(
        action=AuditAction.COMMENT_UPDATE,
        entity_type="comment",
        actor_user_id=user.id,
        entity_id=str(comment.id),
        ip_address=client_ip(request),
        user_agent=request.headers.get("user-agent"),
    )
    db.commit()
    db.refresh(comment)
    return comment


@router.post("/comments/{comment_id}/resolve", response_model=CommentOut)
def resolve_comment(comment_id, request: Request, db: DbSession, user: CurrentUser):
    comment = db.get(Comment, comment_id)
    if not comment:
        raise NotFoundError("Comment not found.")
    auth = AuthorizationService(db, user)
    document = auth.get_document(comment.document_id)
    auth.require_document_access(document, PermissionType.COMMENT)
    comment.is_resolved = True
    AuditService(db).record(
        action=AuditAction.COMMENT_RESOLVE,
        entity_type="comment",
        actor_user_id=user.id,
        entity_id=str(comment.id),
        case_id=document.case_id,
        ip_address=client_ip(request),
        user_agent=request.headers.get("user-agent"),
    )
    db.commit()
    db.refresh(comment)
    return comment
