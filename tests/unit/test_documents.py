from io import BytesIO

import pytest
from fastapi.testclient import TestClient

from app.db.models.audit import AuditLog
from app.db.models.case import CaseType
from app.db.models.document import DocumentVersion
from app.db.models.user import UserRole
from app.services.hashing import sha256_bytes
from app.services.storage import InMemoryStorage, get_storage, set_storage
from tests.unit.test_auth import auth_header, create_user

PDF = b"%PDF-1.4\nDemo FIR text. Fictional only.\n%%EOF"


def _officer_with_case(client: TestClient, db):
    create_user(db, "docio@demo.local", "CorrectHorse1", UserRole.INVESTIGATING_OFFICER)
    headers = auth_header(client, "docio@demo.local", "CorrectHorse1")
    case = client.post(
        "/api/v1/cases",
        headers=headers,
        json={
            "case_number": "C-DOC",
            "title": "Docs",
            "case_type": CaseType.CRIMINAL_INVESTIGATION.value,
        },
    )
    return headers, case.json()["id"]


def test_valid_upload_hash_and_version(client: TestClient, db):
    headers, case_id = _officer_with_case(client, db)
    upload = client.post(
        f"/api/v1/cases/{case_id}/documents",
        headers=headers,
        data={
            "document_number": "FIR-1",
            "title": "Fictional FIR",
            "document_type": "FIR",
        },
        files={"file": ("fir.pdf", BytesIO(PDF), "application/pdf")},
    )
    assert upload.status_code == 201, upload.text
    version = upload.json()["version"]
    assert version["sha256_hash"] == sha256_bytes(PDF)
    doc_id = upload.json()["document"]["id"]
    second = client.post(
        f"/api/v1/documents/{doc_id}/versions",
        headers=headers,
        data={"change_reason": "typo fix"},
        files={"file": ("fir2.pdf", BytesIO(PDF + b"\nrev"), "application/pdf")},
    )
    assert second.status_code == 201
    assert second.json()["version_number"] == 2
    versions = client.get(f"/api/v1/documents/{doc_id}/versions", headers=headers)
    assert versions.json()["total"] == 2
    integrity = client.get(f"/api/v1/documents/{doc_id}/verify-integrity", headers=headers)
    assert integrity.status_code == 200
    assert integrity.json()["matches"] is True
    download = client.get(f"/api/v1/documents/{doc_id}/download", headers=headers)
    assert download.status_code == 200


def test_invalid_extension_and_mime_and_size(client: TestClient, db, monkeypatch):
    headers, case_id = _officer_with_case(client, db)
    exe = client.post(
        f"/api/v1/cases/{case_id}/documents",
        headers=headers,
        data={"document_number": "X1", "title": "bad", "document_type": "OTHER"},
        files={"file": ("payload.exe", BytesIO(b"MZ\x90\x00"), "application/octet-stream")},
    )
    assert exe.status_code == 400
    mismatch = client.post(
        f"/api/v1/cases/{case_id}/documents",
        headers=headers,
        data={"document_number": "X2", "title": "bad", "document_type": "OTHER"},
        files={"file": ("note.pdf", BytesIO(b"not a pdf"), "application/pdf")},
    )
    assert mismatch.status_code == 400
    from app.core.config import get_settings

    get_settings.cache_clear()
    settings = get_settings()
    monkeypatch.setattr(settings, "max_upload_bytes", 10)
    huge = client.post(
        f"/api/v1/cases/{case_id}/documents",
        headers=headers,
        data={"document_number": "X3", "title": "big", "document_type": "FIR"},
        files={"file": ("fir.pdf", BytesIO(PDF), "application/pdf")},
    )
    assert huge.status_code == 413


def test_unauthorized_download_idor(client: TestClient, db):
    headers, case_id = _officer_with_case(client, db)
    upload = client.post(
        f"/api/v1/cases/{case_id}/documents",
        headers=headers,
        data={"document_number": "FIR-2", "title": "FIR", "document_type": "FIR"},
        files={"file": ("fir.pdf", BytesIO(PDF), "application/pdf")},
    )
    doc_id = upload.json()["document"]["id"]
    create_user(db, "stranger@demo.local", "CorrectHorse1", UserRole.VIEWER)
    stranger = auth_header(client, "stranger@demo.local", "CorrectHorse1")
    denied = client.get(f"/api/v1/documents/{doc_id}/download", headers=stranger)
    assert denied.status_code == 403
    assert denied.json()["error"]["code"] == "DOCUMENT_ACCESS_DENIED"
    assert db.query(AuditLog).filter_by(action="DOCUMENT_ACCESS_DENIED").count() == 1


