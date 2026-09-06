"""End-to-end API contract tests using only local fake data and in-memory services.

Each test receives a fresh SQLite schema and InMemoryStorage from tests/conftest.py.
No network, MinIO, Redis, Celery, OCR, antivirus, or AI credentials are required.
"""

from datetime import UTC, datetime
from io import BytesIO

import pytest
from fastapi.testclient import TestClient

from app.db.models.audit import AuditLog
from app.db.models.case import CaseType
from app.db.models.document import DocumentVersion
from app.db.models.user import UserRole
from app.services.hashing import sha256_bytes
from tests.unit.test_auth import auth_header, create_user

PDF_ONE = b"%PDF-1.4\nFictional investigation document.\n%%EOF"
PDF_TWO = b"%PDF-1.4\nFictional revised investigation document.\n%%EOF"


def create_case(client: TestClient, headers: dict[str, str], number: str = "CASE-API") -> str:
    response = client.post(
        "/api/v1/cases",
        headers=headers,
        json={
            "case_number": number,
            "title": f"Fictional {number}",
            "case_type": CaseType.CRIMINAL_INVESTIGATION.value,
            "priority": "HIGH",
        },
    )
    assert response.status_code == 201, response.text
    return response.json()["id"]


def upload_document(
    client: TestClient, headers: dict[str, str], case_id: str, number: str = "DOC-API"
) -> dict:
    response = client.post(
        f"/api/v1/cases/{case_id}/documents",
        headers=headers,
        data={
            "document_number": number,
            "title": "Fictional investigation report",
            "document_type": "INVESTIGATION_RECORD",
            "tags": "fictional,api-test",
        },
        files={"file": ("fictional-report.pdf", BytesIO(PDF_ONE), "application/pdf")},
    )
    assert response.status_code == 201, response.text
    return response.json()


def test_authentication_contract_and_structured_errors(client: TestClient, db):
    create_user(db, "api-auth@demo.local", "CorrectHorse1", UserRole.INVESTIGATING_OFFICER)

    invalid = client.post(
        "/api/v1/auth/login",
        json={"email": "api-auth@demo.local", "password": "not-the-password"},
    )
    assert invalid.status_code == 401
    assert invalid.json()["error"]["code"] == "UNAUTHORIZED"
    assert invalid.json()["error"]["request_id"]

    headers = auth_header(client, "api-auth@demo.local", "CorrectHorse1")
    me = client.get("/api/v1/auth/me", headers=headers)
    assert me.status_code == 200
    assert me.json()["email"] == "api-auth@demo.local"

    missing = client.get("/api/v1/cases")
    assert missing.status_code == 401
    assert missing.json()["error"]["code"] == "UNAUTHORIZED"

    validation = client.post("/api/v1/auth/register", json={})
    assert validation.status_code == 422
    assert validation.json()["error"]["code"] == "VALIDATION_ERROR"


@pytest.mark.parametrize(
    "role",
    [UserRole.AUDITOR, UserRole.PROSECUTOR, UserRole.COURT_USER, UserRole.VIEWER],
)
def test_read_only_roles_cannot_create_cases(client: TestClient, db, role: UserRole):
    email = f"{role.value.lower()}@demo.local"
    create_user(db, email, "CorrectHorse1", role)
    response = client.post(
        "/api/v1/cases",
        headers=auth_header(client, email, "CorrectHorse1"),
        json={
            "case_number": f"DENIED-{role.value}",
            "title": "Fictional denied case",
            "case_type": "CIVIL",
        },
    )
    assert response.status_code == 403
    assert response.json()["error"]["code"] == "ACCESS_DENIED"


def test_case_membership_allows_read_but_not_case_management(client: TestClient, db):
    create_user(db, "owner@demo.local", "CorrectHorse1", UserRole.INVESTIGATING_OFFICER)
    reviewer = create_user(db, "reviewer@demo.local", "CorrectHorse1", UserRole.LEGAL_OFFICER)
    owner_headers = auth_header(client, "owner@demo.local", "CorrectHorse1")
    case_id = create_case(client, owner_headers, "CASE-MEMBER")

    add = client.post(
        f"/api/v1/cases/{case_id}/members",
        headers=owner_headers,
        json={"user_id": str(reviewer.id), "permission_level": "REVIEWER"},
    )
    assert add.status_code == 201

    reviewer_headers = auth_header(client, "reviewer@demo.local", "CorrectHorse1")
    assert client.get(f"/api/v1/cases/{case_id}", headers=reviewer_headers).status_code == 200
    denied = client.patch(f"/api/v1/cases/{case_id}", headers=reviewer_headers, json={"title": "x"})
    assert denied.status_code == 403
    assert denied.json()["error"]["code"] == "CASE_MANAGE_DENIED"


