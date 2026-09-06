from fastapi import APIRouter

from app.modules.audit.router import router as audit_router
from app.modules.auth.router import router as auth_router
from app.modules.cases.router import router as cases_router
from app.modules.comments.router import router as comments_router
from app.modules.documents.router import router as documents_router
from app.modules.evidence.router import router as evidence_router
from app.modules.health.router import router as health_router
from app.modules.search.router import router as search_router
from app.modules.sharing.router import router as sharing_router
from app.modules.signatures.router import router as signatures_router
from app.modules.users.router import router as users_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(cases_router)
api_router.include_router(documents_router)
api_router.include_router(evidence_router)
api_router.include_router(comments_router)
api_router.include_router(sharing_router)
api_router.include_router(audit_router)
api_router.include_router(search_router)
api_router.include_router(signatures_router)
