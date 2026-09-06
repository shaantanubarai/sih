from fastapi import APIRouter, Request
from jwt import InvalidTokenError
from sqlalchemy import select

from app.core.dependencies import CurrentUser, DbSession
from app.core.exceptions import ForbiddenError, NotFoundError
from app.core.middleware import client_ip
from app.db.models.audit import AuditAction
from app.db.models.department import Department
from app.db.models.user import User, UserRole
from app.schemas.auth import UserOut
from app.schemas.common import Pagination, paginate
from app.schemas.org import DepartmentCreate, DepartmentOut, DepartmentUpdate, UserStatusUpdate
from app.services.audit import AuditService
from app.services.authorization import AuthorizationService

router = APIRouter(tags=["users-departments"])


@router.get("/users", response_model=dict)
def list_users(
    db: DbSession,
    user: CurrentUser,
    params: Pagination,
):
    auth = AuthorizationService(db, user)
    if user.role not in {UserRole.SYSTEM_ADMIN, UserRole.AUDITOR}:
        auth.deny("You cannot list users.")
    query = select(User).where(User.deleted_at.is_(None)).order_by(User.created_at.desc())

    items, total = paginate(query, db, params)
    return {
        "items": [UserOut.model_validate(i).model_dump() for i in items],
        "total": total,
        "page": params.page,
        "page_size": params.page_size,
    }


@router.get("/users/{user_id}", response_model=UserOut)
def get_user(user_id, db: DbSession, user: CurrentUser):
    if user.role not in {UserRole.SYSTEM_ADMIN, UserRole.AUDITOR} and user.id != user_id:
        raise ForbiddenError()
    found = db.get(User, user_id)
    if not found or found.deleted_at:
        raise NotFoundError("User not found.")
    return found


@router.patch("/users/{user_id}/status", response_model=UserOut)
def update_status(
    user_id,
    payload: UserStatusUpdate,
    request: Request,
    db: DbSession,
    user: CurrentUser,
):
    AuthorizationService(db, user).require_admin()
    target = db.get(User, user_id)
    if not target:
        raise NotFoundError("User not found.")
    target.is_active = payload.is_active
    if payload.is_verified is not None:
        target.is_verified = payload.is_verified
    if payload.role is not None:
        target.role = payload.role
    AuditService(db).record(
        action=AuditAction.USER_STATUS_CHANGE,
        entity_type="user",
        actor_user_id=user.id,
        entity_id=str(target.id),
        ip_address=client_ip(request),
        user_agent=request.headers.get("user-agent"),
        metadata={"is_active": target.is_active, "role": target.role.value},
    )
    db.commit()
    db.refresh(target)
    return target


@router.get("/departments", response_model=dict)
def list_departments(db: DbSession, user: CurrentUser, params: Pagination):

    query = select(Department).order_by(Department.name)
    items, total = paginate(query, db, params)
    return {
        "items": [DepartmentOut.model_validate(i).model_dump() for i in items],
        "total": total,
        "page": params.page,
        "page_size": params.page_size,
    }


@router.post("/departments", response_model=DepartmentOut, status_code=201)
def create_department(
    payload: DepartmentCreate, request: Request, db: DbSession, user: CurrentUser
):
    AuthorizationService(db, user).require_admin()
    dept = Department(name=payload.name, code=payload.code.upper(), description=payload.description)
    db.add(dept)
    db.flush()
    AuditService(db).record(
        action=AuditAction.DEPARTMENT_CREATE,
        entity_type="department",
        actor_user_id=user.id,
        entity_id=str(dept.id),
        ip_address=client_ip(request),
        user_agent=request.headers.get("user-agent"),
        metadata={"code": dept.code},
    )
    db.commit()
    db.refresh(dept)
    return dept


@router.patch("/departments/{department_id}", response_model=DepartmentOut)
def update_department(
    department_id,
    payload: DepartmentUpdate,
    request: Request,
    db: DbSession,
    user: CurrentUser,
):
    AuthorizationService(db, user).require_admin()
    dept = db.get(Department, department_id)
    if not dept:
        raise NotFoundError("Department not found.")
    if payload.name:
        dept.name = payload.name
    if payload.description is not None:
        dept.description = payload.description
    AuditService(db).record(
        action=AuditAction.DEPARTMENT_UPDATE,
        entity_type="department",
        actor_user_id=user.id,
        entity_id=str(dept.id),
        ip_address=client_ip(request),
        user_agent=request.headers.get("user-agent"),
    )
    db.commit()
    db.refresh(dept)
    return dept