def test_upload_download_version_and_hash_contract(client: TestClient, db):
    create_user(db, "documents@demo.local", "CorrectHorse1", UserRole.INVESTIGATING_OFFICER)
    headers = auth_header(client, "documents@demo.local", "CorrectHorse1")
    case_id = create_case(client, headers, "CASE-DOCS")
    created = upload_document(client, headers, case_id)
    document = created["document"]
    version_one = created["version"]
    assert version_one["sha256_hash"] == sha256_bytes(PDF_ONE)

    download = client.get(f"/api/v1/documents/{document['id']}/download", headers=headers)
    assert download.status_code == 200
    assert download.content == PDF_ONE
    assert download.headers["content-type"].startswith("application/pdf")

    second = client.post(
        f"/api/v1/documents/{document['id']}/versions",
        headers=headers,
        data={"change_reason": "Fictional correction"},
        files={"file": ("fictional-report-v2.pdf", BytesIO(PDF_TWO), "application/pdf")},
    )
    assert second.status_code == 201
    assert second.json()["version_number"] == 2
    assert second.json()["sha256_hash"] == sha256_bytes(PDF_TWO)

    old = client.get(
        f"/api/v1/documents/{document['id']}/download?version_id={version_one['id']}",
        headers=headers,
    )
    assert old.status_code == 200
    assert old.content == PDF_ONE

    old_check = client.get(
        f"/api/v1/documents/{document['id']}/verify-integrity?version_id={version_one['id']}",
        headers=headers,
    )
    assert old_check.status_code == 200
    assert old_check.json()["matches"] is True


@pytest.mark.parametrize(
    ("filename", "content_type", "content", "error_code"),
    [
        ("fictional.exe", "application/octet-stream", b"MZ\x90", "EXECUTABLE_UPLOAD"),
        ("fictional.pdf", "application/pdf", b"not a PDF", "INVALID_MIME_TYPE"),
        ("fictional.zip", "application/zip", b"PK\x03\x04", "INVALID_EXTENSION"),
    ],
)
def test_upload_validation_rejects_unsafe_or_invalid_files(
    client: TestClient,
    db,
    filename: str,
    content_type: str,
    content: bytes,
    error_code: str,
):
    create_user(db, "validation@demo.local", "CorrectHorse1", UserRole.INVESTIGATING_OFFICER)
    headers = auth_header(client, "validation@demo.local", "CorrectHorse1")
    case_id = create_case(client, headers, f"CASE-{error_code}")
    response = client.post(
        f"/api/v1/cases/{case_id}/documents",
        headers=headers,
        data={
            "document_number": "BAD-1",
            "title": "Fictional invalid file",
            "document_type": "OTHER",
        },
        files={"file": (filename, BytesIO(content), content_type)},
    )
    assert response.status_code == 400
    assert response.json()["error"]["code"] == error_code


def test_explicit_document_permission_and_share_lifecycle(client: TestClient, db):
    create_user(db, "share-owner@demo.local", "CorrectHorse1", UserRole.INVESTIGATING_OFFICER)
    viewer = create_user(db, "share-viewer@demo.local", "CorrectHorse1", UserRole.VIEWER)
    owner_headers = auth_header(client, "share-owner@demo.local", "CorrectHorse1")
    case_id = create_case(client, owner_headers, "CASE-SHARE")
    document = upload_document(client, owner_headers, case_id)["document"]

    viewer_headers = auth_header(client, "share-viewer@demo.local", "CorrectHorse1")
    denied_download = client.get(
        f"/api/v1/documents/{document['id']}/download", headers=viewer_headers
    )
    assert denied_download.status_code == 403
    grant = client.post(
        f"/api/v1/documents/{document['id']}/permissions",
        headers=owner_headers,
        json={"user_id": str(viewer.id), "permission_type": "DOWNLOAD"},
    )
    assert grant.status_code == 201
    permitted_download = client.get(
        f"/api/v1/documents/{document['id']}/download", headers=viewer_headers
    )
    assert permitted_download.status_code == 200

    share = client.post(
        f"/api/v1/documents/{document['id']}/share-links",
        headers=owner_headers,
        json={
            "recipient_email": "external.recipient@demo.local",
            "expires_minutes": 5,
            "max_downloads": 1,
        },
    )
    assert share.status_code == 201
    token = share.json()["token"]
    assert client.post(f"/api/v1/share-links/{token}/download").status_code == 200
    assert client.post(f"/api/v1/share-links/{token}/download").status_code == 403
    revoke = client.post(f"/api/v1/share-links/{token}/revoke", headers=owner_headers)
    assert revoke.status_code == 204


