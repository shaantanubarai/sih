from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Secure Legal DMS"
    app_env: str = "development"
    debug: bool = False
    secret_key: str = Field(min_length=32)
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7

    database_url: str = "postgresql+psycopg2://dms:dms_dev_password@localhost:5432/legal_dms"
    redis_url: str = "redis://localhost:6379/0"
    celery_broker_url: str = "redis://localhost:6379/1"
    celery_result_backend: str = "redis://localhost:6379/2"

    minio_endpoint: str = "localhost:9000"
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "minioadmin_change_me"
    minio_bucket: str = "legal-documents"
    minio_secure: bool = False

    cors_origins: str = "http://localhost:3000"
    max_upload_bytes: int = 20 * 1024 * 1024
    allowed_mime_types: str = (
        "application/pdf,image/jpeg,image/png,image/tiff,text/plain,"
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )
    rate_limit_login: str = "5/minute"
    rate_limit_default: str = "60/minute"

    seed_admin_email: str = "admin@demo.local"
    seed_admin_password: str = "DemoAdmin!234"
    seed_officer_password: str = "DemoOfficer!234"
    seed_legal_password: str = "DemoLegal!234"
    seed_prosecutor_password: str = "DemoProsecutor!234"
    seed_auditor_password: str = "DemoAuditor!234"
    seed_court_password: str = "DemoCourt!234"
    seed_viewer_password: str = "DemoViewer!234"

    @field_validator("secret_key")
    @classmethod
    def secret_not_default_in_prod(cls, value: str) -> str:
        return value

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def allowed_mime_list(self) -> list[str]:
        return [m.strip() for m in self.allowed_mime_types.split(",") if m.strip()]

    @property
    def is_production(self) -> bool:
        return self.app_env.lower() == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()
