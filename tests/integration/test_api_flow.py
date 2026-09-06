from io import BytesIO

from fastapi.testclient import TestClient

from app.db.models.case import CaseType
from app.db.models.user import UserRole
from tests.unit.test_auth import auth_header, create_user

PDF = b"%PDF-1.4\nintegration demo\n%%EOF"


def test_health(client: TestClient):
    assert client.get("/api/v1/health").status_code == 200
    assert client.get("/api/v1/health/live").status_code == 200
    assert client.get("/api/v1/health/ready").status_code == 200


def test_comments_share_search_sign(client: TestClient, db):
    create_user(db, "intio@demo.local", "CorrectHorse1", UserRole.INVESTIGATING_OFFICER)
    prosecutor = create_user(db, "intpr@demo.local", "CorrectHorse1", UserRole.PROSECUTOR)
    headers = auth_header(client, "intio@demo.local", "CorrectHorse1")
    case = client.post(
        "/api/v1/cases",
        headers=headers,
        json={
            "case_number": "C-INT",
            "title": "Integration",
            "case_type": CaseType.CRIMINAL_INVESTIGATION.value,
        },
    )
    case_id = case.json()["id"]
    client.post(
        f"/api/v1/cases/{case_id}/members",
        headers=headers,
        json={"user_id": str(prosecutor.id), "permission_level": "REVIEWER"},
    )
    upload = client.post(
        f"/api/v1/cases/{case_id}/documents",
        headers=headers,
        data={
            "document_number": "D-1",
            "title": "Report",
            "document_type": "POLICE_REPORT",
            "tags": "demo,integration",
        },
        files={"file": ("r.pdf", BytesIO(PDF), "application/pdf")},
    )
    doc_id = upload.json()["document"]["id"]
    version_id = upload.json()["version"]["id"]
    pr = auth_header(client, "intpr@demo.local", "CorrectHorse1")
    comment = client.post(
        f"/api/v1/documents/{doc_id}/comments",
        headers=pr,
        json={"content": "Need extra fictional annexure.", "page_number": 1},
    )
    assert comment.status_code == 201
    share = client.post(
        f"/api/v1/documents/{doc_id}/share-links",
        headers=headers,
        json={"expires_minutes": 30, "max_downloads": 2},
    )
    assert share.status_code == 201
    token = share.json()["token"]
    dl = client.post(f"/api/v1/share-links/{token}/download")
    assert dl.status_code == 200
    signed = client.post(
        f"/api/v1/documents/{doc_id}/versions/{version_id}/sign",
        headers=headers,
    )
    assert signed.status_code == 201
    assert signed.json()["is_mock"] is True
    # A later version does not change the signature's immutable v1 binding.
    v2 = client.post(
        f"/api/v1/documents/{doc_id}/versions",
        headers=headers,
        data={"change_reason": "new revision"},
        files={"file": ("r2.pdf", BytesIO(PDF + b"\nrevision"), "application/pdf")},
    )
    assert v2.status_code == 201
    verify = client.get(f"/api/v1/signatures/{signed.json()['id']}/verify", headers=headers)
    assert verify.json()["valid"] is True
    search = client.get("/api/v1/search/documents", headers=headers, params={"title": "Report"})
    assert search.status_code == 200
    assert search.json()["total"] >= 1
