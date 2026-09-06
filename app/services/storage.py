from typing import Protocol


class ImmutableObjectError(RuntimeError):
    """Raised when code attempts to replace a content-addressed version object."""


class StorageBackend(Protocol):
    def put(self, key: str, data: bytes, content_type: str) -> None: ...

    def get(self, key: str) -> bytes: ...

    def exists(self, key: str) -> bool: ...


class InMemoryStorage:
    def __init__(self) -> None:
        self._objects: dict[str, tuple[bytes, str]] = {}

    def put(self, key: str, data: bytes, content_type: str) -> None:
        if key in self._objects:
            raise ImmutableObjectError("Object keys are write-once.")
        self._objects[key] = (data, content_type)

    def get(self, key: str) -> bytes:
        return self._objects[key][0]

    def exists(self, key: str) -> bool:
        return key in self._objects


class MinioStorage:
    def __init__(
        self,
        endpoint: str,
        access_key: str,
        secret_key: str,
        bucket: str,
        secure: bool = False,
    ) -> None:
        from minio import Minio

        self.bucket = bucket
        self.client = Minio(endpoint, access_key=access_key, secret_key=secret_key, secure=secure)
        if not self.client.bucket_exists(bucket):
            self.client.make_bucket(bucket)

    def put(self, key: str, data: bytes, content_type: str) -> None:
        from io import BytesIO

        # Version objects are immutable.  A random server-side key makes a
        # collision exceptionally unlikely; this check makes a collision fail
        # closed instead of replacing historical evidence.
        if self.exists(key):
            raise ImmutableObjectError("Object keys are write-once.")

        self.client.put_object(
            self.bucket,
            key,
            BytesIO(data),
            length=len(data),
            content_type=content_type,
        )

    def get(self, key: str) -> bytes:
        response = self.client.get_object(self.bucket, key)
        try:
            return response.read()
        finally:
            response.close()
            response.release_conn()

    def exists(self, key: str) -> bool:
        from minio.error import S3Error

        try:
            self.client.stat_object(self.bucket, key)
            return True
        except S3Error:
            return False


_storage: StorageBackend | None = None


def get_storage() -> StorageBackend:
    global _storage
    if _storage is not None:
        return _storage
    from app.core.config import get_settings

    settings = get_settings()
    if settings.app_env in {"test", "testing"} or settings.database_url.startswith("sqlite"):
        _storage = InMemoryStorage()
        return _storage
    try:
        _storage = MinioStorage(
            endpoint=settings.minio_endpoint,
            access_key=settings.minio_access_key,
            secret_key=settings.minio_secret_key,
            bucket=settings.minio_bucket,
            secure=settings.minio_secure,
        )
    except Exception:
        _storage = InMemoryStorage()
    return _storage


def set_storage(storage: StorageBackend) -> None:
    global _storage
    _storage = storage
