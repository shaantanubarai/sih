from fastapi import APIRouter, Request
from sqlalchemy import select

from app.core.dependencies import CurrentUser, DbSession
from app.core.middleware import client_ip
from app.db.models.audit import AuditAction, AuditLog
from app.db.models.user import UserRole
from app.schemas.audit import AuditLogOut, AuditVerifyOut
from app.schemas.common import Pagination, paginate
from app.services.audit import AuditService
from app.services.authorization import AuthorizationService

router = APIRouter(prefix="/audit-logs", tags=["audit"])


@router.get("", response_model=dict)
def list_audit_logs(db: DbSession, user: CurrentUser, params: Pagination):  # type: ignore[assignment]
    if user.role not in {UserRole.SYSTEM_ADMIN, UserRole.AUDITOR}:
        AuthorizationService(db, user).deny("Audit logs are restricted.", "AUDIT_ACCESS_DENIED")
    query = select(AuditLog).order_by(AuditLog.timestamp.desc())
    items, total = paginate(query, db, params)
    return {
        "items": [AuditLogOut.model_validate(i).model_dump() for i in items],
        "total": total,
        "page": params.page,
        "page_size": params.page_size,
    }


@router.get("/{entity_type}/{entity_id}", response_model=dict)
def entity_audit(
    entity_type: str,
    entity_id: str,
    db: DbSession,
    user: CurrentUser,
    params: Pagination,  # type: ignore[assignment]
):
    if user.role not in {UserRole.SYSTEM_ADMIN, UserRole.AUDITOR}:
        AuthorizationService(db, user).deny("Audit logs are restricted.", "AUDIT_ACCESS_DENIED")
    query = (
        select(AuditLog)
        .where(AuditLog.entity_type == entity_type, AuditLog.entity_id == entity_id)
        .order_by(AuditLog.timestamp.desc())
    )
    items, total = paginate(query, db, params)
    return {
        "items": [AuditLogOut.model_validate(i).model_dump() for i in items],
        "total": total,
        "page": params.page,
        "page_size": params.page_size,
    }


@router.post("/verify-integrity", response_model=AuditVerifyOut)
def verify_audit(request: Request, db: DbSession, user: CurrentUser):
    if user.role not in {UserRole.SYSTEM_ADMIN, UserRole.AUDITOR}:
        AuthorizationService(db, user).deny("Audit verification is restricted.")
    result = AuditService(db).verify_chain()
    AuditService(db).record(
        action=AuditAction.AUDIT_VERIFY,
        entity_type="audit",
        actor_user_id=user.id,
        ip_address=client_ip(request),
        user_agent=request.headers.get("user-agent"),
        metadata={"valid": result["valid"], "events_checked": result["events_checked"]},
    )
    db.commit()
    return result
