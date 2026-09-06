from datetime import UTC, datetime, timedelta
from uuid import uuid4

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

from app.core.config import get_settings

_hasher = PasswordHasher()


def utcnow() -> datetime:
    return datetime.now(UTC)


def hash_password(password: str) -> str:
    return _hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return _hasher.verify(password_hash, password)
    except VerifyMismatchError:
        return False


def create_access_token(*, subject: str, role: str, extra: dict | None = None) -> str:
    settings = get_settings()
    payload = {
        "sub": subject,
        "role": role,
        "typ": "access",
        "jti": str(uuid4()),
        "exp": utcnow() + timedelta(minutes=settings.access_token_expire_minutes),
        "iat": utcnow(),
    }
    if extra:
        payload.update(extra)
    return jwt.encode(payload, settings.secret_key, algorithm=settings.jwt_algorithm)


def create_refresh_token(*, subject: str) -> tuple[str, datetime, str]:
    settings = get_settings()
    jti = str(uuid4())
    expires = utcnow() + timedelta(days=settings.refresh_token_expire_days)
    payload = {
        "sub": subject,
        "typ": "refresh",
        "jti": jti,
        "exp": expires,
        "iat": utcnow(),
    }
    token = jwt.encode(payload, settings.secret_key, algorithm=settings.jwt_algorithm)
    return token, expires, jti


def decode_token(token: str) -> dict:
    settings = get_settings()
    return jwt.decode(token, settings.secret_key, algorithms=[settings.jwt_algorithm])
