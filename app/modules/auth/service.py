from hashlib import sha256
from uuid import UUID

from fastapi import Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, ForbiddenError, UnauthorizedError
from app.core.middleware import client_ip
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    utcnow,
    verify_password,
)
from app.db.models.audit import AuditAction
from app.db.models.user import RefreshToken, User, UserRole
from app.schemas.auth import ChangePasswordRequest, LoginRequest, RegisterRequest
from app.services.audit import AuditService


def _hash_token(token: str) -> str:
    return sha256(token.encode()).hexdigest()


class AuthService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.audit = AuditService(db)

    def register(self, payload: RegisterRequest, request: Request, actor: User | None) -> User:
        existing = self.db.scalar(
            select(User).where((User.email == payload.email) | (User.employee_id == payload.employee_id))
        )
        if existing:
            raise ConflictError("Email or employee ID already registered.", "USER_EXISTS")
        role = UserRole.VIEWER
        is_active = False
        if actor and actor.role == UserRole.SYSTEM_ADMIN:
            is_active = True
        user = User(
            employee_id=payload.employee_id,
            full_name=payload.full_name,
            email=str(payload.email).lower(),
            phone=payload.phone,
            password_hash=hash_password(payload.password),
            role=role,
            department_id=payload.department_id,
            is_active=is_active,
            is_verified=False,
        )
        self.db.add(user)
        self.db.flush()
        self.audit.record(
            action=AuditAction.REGISTER,
            entity_type="user",
            actor_user_id=actor.id if actor else user.id,
            entity_id=str(user.id),
            ip_address=client_ip(request),
            user_agent=request.headers.get("user-agent"),
            metadata={"email": user.email, "role": user.role.value},
        )
        self.db.commit()
        self.db.refresh(user)
        return user

    def login(self, payload: LoginRequest, request: Request) -> tuple[str, str, User]:
        user = self.db.scalar(select(User).where(User.email == str(payload.email).lower()))
        if user is None or not verify_password(payload.password, user.password_hash):
            self.audit.record(
                action=AuditAction.LOGIN_FAILED,
                entity_type="auth",
                entity_id=str(payload.email),
                ip_address=client_ip(request),
                user_agent=request.headers.get("user-agent"),
                metadata={"reason": "invalid_credentials"},
            )
            self.db.commit()
            raise UnauthorizedError("Invalid email or password.")
        if not user.is_active:
            raise ForbiddenError("Account is deactivated.", "ACCOUNT_INACTIVE")
        if user.mfa_enabled and not payload.mfa_code:
            raise ForbiddenError(
                "MFA is enabled for this account. Provide mfa_code (integration pending).",
                "MFA_REQUIRED",
            )
        user.last_login_at = utcnow()
        access = create_access_token(subject=str(user.id), role=user.role.value)
        refresh, expires, jti = create_refresh_token(subject=str(user.id))
        self.db.add(
            RefreshToken(
                user_id=user.id,
                token_hash=_hash_token(refresh),
                jti=jti,
                expires_at=expires,
            )
        )
        self.audit.record(
            action=AuditAction.LOGIN,
            entity_type="auth",
            actor_user_id=user.id,
            entity_id=str(user.id),
            ip_address=client_ip(request),
            user_agent=request.headers.get("user-agent"),
        )
        self.db.commit()
        return access, refresh, user

    def refresh(self, refresh_token: str, request: Request) -> tuple[str, str]:
        try:
            payload = decode_token(refresh_token)
        except Exception as exc:
            raise UnauthorizedError("Invalid refresh token.") from exc
        if payload.get("typ") != "refresh":
            raise UnauthorizedError("Invalid token type.")
        token_hash = _hash_token(refresh_token)
        stored = self.db.scalar(select(RefreshToken).where(RefreshToken.token_hash == token_hash))
        if stored is None or stored.revoked_at is not None:
            raise UnauthorizedError("Refresh token has been revoked.")
        if stored.expires_at.replace(tzinfo=None) < utcnow().replace(tzinfo=None):
            raise UnauthorizedError("Refresh token has expired.")
        user = self.db.get(User, UUID(payload["sub"]))
        if user is None or not user.is_active:
            raise UnauthorizedError("Account is inactive.")
        stored.revoked_at = utcnow()
        access = create_access_token(subject=str(user.id), role=user.role.value)
        new_refresh, expires, jti = create_refresh_token(subject=str(user.id))
        replacement = RefreshToken(
            user_id=user.id,
            token_hash=_hash_token(new_refresh),
            jti=jti,
            expires_at=expires,
        )
        self.db.add(replacement)
        self.db.flush()
        stored.replaced_by_id = replacement.id
        self.db.commit()
        return access, new_refresh

    def logout(self, refresh_token: str, request: Request, user: User) -> None:
        token_hash = _hash_token(refresh_token)
        stored = self.db.scalar(select(RefreshToken).where(RefreshToken.token_hash == token_hash))
        if stored and stored.user_id == user.id and stored.revoked_at is None:
            stored.revoked_at = utcnow()
        self.audit.record(
            action=AuditAction.LOGOUT,
            entity_type="auth",
            actor_user_id=user.id,
            entity_id=str(user.id),
            ip_address=client_ip(request),
            user_agent=request.headers.get("user-agent"),
        )
        self.db.commit()

    def change_password(self, user: User, payload: ChangePasswordRequest, request: Request) -> None:
        if not verify_password(payload.current_password, user.password_hash):
            raise UnauthorizedError("Current password is incorrect.")
        user.password_hash = hash_password(payload.new_password)
        tokens = self.db.scalars(
            select(RefreshToken).where(
                RefreshToken.user_id == user.id, RefreshToken.revoked_at.is_(None)
            )
        )
        now = utcnow()
        for token in tokens:
            token.revoked_at = now
        self.audit.record(
            action=AuditAction.PASSWORD_CHANGE,
            entity_type="user",
            actor_user_id=user.id,
            entity_id=str(user.id),
            ip_address=client_ip(request),
            user_agent=request.headers.get("user-agent"),
        )
        self.db.commit()
