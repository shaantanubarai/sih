from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Request
from fastapi.security import HTTPAuthorizationCredentials
from jwt import InvalidTokenError
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.config import get_settings
from app.core.dependencies import CurrentUser, DbSession, bearer_scheme
from app.core.security import decode_token
from app.db.models.user import User
from app.modules.auth.service import AuthService
from app.schemas.auth import (
    ChangePasswordRequest,
    LoginRequest,
    LogoutRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
    UserOut,
)

router = APIRouter(prefix="/auth", tags=["auth"])
limiter = Limiter(key_func=get_remote_address)


@router.post("/register", response_model=UserOut, status_code=201)
def register(
    payload: RegisterRequest,
    request: Request,
    db: DbSession,
    creds: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)] = None,
):
    actor = None
    if creds is not None:
        try:
            token_payload = decode_token(creds.credentials)
            actor = db.get(User, UUID(token_payload["sub"]))
        except (InvalidTokenError, ValueError, KeyError):
            actor = None
    return AuthService(db).register(payload, request, actor)


@router.post("/login", response_model=TokenResponse)
@limiter.limit(get_settings().rate_limit_login)
def login(payload: LoginRequest, request: Request, db: DbSession):
    service = AuthService(db)
    access, refresh, _user = service.login(payload, request)
    return TokenResponse(access_token=access, refresh_token=refresh)


@router.post("/refresh", response_model=TokenResponse)
def refresh(payload: RefreshRequest, request: Request, db: DbSession):
    access, refresh_token = AuthService(db).refresh(payload.refresh_token, request)
    return TokenResponse(access_token=access, refresh_token=refresh_token)


@router.post("/logout", status_code=204)
def logout(payload: LogoutRequest, request: Request, db: DbSession, user: CurrentUser):
    AuthService(db).logout(payload.refresh_token, request, user)


@router.get("/me", response_model=UserOut)
def me(user: CurrentUser):
    return user


@router.post("/change-password", status_code=204)
def change_password(
    payload: ChangePasswordRequest,
    request: Request,
    db: DbSession,
    user: CurrentUser,
):
    AuthService(db).change_password(user, payload, request)
