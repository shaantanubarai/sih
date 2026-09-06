from datetime import UTC, datetime, timedelta

import jwt
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.core.security import hash_password
from app.db.models.user import User, UserRole


def create_user(db, email: str, password: str, role: UserRole, **kwargs) -> User:
    user = User(
        employee_id=email.split("@")[0],
        full_name=email,
        email=email,
        password_hash=hash_password(password),
        role=role,
        is_active=kwargs.get("is_active", True),
        is_verified=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def auth_header(client: TestClient, email: str, password: str) -> dict:
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200, response.text
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_register_and_login(client, db):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "employee_id": "E100",
            "full_name": "New User",
            "email": "new@demo.local",
            "password": "SuperSecret12",
        },
    )
    assert response.status_code == 201
    body = response.json()
    assert "password_hash" not in body
    assert body["is_active"] is False

    user = db.query(User).filter_by(email="new@demo.local").one()
    user.is_active = True
    db.commit()

    login = client.post(
        "/api/v1/auth/login", json={"email": "new@demo.local", "password": "SuperSecret12"}
    )
    assert login.status_code == 200
    assert login.json()["access_token"]
    assert login.json()["refresh_token"]


def test_invalid_password(client, db):
    create_user(db, "io@demo.local", "CorrectHorse1", UserRole.INVESTIGATING_OFFICER)
    response = client.post(
        "/api/v1/auth/login", json={"email": "io@demo.local", "password": "wrong-password"}
    )
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "UNAUTHORIZED"


def test_expired_token(client, db):
    user = create_user(db, "exp@demo.local", "CorrectHorse1", UserRole.VIEWER)
    settings = get_settings()
    token = jwt.encode(
        {
            "sub": str(user.id),
            "role": user.role.value,
            "typ": "access",
            "exp": datetime.now(UTC) - timedelta(minutes=1),
        },
        settings.secret_key,
        algorithm=settings.jwt_algorithm,
    )
    response = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401


def test_refresh_rotation_and_logout(client, db):
    create_user(db, "rot@demo.local", "CorrectHorse1", UserRole.INVESTIGATING_OFFICER)
    login = client.post(
        "/api/v1/auth/login", json={"email": "rot@demo.local", "password": "CorrectHorse1"}
    )
    refresh = login.json()["refresh_token"]
    rotated = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh})
    assert rotated.status_code == 200
    new_refresh = rotated.json()["refresh_token"]
    reused = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh})
    assert reused.status_code == 401
    headers = {"Authorization": f"Bearer {rotated.json()['access_token']}"}
    logout = client.post("/api/v1/auth/logout", json={"refresh_token": new_refresh}, headers=headers)
    assert logout.status_code == 204
    after = client.post("/api/v1/auth/refresh", json={"refresh_token": new_refresh})
    assert after.status_code == 401


def test_login_rate_limiting(client, db):
    create_user(db, "rl@demo.local", "CorrectHorse1", UserRole.VIEWER)
    last = None
    for _ in range(6):
        last = client.post(
            "/api/v1/auth/login", json={"email": "rl@demo.local", "password": "nope-nope-1"}
        )
    assert last.status_code in {401, 429}
