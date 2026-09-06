from collections.abc import Generator
from typing import Annotated
from uuid import UUID

from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import ExpiredSignatureError, InvalidTokenError
from sqlalchemy.orm import Session

from app.core.exceptions import ForbiddenError, UnauthorizedError
from app.core.security import decode_token
from app.db.models.user import User, UserRole
from app.db.session import get_session_factory

bearer_scheme = HTTPBearer(auto_error=False)


def get_db() -> Generator[Session, None, None]:
    factory = get_session_factory()
    db = factory()
    try:
        yield db
    finally:
        db.close()


DbSession = Annotated[Session, Depends(get_db)]


def get_current_user(
    request: Request,
    creds: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    db: DbSession,
) -> User:
    if creds is None or creds.scheme.lower() != "bearer":
        raise UnauthorizedError()
    try:
        payload = decode_token(creds.credentials)
    except ExpiredSignatureError:
        raise UnauthorizedError("Access token has expired.") from None
    except InvalidTokenError:
        raise UnauthorizedError("Token is invalid.") from None
    if payload.get("typ") != "access":
        raise UnauthorizedError("Invalid token type.")
    user = db.get(User, UUID(payload["sub"]))
    if user is None or not user.is_active:
        raise UnauthorizedError("Account is inactive or not found.")
    request.state.actor_id = str(user.id)
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_roles(*roles: UserRole):
    def _dep(user: CurrentUser) -> User:
        if user.role not in roles and user.role != UserRole.SYSTEM_ADMIN:
            raise ForbiddenError()
        return user

    return _dep
