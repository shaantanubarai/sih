import os
from uuid import uuid4

os.environ["SECRET_KEY"] = "unit-test-secret-key-32-characters-min"
os.environ["APP_ENV"] = "test"
os.environ["DEBUG"] = "true"
os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["REDIS_URL"] = "redis://localhost:6379/0"
os.environ["CELERY_BROKER_URL"] = "redis://localhost:6379/1"
os.environ["CELERY_RESULT_BACKEND"] = "redis://localhost:6379/2"
os.environ["CORS_ORIGINS"] = "http://testserver"
os.environ["RATE_LIMIT_LOGIN"] = "5/minute"
os.environ["MINIO_ENDPOINT"] = "localhost:9000"

from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool
from sqlalchemy import create_engine

from app.core.config import get_settings
from app.core.dependencies import get_db
from app.db.base_class import Base
from app.db.session import reset_engine
from app.services.storage import InMemoryStorage, set_storage
import app.db.base  # noqa: F401  ensure models registered


@pytest.fixture()
def engine():
    get_settings.cache_clear()
    reset_engine()
    eng = create_engine(
        "sqlite+pysqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(eng)
    yield eng
    Base.metadata.drop_all(eng)
    eng.dispose()


@pytest.fixture()
def db(engine) -> Generator[Session, None, None]:
    factory = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    session = factory()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def client(engine, db) -> Generator[TestClient, None, None]:
    from app.main import create_app

    set_storage(InMemoryStorage())
    app = create_app()

    def _override_db():
        factory = sessionmaker(bind=engine, autocommit=False, autoflush=False)
        session = factory()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = _override_db
    # SlowAPI keys by client address. A unique test client address prevents an
    # in-memory rate-limit bucket from leaking state into another test while
    # preserving rate-limit behavior within the current test.
    with TestClient(
        app,
        raise_server_exceptions=False,
        client=(f"pytest-{uuid4().hex}", 50000),
    ) as test_client:
        yield test_client
