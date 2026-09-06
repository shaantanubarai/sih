from fastapi import APIRouter
from sqlalchemy import text

from app.core.dependencies import DbSession

router = APIRouter(tags=["health"])


@router.get("/health")
def health():
    return {"status": "ok", "service": "secure-legal-dms"}


@router.get("/health/live")
def live():
    return {"status": "live"}


@router.get("/health/ready")
def ready(db: DbSession):
    db.execute(text("SELECT 1"))
    return {"status": "ready"}
