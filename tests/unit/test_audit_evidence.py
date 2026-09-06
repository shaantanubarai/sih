from datetime import UTC, datetime

from fastapi.testclient import TestClient

from app.db.models.audit import AuditLog
from app.db.models.case import CaseType
from app.db.models.user import UserRole
from app.services.audit import AuditService
from tests.unit.test_auth import auth_header, create_user


def test_audit_chain_and_verify(client: TestClient, db):
    create_user(db, "admin2@demo.local", "CorrectHorse1", UserRole.SYSTEM_ADMIN)
    headers = auth_header(client, "admin2@demo.local", "CorrectHorse1")
    verify = client.post("/api/v1/audit-logs/verify-integrity", headers=headers)
    assert verify.status_code == 200
    assert verify.json()["valid"] is True
    assert verify.json()["events_checked"] >= 1


def test_audit_hash_chain_unit(db):
    service = AuditService(db)
    a = service.record(action="A", entity_type="t", entity_id="1")
    b = service.record(action="B", entity_type="t", entity_id="2")
    db.commit()
    assert b.previous_event_hash == a.event_hash
    result = service.verify_chain()
    assert result["valid"] is True


def test_normal_user_cannot_read_audit(client: TestClient, db):
    create_user(db, "io3@demo.local", "CorrectHorse1", UserRole.INVESTIGATING_OFFICER)
    headers = auth_header(client, "io3@demo.local", "CorrectHorse1")
    response = client.get("/api/v1/audit-logs", headers=headers)
    assert response.status_code == 403


def test_evidence_custody(client: TestClient, db):
    officer = create_user(db, "evio@demo.local", "CorrectHorse1", UserRole.INVESTIGATING_OFFICER)
    other = create_user(db, "evlo@demo.local", "CorrectHorse1", UserRole.LEGAL_OFFICER)
    headers = auth_header(client, "evio@demo.local", "CorrectHorse1")
    case = client.post(
        "/api/v1/cases",
        headers=headers,
        json={
            "case_number": "C-EV",
            "title": "Evidence case",
            "case_type": CaseType.CRIMINAL_INVESTIGATION.value,
        },
    )
    case_id = case.json()["id"]
    client.post(
        f"/api/v1/cases/{case_id}/members",
        headers=headers,
        json={"user_id": str(other.id), "permission_level": "EDITOR"},
    )
    created = client.post(
        f"/api/v1/cases/{case_id}/evidence",
        headers=headers,
        json={
            "evidence_number": "EV-1",
            "description": "Fictional sealed bag",
            "collected_at": datetime.now(UTC).isoformat(),
            "location_collected": "Demo lockup",
        },
    )
    assert created.status_code == 201, created.text
    evidence_id = created.json()["id"]
    stranger_headers = auth_header(client, "evlo@demo.local", "CorrectHorse1")
    denied = client.post(
        f"/api/v1/evidence/{evidence_id}/transfer",
        headers=stranger_headers,
        json={"to_user_id": str(officer.id), "reason": "should fail"},
    )
    assert denied.status_code == 403
    ok = client.post(
        f"/api/v1/evidence/{evidence_id}/transfer",
        headers=headers,
        json={"to_user_id": str(other.id), "reason": "handover to legal demo"},
    )
    assert ok.status_code == 201
    history = client.get(f"/api/v1/evidence/{evidence_id}/custody-history", headers=headers)
    assert history.status_code == 200
    assert history.json()["total"] == 1
