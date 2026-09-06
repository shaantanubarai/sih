from fastapi.testclient import TestClient

from app.db.models.case import CaseType, PermissionLevel
from app.db.models.user import UserRole
from tests.unit.test_auth import auth_header, create_user


def test_admin_can_list_users(client: TestClient, db):
    create_user(db, "admin@demo.local", "CorrectHorse1", UserRole.SYSTEM_ADMIN)
    headers = auth_header(client, "admin@demo.local", "CorrectHorse1")
    response = client.get("/api/v1/users", headers=headers)
    assert response.status_code == 200
    assert response.json()["total"] >= 1


def test_auditor_is_readonly_on_cases(client: TestClient, db):
    create_user(db, "aud@demo.local", "CorrectHorse1", UserRole.AUDITOR)
    headers = auth_header(client, "aud@demo.local", "CorrectHorse1")
    response = client.post(
        "/api/v1/cases",
        headers=headers,
        json={
            "case_number": "C-1",
            "title": "Should fail",
            "case_type": CaseType.CIVIL.value,
        },
    )
    assert response.status_code == 403


def test_unauthorized_case_access_and_idor(client: TestClient, db):
    officer = create_user(db, "io@demo.local", "CorrectHorse1", UserRole.INVESTIGATING_OFFICER)
    create_user(db, "other@demo.local", "CorrectHorse1", UserRole.INVESTIGATING_OFFICER)
    headers = auth_header(client, "io@demo.local", "CorrectHorse1")
    created = client.post(
        "/api/v1/cases",
        headers=headers,
        json={
            "case_number": "C-SECRET",
            "title": "Secret case",
            "case_type": CaseType.CRIMINAL_INVESTIGATION.value,
        },
    )
    assert created.status_code == 201
    case_id = created.json()["id"]
    other = auth_header(client, "other@demo.local", "CorrectHorse1")
    denied = client.get(f"/api/v1/cases/{case_id}", headers=other)
    assert denied.status_code == 403
    assert denied.json()["error"]["code"] == "CASE_ACCESS_DENIED"


def test_case_member_access(client: TestClient, db):
    create_user(db, "io2@demo.local", "CorrectHorse1", UserRole.INVESTIGATING_OFFICER)
    member = create_user(db, "lo@demo.local", "CorrectHorse1", UserRole.LEGAL_OFFICER)
    headers = auth_header(client, "io2@demo.local", "CorrectHorse1")
    created = client.post(
        "/api/v1/cases",
        headers=headers,
        json={
            "case_number": "C-SHARED",
            "title": "Shared case",
            "case_type": CaseType.CRIMINAL_INVESTIGATION.value,
        },
    )
    case_id = created.json()["id"]
    add = client.post(
        f"/api/v1/cases/{case_id}/members",
        headers=headers,
        json={"user_id": str(member.id), "permission_level": PermissionLevel.REVIEWER.value},
    )
    assert add.status_code == 201
    member_headers = auth_header(client, "lo@demo.local", "CorrectHorse1")
    visible = client.get(f"/api/v1/cases/{case_id}", headers=member_headers)
    assert visible.status_code == 200
