from fastapi import APIRouter, Request
from sqlalchemy import func, select

from app.core.dependencies import CurrentUser, DbSession
from app.core.exceptions import ConflictError, NotFoundError
from app.core.middleware import client_ip
from app.core.security import utcnow
from app.db.models.audit import AuditAction
from app.db.models.case import Case, CaseMember, CaseStatus, PermissionLevel
from app.db.models.document import Document
from app.db.models.evidence import EvidenceItem
from app.db.models.user import User, UserRole
from app.schemas.cases import CaseCreate, CaseOut, CaseUpdate, MemberCreate, MemberOut
from app.schemas.common import Pagination, paginate
from app.services.audit import AuditService
from app.services.authorization import AuthorizationService

router = APIRouter(prefix="/cases", tags=["cases"])


def _visible_cases(db, user: User):
    query = select(Case).where(Case.deleted_at.is_(None))
    if user.role in {UserRole.SYSTEM_ADMIN, UserRole.AUDITOR}:
        return query
    member_ids = select(CaseMember.case_id).where(CaseMember.user_id == user.id)
    return query.where(
        (Case.created_by == user.id)
        | (Case.assigned_officer_id == user.id)
        | (Case.id.in_(member_ids))
    )


@router.post("", response_model=CaseOut, status_code=201)
def create_case(payload: CaseCreate, request: Request, db: DbSession, user: CurrentUser):
    auth = AuthorizationService(db, user)
    if user.role not in {UserRole.SYSTEM_ADMIN, UserRole.INVESTIGATING_OFFICER, UserRole.LEGAL_OFFICER}:
        auth.deny("Your role cannot create cases.")
    if db.scalar(select(Case).where(Case.case_number == payload.case_number)):
        raise ConflictError("Case number already exists.", "CASE_NUMBER_EXISTS")
    case = Case(
        case_number=payload.case_number,
        title=payload.title,
        description=payload.description,
        case_type=payload.case_type,
        priority=payload.priority,
        investigating_department_id=payload.investigating_department_id or user.department_id,
        created_by=user.id,
        assigned_officer_id=payload.assigned_officer_id or user.id,
        status=CaseStatus.UNDER_INVESTIGATION,
    )
    db.add(case)
    db.flush()
    db.add(
        CaseMember(
            case_id=case.id,
            user_id=user.id,
            permission_level=PermissionLevel.OWNER,
            assigned_by=user.id,
        )
    )
    AuditService(db).record(
        action=AuditAction.CASE_CREATE,
        entity_type="case",
        actor_user_id=user.id,
        entity_id=str(case.id),
        case_id=case.id,
        ip_address=client_ip(request),
        user_agent=request.headers.get("user-agent"),
        metadata={"case_number": case.case_number},
    )
    db.commit()
    db.refresh(case)
    return case


@router.get("", response_model=dict)
def list_cases(db: DbSession, user: CurrentUser, params: Pagination):  # type: ignore[assignment]
    query = _visible_cases(db, user).order_by(Case.created_at.desc())
    items, total = paginate(query, db, params)
    return {
        "items": [CaseOut.model_validate(i).model_dump() for i in items],
        "total": total,
        "page": params.page,
        "page_size": params.page_size,
    }


@router.get("/{case_id}", response_model=CaseOut)
def get_case(case_id, db: DbSession, user: CurrentUser):
    auth = AuthorizationService(db, user)
    case = auth.get_case(case_id)
    auth.require_case_access(case)
    return case


@router.patch("/{case_id}", response_model=CaseOut)
def update_case(case_id, payload: CaseUpdate, request: Request, db: DbSession, user: CurrentUser):
    auth = AuthorizationService(db, user)
    case = auth.get_case(case_id)
    auth.require_case_manage(case)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(case, field, value)
    AuditService(db).record(
        action=AuditAction.CASE_UPDATE,
        entity_type="case",
        actor_user_id=user.id,
        entity_id=str(case.id),
        case_id=case.id,
        ip_address=client_ip(request),
        user_agent=request.headers.get("user-agent"),
    )
    db.commit()
    db.refresh(case)
    return case


