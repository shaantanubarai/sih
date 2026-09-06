from fastapi import APIRouter, Request
from sqlalchemy import select

from app.core.dependencies import CurrentUser, DbSession
from app.core.exceptions import ForbiddenError, NotFoundError
from app.core.middleware import client_ip
from app.core.security import utcnow
from app.db.models.audit import AuditAction
from app.db.models.evidence import CustodyTransfer, EvidenceItem, EvidenceStatus
from app.schemas.common import Pagination, paginate
from app.schemas.evidence import CustodyTransferCreate, CustodyTransferOut, EvidenceCreate, EvidenceOut
from app.services.audit import AuditService
from app.services.authorization import AuthorizationService

router = APIRouter(tags=["evidence"])


@router.post("/cases/{case_id}/evidence", response_model=EvidenceOut, status_code=201)
def create_evidence(case_id, payload: EvidenceCreate, request: Request, db: DbSession, user: CurrentUser):
    auth = AuthorizationService(db, user)
    case = auth.get_case(case_id)
    auth.require_case_manage(case)
    item = EvidenceItem(
        case_id=case.id,
        document_id=payload.document_id,
        evidence_number=payload.evidence_number,
        description=payload.description,
        collected_by=user.id,
        collected_at=payload.collected_at,
        location_collected=payload.location_collected,
        current_custodian=user.id,
        status=EvidenceStatus.IN_CUSTODY,
    )
    db.add(item)
    db.flush()
    AuditService(db).record(
        action=AuditAction.EVIDENCE_CREATE,
        entity_type="evidence",
        actor_user_id=user.id,
        entity_id=str(item.id),
        case_id=case.id,
        ip_address=client_ip(request),
        user_agent=request.headers.get("user-agent"),
        metadata={"evidence_number": item.evidence_number},
    )
    db.commit()
    db.refresh(item)
    return item


@router.get("/cases/{case_id}/evidence", response_model=dict)
def list_evidence(case_id, db: DbSession, user: CurrentUser, params: Pagination):  # type: ignore[assignment]
    auth = AuthorizationService(db, user)
    case = auth.get_case(case_id)
    auth.require_case_access(case)
    query = select(EvidenceItem).where(EvidenceItem.case_id == case.id)
    items, total = paginate(query, db, params)
    return {
        "items": [EvidenceOut.model_validate(i).model_dump() for i in items],
        "total": total,
        "page": params.page,
        "page_size": params.page_size,
    }


@router.get("/evidence/{evidence_id}", response_model=EvidenceOut)
def get_evidence(evidence_id, db: DbSession, user: CurrentUser):
    item = db.get(EvidenceItem, evidence_id)
    if not item:
        raise NotFoundError("Evidence not found.")
    auth = AuthorizationService(db, user)
    case = auth.get_case(item.case_id)
    auth.require_case_access(case)
    return item


@router.post("/evidence/{evidence_id}/transfer", response_model=CustodyTransferOut, status_code=201)
def transfer_custody(
    evidence_id, payload: CustodyTransferCreate, request: Request, db: DbSession, user: CurrentUser
):
    item = db.get(EvidenceItem, evidence_id)
    if not item:
        raise NotFoundError("Evidence not found.")
    auth = AuthorizationService(db, user)
    case = auth.get_case(item.case_id)
    auth.require_case_access(case)
    if item.current_custodian != user.id and not auth.is_admin():
        raise ForbiddenError("Only the current custodian can transfer custody.", "CUSTODY_DENIED")
    transfer = CustodyTransfer(
        evidence_item_id=item.id,
        from_user_id=user.id,
        to_user_id=payload.to_user_id,
        transferred_at=utcnow(),
        reason=payload.reason,
        location=payload.location,
        notes=payload.notes,
        digital_signature_reference=payload.digital_signature_reference,
    )
    db.add(transfer)
    item.current_custodian = payload.to_user_id
    item.status = EvidenceStatus.TRANSFERRED
    db.flush()
    AuditService(db).record(
        action=AuditAction.CUSTODY_TRANSFER,
        entity_type="custody_transfer",
        actor_user_id=user.id,
        entity_id=str(transfer.id),
        case_id=item.case_id,
        ip_address=client_ip(request),
        user_agent=request.headers.get("user-agent"),
        metadata={"to_user": str(payload.to_user_id)},
    )
    db.commit()
    db.refresh(transfer)
    return transfer


@router.get("/evidence/{evidence_id}/custody-history", response_model=dict)
def custody_history(
    evidence_id, db: DbSession, user: CurrentUser, params: Pagination  # type: ignore[assignment]
):
    item = db.get(EvidenceItem, evidence_id)
    if not item:
        raise NotFoundError("Evidence not found.")
    auth = AuthorizationService(db, user)
    case = auth.get_case(item.case_id)
    auth.require_case_access(case)
    query = (
        select(CustodyTransfer)
        .where(CustodyTransfer.evidence_item_id == item.id)
        .order_by(CustodyTransfer.transferred_at.asc())
    )
    items, total = paginate(query, db, params)
    return {
        "items": [CustodyTransferOut.model_validate(i).model_dump() for i in items],
        "total": total,
        "page": params.page,
        "page_size": params.page_size,
    }