def test_prosecutor_cannot_upload_version(client: TestClient, db):
    headers, case_id = _officer_with_case(client, db)
    prosecutor = create_user(db, "pr@demo.local", "CorrectHorse1", UserRole.PROSECUTOR)
    client.post(
        f"/api/v1/cases/{case_id}/members",
        headers=headers,
        json={"user_id": str(prosecutor.id), "permission_level": "REVIEWER"},
    )
    upload = client.post(
        f"/api/v1/cases/{case_id}/documents",
        headers=headers,
        data={"document_number": "FIR-3", "title": "FIR", "document_type": "FIR"},
        files={"file": ("fir.pdf", BytesIO(PDF), "application/pdf")},
    )
    doc_id = upload.json()["document"]["id"]
    pr_headers = auth_header(client, "pr@demo.local", "CorrectHorse1")
    attempt = client.post(
        f"/api/v1/documents/{doc_id}/versions",
        headers=pr_headers,
        data={"change_reason": "nope"},
        files={"file": ("fir.pdf", BytesIO(PDF), "application/pdf")},
    )
    assert attempt.status_code == 403


def test_version_metadata_and_storage_key_are_immutable(client: TestClient, db):
    headers, case_id = _officer_with_case(client, db)
    upload = client.post(
        f"/api/v1/cases/{case_id}/documents",
        headers=headers,
        data={"document_number": "FIR-IMM", "title": "FIR", "document_type": "FIR"},
        files={"file": ("fir.pdf", BytesIO(PDF), "application/pdf")},
    )
    version = db.get(DocumentVersion, upload.json()["version"]["id"])
    version.sha256_hash = "0" * 64
    with pytest.raises(ValueError, match="immutable"):
        db.commit()
    db.rollback()

    version = db.get(DocumentVersion, upload.json()["version"]["id"])
    db.delete(version)
    with pytest.raises(ValueError, match="immutable"):
        db.commit()
    db.rollback()


def test_upload_rejects_when_persisted_object_differs_from_upload(client: TestClient, db):
    class CorruptingStorage(InMemoryStorage):
        def put(self, key, data, content_type):
            super().put(key, data, content_type)
            self._objects[key] = (data + b"corruption", content_type)

    headers, case_id = _officer_with_case(client, db)
    set_storage(CorruptingStorage())
    upload = client.post(
        f"/api/v1/cases/{case_id}/documents",
        headers=headers,
        data={"document_number": "FIR-CORRUPT", "title": "FIR", "document_type": "FIR"},
        files={"file": ("fir.pdf", BytesIO(PDF), "application/pdf")},
    )
    assert upload.status_code == 503
    assert upload.json()["error"]["code"] == "STORAGE_INTEGRITY_FAILURE"

    version = db.get(DocumentVersion, upload.json()["version"]["id"])
    version.storage_key = "replacement-key"
    with pytest.raises(ValueError, match="immutable"):
        db.commit()
    db.rollback()


def test_integrity_recalculates_stored_bytes_and_supports_history(client: TestClient, db):
    headers, case_id = _officer_with_case(client, db)
    upload = client.post(
        f"/api/v1/cases/{case_id}/documents",
        headers=headers,
        data={"document_number": "FIR-HASH", "title": "FIR", "document_type": "FIR"},
        files={"file": ("fir.pdf", BytesIO(PDF), "application/pdf")},
    )
    doc_id = upload.json()["document"]["id"]
    version_id = upload.json()["version"]["id"]
    version = db.get(DocumentVersion, version_id)
    # Deliberately corrupt the backing object outside the API. The endpoint
    # must hash the stored bytes rather than trust metadata.
    storage = get_storage()
    storage._objects[version.storage_key] = (b"%PDF-1.4\ncorrupted\n%%EOF", "application/pdf")
    check = client.get(
        f"/api/v1/documents/{doc_id}/verify-integrity?version_id={version_id}", headers=headers
    )
    assert check.status_code == 200
    assert check.json()["matches"] is False
    assert check.json()["computed_sha256"] == sha256_bytes(b"%PDF-1.4\ncorrupted\n%%EOF")


def test_download_and_version_operations_are_audited(client: TestClient, db):
    headers, case_id = _officer_with_case(client, db)
    upload = client.post(
        f"/api/v1/cases/{case_id}/documents",
        headers=headers,
        data={"document_number": "FIR-AUD", "title": "FIR", "document_type": "FIR"},
        files={"file": ("fir.pdf", BytesIO(PDF), "application/pdf")},
    )
    doc_id = upload.json()["document"]["id"]
    version_id = upload.json()["version"]["id"]
    assert client.get(f"/api/v1/documents/{doc_id}/versions/{version_id}", headers=headers).status_code == 200
    assert client.get(f"/api/v1/documents/{doc_id}/download", headers=headers).status_code == 200
    actions = {row.action for row in db.query(AuditLog).all()}
    assert "DOCUMENT_VERSION_CREATE" in actions
    assert "DOCUMENT_VERSION_VIEW" in actions
    assert "DOCUMENT_DOWNLOAD" in actions
