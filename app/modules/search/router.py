from datetime import datetime

from fastapi import APIRouter, Query
from sqlalchemy import or_, select

from app.core.dependencies import CurrentUser, DbSession
from app.db.models.case import Case, CaseMember
from app.db.models.document import Document, DocumentTag, DocumentType, DocumentVersion
from app.db.models.evidence import EvidenceItem
from app.db.models.user import User, UserRole
from app.schemas.common import Pagination, paginate
from app.schemas.documents import DocumentOut

router = APIRouter(prefix="/search", tags=["search"])


@router.get("/documents", response_model=dict)
def search_documents(
    db: DbSession,
    user: CurrentUser,
    params: Pagination,
    case_number: str | None = None,
    title: str | None = None,
    document_type: DocumentType | None = None,
    classification: str | None = None,
    uploader: str | None = None,
    department_id: str | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    tag: str | None = None,
    ocr_text: str | None = None,
    sha256_hash: str | None = Query(default=None, alias="hash"),
    evidence_number: str | None = None,
):
    query = select(Document).where(Document.deleted_at.is_(None))
    if user.role not in {UserRole.SYSTEM_ADMIN, UserRole.AUDITOR}:
        member_cases = select(CaseMember.case_id).where(CaseMember.user_id == user.id)
        owned = select(Case.id).where(
            (Case.created_by == user.id) | (Case.assigned_officer_id == user.id)
        )
        query = query.where(or_(Document.case_id.in_(member_cases), Document.case_id.in_(owned)))
    if case_number:
        case_ids = select(Case.id).where(Case.case_number.ilike(f"%{case_number}%"))
        query = query.where(Document.case_id.in_(case_ids))
    if title:
        query = query.where(Document.title.ilike(f"%{title}%"))
    if document_type:
        query = query.where(Document.document_type == document_type)
    if classification:
        query = query.where(Document.classification == classification)
    if uploader:
        user_ids = select(User.id).where(
            or_(User.email.ilike(f"%{uploader}%"), User.full_name.ilike(f"%{uploader}%"))
        )
        query = query.where(Document.uploaded_by.in_(user_ids))
    if department_id:
        query = query.where(Document.owner_department_id == department_id)
    if date_from:
        query = query.where(Document.created_at >= date_from)
    if date_to:
        query = query.where(Document.created_at <= date_to)
    if tag:
        tagged = select(DocumentTag.document_id).where(DocumentTag.tag == tag.lower())
        query = query.where(Document.id.in_(tagged))
    if ocr_text:
        versions = select(DocumentVersion.document_id).where(
            DocumentVersion.ocr_text.ilike(f"%{ocr_text}%")
        )
        query = query.where(Document.id.in_(versions))
    if sha256_hash:
        versions = select(DocumentVersion.document_id).where(DocumentVersion.sha256_hash == sha256_hash)
        query = query.where(Document.id.in_(versions))
    if evidence_number:
        evid = select(EvidenceItem.document_id).where(
            EvidenceItem.evidence_number.ilike(f"%{evidence_number}%")
        )
        query = query.where(Document.id.in_(evid))
    query = query.order_by(Document.created_at.desc())
    items, total = paginate(query, db, params)
    return {
        "items": [DocumentOut.model_validate(i).model_dump() for i in items],
        "total": total,
        "page": params.page,
        "page_size": params.page_size,
    }
