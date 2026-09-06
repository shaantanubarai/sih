from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import hash_password
from app.db.models.case import Case, CaseMember, CasePriority, CaseStatus, CaseType, PermissionLevel
from app.db.models.comment import Comment
from app.db.models.department import Department
from app.db.models.document import (
    Classification,
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
from app.db.models.evidence import CustodyTransfer, EvidenceItem, EvidenceStatus
from app.db.models.user import User, UserRole
from app.services.audit import AuditService
from app.services.hashing import sha256_bytes
from app.services.storage import get_storage


def seed(db: Session) -> None:
    if db.scalar(select(User).where(User.email == get_settings().seed_admin_email)):
        return
    settings = get_settings()
    cid = Department(name="Central Investigation Division", code="CID", description="Demo investigation unit")
    legal = Department(name="Legal Affairs Wing", code="LAW", description="Demo legal unit")
    db.add_all([cid, legal])
    db.flush()

    def user(emp, name, email, password, role, dept) -> User:
        row = User(
            employee_id=emp,
            full_name=name,
            email=email,
            phone="0000000000",
            password_hash=hash_password(password),
            role=role,
            department_id=dept,
            is_active=True,
            is_verified=True,
        )
        db.add(row)
        db.flush()
        return row

    admin = user("EMP-ADMIN", "Demo System Admin", settings.seed_admin_email, settings.seed_admin_password, UserRole.SYSTEM_ADMIN, cid.id)
    officer = user("EMP-IO-01", "Demo Investigating Officer", "officer@demo.local", settings.seed_officer_password, UserRole.INVESTIGATING_OFFICER, cid.id)
    legal_off = user("EMP-LO-01", "Demo Legal Officer", "legal@demo.local", settings.seed_legal_password, UserRole.LEGAL_OFFICER, legal.id)
    prosecutor = user("EMP-PR-01", "Demo Prosecutor", "prosecutor@demo.local", settings.seed_prosecutor_password, UserRole.PROSECUTOR, legal.id)
    auditor = user("EMP-AUD-01", "Demo Auditor", "auditor@demo.local", settings.seed_auditor_password, UserRole.AUDITOR, cid.id)
    court = user("EMP-CT-01", "Demo Court User", "court@demo.local", settings.seed_court_password, UserRole.COURT_USER, legal.id)
    viewer = user("EMP-VW-01", "Demo Viewer", "viewer@demo.local", settings.seed_viewer_password, UserRole.VIEWER, cid.id)

    now = datetime.now(UTC)
    case1 = Case(
        case_number="DEMO-CASE-2026-001",
        title="Sample investigation file (fictional)",
        description="Fictional demonstration case. Contains no real persons or events.",
        case_type=CaseType.CRIMINAL_INVESTIGATION,
        status=CaseStatus.UNDER_INVESTIGATION,
        priority=CasePriority.HIGH,
        investigating_department_id=cid.id,
        created_by=officer.id,
        assigned_officer_id=officer.id,
        opened_at=now,
    )
    case2 = Case(
        case_number="DEMO-CASE-2026-002",
        title="Sample court matter (fictional)",
        description="Fictional legal matter for demo sharing workflows.",
        case_type=CaseType.COURT_MATTER,
        status=CaseStatus.PENDING_REVIEW,
        priority=CasePriority.MEDIUM,
        investigating_department_id=legal.id,
        created_by=legal_off.id,
        assigned_officer_id=legal_off.id,
        opened_at=now,
    )
    db.add_all([case1, case2])
    db.flush()
    db.add_all(
        [
            CaseMember(case_id=case1.id, user_id=officer.id, permission_level=PermissionLevel.OWNER, assigned_by=officer.id),
            CaseMember(case_id=case1.id, user_id=legal_off.id, permission_level=PermissionLevel.EDITOR, assigned_by=officer.id),
            CaseMember(case_id=case1.id, user_id=prosecutor.id, permission_level=PermissionLevel.REVIEWER, assigned_by=officer.id),
            CaseMember(case_id=case2.id, user_id=legal_off.id, permission_level=PermissionLevel.OWNER, assigned_by=legal_off.id),
            CaseMember(case_id=case2.id, user_id=court.id, permission_level=PermissionLevel.VIEWER, assigned_by=legal_off.id),
        ]
    )

    fir_body = b"%PDF-1.4\n1 0 obj<<>>endobj\nFictional FIR summary: vehicle theft report filed by a demo complainant. No real identities.\n%%EOF"
    notice_body = b"%PDF-1.4\nFictional legal notice regarding DEMO-CASE-2026-002. Placeholder text only.\n%%EOF"

    def add_doc(case, number, title, dtype, data, uploader, tags):
        doc = Document(
            case_id=case.id,
            document_number=number,
            title=title,
            description="Fictional sample document for demonstration.",
            document_type=dtype,
            classification=Classification.CONFIDENTIAL,
            status=DocumentStatus.ACTIVE,
            uploaded_by=uploader.id,
            owner_department_id=uploader.department_id,
            is_evidence=dtype == DocumentType.EVIDENCE_RECORD,
        )
        db.add(doc)
        db.flush()
        for tag in tags:
            db.add(DocumentTag(document_id=doc.id, tag=tag))
        key = f"cases/{case.id}/documents/{doc.id}/v1-seed"
        get_storage().put(key, data, "application/pdf")
        version = DocumentVersion(
            document_id=doc.id,
            version_number=1,
            storage_key=key,
            original_filename=f"{number}.pdf",
            mime_type="application/pdf",
            file_size=len(data),
            sha256_hash=sha256_bytes(data),
            uploaded_by=uploader.id,
            change_reason="Seed data",
            virus_scan_status=VirusScanStatus.CLEAN,
            ocr_status=OcrStatus.COMPLETED,
            ocr_text="fictional demo ocr text vehicle theft placeholder",
        )
        db.add(version)
        db.flush()
        doc.current_version_id = version.id
        return doc, version

    fir, fir_v = add_doc(
        case1, "DOC-FIR-001", "Fictional First Information Report", DocumentType.FIR, fir_body, officer, ["fir", "demo"]
    )
    add_doc(
        case2, "DOC-NOTICE-001", "Fictional legal notice", DocumentType.LEGAL_NOTICE, notice_body, legal_off, ["legal", "demo"]
    )
    db.add(
        DocumentPermission(
            document_id=fir.id,
            user_id=viewer.id,
            permission_type=PermissionType.VIEW,
            granted_by=officer.id,
            expires_at=now + timedelta(days=30),
        )
    )
    db.add(
        Comment(
            document_id=fir.id,
            version_id=fir_v.id,
            user_id=prosecutor.id,
            content="Demo annotation: request additional fictional exhibits.",
            page_number=1,
        )
    )
    evidence = EvidenceItem(
        case_id=case1.id,
        document_id=fir.id,
        evidence_number="EVD-001",
        description="Fictional sealed envelope labeled Exhibit A (empty demo artifact).",
        collected_by=officer.id,
        collected_at=now - timedelta(days=2),
        location_collected="Demo station lockup",
        current_custodian=officer.id,
        status=EvidenceStatus.IN_CUSTODY,
    )
    db.add(evidence)
    db.flush()
    db.add(
        CustodyTransfer(
            evidence_item_id=evidence.id,
            from_user_id=officer.id,
            to_user_id=officer.id,
            transferred_at=now - timedelta(days=2),
            reason="Initial collection logged",
            location="Demo station",
        )
    )
    audit = AuditService(db)
    audit.record(action="SEED", entity_type="system", actor_user_id=admin.id, metadata={"note": "demo seed"})
    db.commit()