def test_evidence_custody_authorization_and_history(client: TestClient, db):
    owner = create_user(db, "custodian@demo.local", "CorrectHorse1", UserRole.INVESTIGATING_OFFICER)
    recipient = create_user(db, "recipient@demo.local", "CorrectHorse1", UserRole.LEGAL_OFFICER)
    intruder = create_user(db, "intruder@demo.local", "CorrectHorse1", UserRole.LEGAL_OFFICER)
    owner_headers = auth_header(client, "custodian@demo.local", "CorrectHorse1")
    case_id = create_case(client, owner_headers, "CASE-CUSTODY")
    for person in (recipient, intruder):
        assert client.post(
            f"/api/v1/cases/{case_id}/members",
            headers=owner_headers,
            json={"user_id": str(person.id), "permission_level": "REVIEWER"},
        ).status_code == 201
    evidence = client.post(
        f"/api/v1/cases/{case_id}/evidence",
        headers=owner_headers,
        json={
            "evidence_number": "EV-API-01",
            "description": "Fictional sealed exhibit",
            "collected_at": datetime.now(UTC).isoformat(),
            "location_collected": "Fictional evidence room",
        },
    )
    assert evidence.status_code == 201
    evidence_id = evidence.json()["id"]

    intruder_headers = auth_header(client, "intruder@demo.local", "CorrectHorse1")
    denied = client.post(
        f"/api/v1/evidence/{evidence_id}/transfer",
        headers=intruder_headers,
        json={"to_user_id": str(recipient.id), "reason": "Fictional unauthorized transfer"},
    )
    assert denied.status_code == 403
    assert denied.json()["error"]["code"] == "CUSTODY_DENIED"
    transfer = client.post(
        f"/api/v1/evidence/{evidence_id}/transfer",
        headers=owner_headers,
        json={"to_user_id": str(recipient.id), "reason": "Fictional authorized handover"},
    )
    assert transfer.status_code == 201
    history = client.get(f"/api/v1/evidence/{evidence_id}/custody-history", headers=owner_headers)
    assert history.status_code == 200
    assert history.json()["total"] == 1
    assert history.json()["items"][0]["to_user_id"] == str(recipient.id)


def test_audit_chain_pagination_and_search_filters(client: TestClient, db):
    create_user(db, "audit-admin@demo.local", "CorrectHorse1", UserRole.SYSTEM_ADMIN)
    headers = auth_header(client, "audit-admin@demo.local", "CorrectHorse1")
    first_case = create_case(client, headers, "CASE-FILTER-1")
    second_case = create_case(client, headers, "CASE-FILTER-2")
    first = upload_document(client, headers, first_case, "FILTER-1")
    upload_document(client, headers, second_case, "FILTER-2")

    cases = client.get("/api/v1/cases?page=2&page_size=1", headers=headers)
    assert cases.status_code == 200
    assert cases.json()["page"] == 2
    assert cases.json()["page_size"] == 1
    assert cases.json()["total"] == 2

    by_case = client.get(
        "/api/v1/search/documents",
        headers=headers,
        params={"case_number": "CASE-FILTER-1", "tag": "api-test", "page_size": 1},
    )
    assert by_case.status_code == 200
    assert by_case.json()["total"] == 1
    assert by_case.json()["items"][0]["id"] == first["document"]["id"]

    by_hash = client.get(
        "/api/v1/search/documents",
        headers=headers,
        params={"hash": first["version"]["sha256_hash"]},
    )
    assert by_hash.status_code == 200
    assert by_hash.json()["total"] == 1

    verified = client.post("/api/v1/audit-logs/verify-integrity", headers=headers)
    assert verified.status_code == 200
    assert verified.json()["valid"] is True
    assert verified.json()["events_checked"] > 0
    assert db.query(AuditLog).filter_by(action="AUDIT_VERIFY").count() == 1


def test_audit_chain_detects_direct_record_tampering(client: TestClient, db):
    create_user(db, "tamper-admin@demo.local", "CorrectHorse1", UserRole.SYSTEM_ADMIN)
    headers = auth_header(client, "tamper-admin@demo.local", "CorrectHorse1")
    create_case(client, headers, "CASE-TAMPER")
    event = db.query(AuditLog).filter_by(action="CASE_CREATE").one()
    event.metadata_json = {"tampered": True}
    db.commit()

    verification = client.post("/api/v1/audit-logs/verify-integrity", headers=headers)
    assert verification.status_code == 200
    assert verification.json()["valid"] is False
    assert verification.json()["broken_at_index"] is not None


def test_clean_database_has_no_cross_test_data(client: TestClient):
    # This guards the fixture contract: every test begins with a brand-new schema.
    response = client.post(
        "/api/v1/auth/login", json={"email": "documents@demo.local", "password": "CorrectHorse1"}
    )
    assert response.status_code == 401