@router.post("/{case_id}/members", response_model=MemberOut, status_code=201)
def add_member(case_id, payload: MemberCreate, request: Request, db: DbSession, user: CurrentUser):
    auth = AuthorizationService(db, user)
    case = auth.get_case(case_id)
    auth.require_case_manage(case)
    existing = db.scalar(
        select(CaseMember).where(CaseMember.case_id == case.id, CaseMember.user_id == payload.user_id)
    )
    if existing:
        raise ConflictError("User is already a case member.")
    member = CaseMember(
        case_id=case.id,
        user_id=payload.user_id,
        permission_level=payload.permission_level,
        assigned_by=user.id,
    )
    db.add(member)
    db.flush()
    AuditService(db).record(
        action=AuditAction.CASE_MEMBER_ADD,
        entity_type="case_member",
        actor_user_id=user.id,
        entity_id=str(member.id),
        case_id=case.id,
        ip_address=client_ip(request),
        user_agent=request.headers.get("user-agent"),
        metadata={"user_id": str(payload.user_id), "level": payload.permission_level.value},
    )
    db.commit()
    db.refresh(member)
    return member


@router.get("/{case_id}/members", response_model=dict)
def list_members(case_id, db: DbSession, user: CurrentUser, params: Pagination):  # type: ignore[assignment]
    auth = AuthorizationService(db, user)
    case = auth.get_case(case_id)
    auth.require_case_access(case)
    query = select(CaseMember).where(CaseMember.case_id == case.id)
    items, total = paginate(query, db, params)
    return {
        "items": [MemberOut.model_validate(i).model_dump() for i in items],
        "total": total,
        "page": params.page,
        "page_size": params.page_size,
    }


@router.delete("/{case_id}/members/{user_id}", status_code=204)
def remove_member(case_id, user_id, request: Request, db: DbSession, user: CurrentUser):
    auth = AuthorizationService(db, user)
    case = auth.get_case(case_id)
    auth.require_case_manage(case)
    member = db.scalar(
        select(CaseMember).where(CaseMember.case_id == case.id, CaseMember.user_id == user_id)
    )
    if not member:
        raise NotFoundError("Member not found.")
    db.delete(member)
    AuditService(db).record(
        action=AuditAction.CASE_MEMBER_REMOVE,
        entity_type="case_member",
        actor_user_id=user.id,
        entity_id=str(user_id),
        case_id=case.id,
        ip_address=client_ip(request),
        user_agent=request.headers.get("user-agent"),
    )
    db.commit()


@router.post("/{case_id}/close", response_model=CaseOut)
def close_case(case_id, request: Request, db: DbSession, user: CurrentUser):
    auth = AuthorizationService(db, user)
    case = auth.get_case(case_id)
    auth.require_case_manage(case)
    case.status = CaseStatus.CLOSED
    case.closed_at = utcnow()
    AuditService(db).record(
        action=AuditAction.CASE_CLOSE,
        entity_type="case",
        actor_user_id=user.id,
        entity_id=str(case.id),
        case_id=case.id,
        ip_address=client_ip(request),
        user_agent=request.headers.get("user-agent"),
    )
    db.commit()
    db.refresh(case)
    return case


@router.get("/{case_id}/summary")
def case_summary(case_id, db: DbSession, user: CurrentUser):
    auth = AuthorizationService(db, user)
    case = auth.get_case(case_id)
    auth.require_case_access(case)
    docs = db.scalar(select(func.count()).select_from(Document).where(Document.case_id == case.id))
    evidence = db.scalar(
        select(func.count()).select_from(EvidenceItem).where(EvidenceItem.case_id == case.id)
    )
    members = db.scalar(select(func.count()).select_from(CaseMember).where(CaseMember.case_id == case.id))
    return {
        "case": CaseOut.model_validate(case).model_dump(),
        "document_count": docs or 0,
        "evidence_count": evidence or 0,
        "member_count": members or 0,
    }
