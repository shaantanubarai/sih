from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.exceptions import ForbiddenError, NotFoundError
from app.db.models.case import Case, CaseMember, PermissionLevel
from app.db.models.document import Document, DocumentPermission, PermissionType
from app.db.models.user import User, UserRole

WRITE_ROLES = {
    UserRole.SYSTEM_ADMIN,
    UserRole.INVESTIGATING_OFFICER,
    UserRole.LEGAL_OFFICER,
}
UPLOAD_ROLES = {
    UserRole.SYSTEM_ADMIN,
    UserRole.INVESTIGATING_OFFICER,
    UserRole.LEGAL_OFFICER,
}
READ_ALL_ROLES = {UserRole.SYSTEM_ADMIN, UserRole.AUDITOR}


class AuthorizationService:
    def __init__(self, db: Session, user: User) -> None:
        self.db = db
        self.user = user

    def deny(self, message: str, code: str = "ACCESS_DENIED") -> None:
        raise ForbiddenError(message, code)

    def is_admin(self) -> bool:
        return self.user.role == UserRole.SYSTEM_ADMIN

    def is_auditor(self) -> bool:
        return self.user.role == UserRole.AUDITOR

    def can_read_all(self) -> bool:
        return self.user.role in READ_ALL_ROLES

    def require_active(self) -> None:
        if not self.user.is_active:
            self.deny("Account is deactivated.")

    def require_admin(self) -> None:
        if not self.is_admin():
            self.deny("Administrator privileges required.", "ADMIN_REQUIRED")

    def require_not_readonly(self) -> None:
        if self.user.role in {UserRole.AUDITOR, UserRole.VIEWER, UserRole.COURT_USER}:
            self.deny("This role is read-only.", "READ_ONLY_ROLE")
        if self.user.role == UserRole.PROSECUTOR:
            # prosecutors may comment but not mutate records unless specified
            pass

    def get_case(self, case_id: UUID) -> Case:
        case = self.db.get(Case, case_id)
        if case is None or case.deleted_at is not None:
            raise NotFoundError("Case not found.", "CASE_NOT_FOUND")
        return case

    def membership(self, case_id: UUID) -> CaseMember | None:
        return self.db.scalar(
            select(CaseMember).where(
                CaseMember.case_id == case_id, CaseMember.user_id == self.user.id
            )
        )

    def can_access_case(self, case: Case) -> bool:
        if self.can_read_all():
            return True
        if case.created_by == self.user.id or case.assigned_officer_id == self.user.id:
            return True
        return self.membership(case.id) is not None

    def require_case_access(self, case: Case) -> None:
        if not self.can_access_case(case):
            self.deny("You do not have permission to access this case.", "CASE_ACCESS_DENIED")

    def require_case_manage(self, case: Case) -> None:
        if self.is_admin():
            return
        if self.is_auditor() or self.user.role in {
            UserRole.VIEWER,
            UserRole.COURT_USER,
            UserRole.PROSECUTOR,
        }:
            self.deny("You cannot manage this case.", "CASE_MANAGE_DENIED")
        member = self.membership(case.id)
        if case.created_by == self.user.id or case.assigned_officer_id == self.user.id:
            return
        if member and member.permission_level in {PermissionLevel.OWNER, PermissionLevel.EDITOR}:
            return
        self.deny("You cannot manage this case.", "CASE_MANAGE_DENIED")

    def get_document(self, document_id: UUID) -> Document:
        document = self.db.get(Document, document_id)
        if document is None or document.deleted_at is not None:
            raise NotFoundError("Document not found.", "DOCUMENT_NOT_FOUND")
        return document

    def _permission_active(self, perm: DocumentPermission) -> bool:
        if perm.revoked_at is not None:
            return False
        if perm.expires_at is not None and perm.expires_at.replace(tzinfo=UTC) < datetime.now(UTC):
            return False
        return True

    def has_document_permission(self, document: Document, needed: PermissionType) -> bool:
        if self.can_read_all():
            return True
        case = self.get_case(document.case_id)
        if self.can_access_case(case):
            if needed in {PermissionType.VIEW, PermissionType.DOWNLOAD}:
                return True
            if needed == PermissionType.COMMENT and self.user.role != UserRole.VIEWER:
                return True
            if needed == PermissionType.SHARE and self.user.role in {
                UserRole.LEGAL_OFFICER,
                UserRole.INVESTIGATING_OFFICER,
                UserRole.SYSTEM_ADMIN,
            }:
                return True
        now = datetime.now(UTC)
        q = select(DocumentPermission).where(
            DocumentPermission.document_id == document.id,
            DocumentPermission.permission_type == needed,
            DocumentPermission.revoked_at.is_(None),
            or_(
                DocumentPermission.expires_at.is_(None),
                DocumentPermission.expires_at > now,
            ),
            or_(
                DocumentPermission.user_id == self.user.id,
                DocumentPermission.role == self.user.role.value,
            ),
        )
        return self.db.scalar(q) is not None

    def require_document_access(
        self, document: Document, needed: PermissionType = PermissionType.VIEW
    ) -> None:
        if not self.has_document_permission(document, needed):
            self.deny(
                "You do not have permission to access this document.",
                "DOCUMENT_ACCESS_DENIED",
            )

    def require_upload(self, case: Case) -> None:
        if self.user.role not in UPLOAD_ROLES:
            self.deny("Your role cannot upload documents.", "UPLOAD_DENIED")
        self.require_case_manage(case)

    def require_version_upload(self, document: Document) -> None:
        if self.user.role == UserRole.PROSECUTOR:
            self.deny("Prosecutors cannot modify uploaded files.", "VERSION_DENIED")
        case = self.get_case(document.case_id)
        self.require_upload(case)
