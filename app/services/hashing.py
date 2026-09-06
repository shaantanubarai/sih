import hashlib
import json


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def canonical_json(payload: dict) -> str:
    return json.dumps(payload, sort_keys=True, separators=(",", ":"), default=str)


SENSITIVE_KEYS = {
    "password",
    "password_hash",
    "token",
    "refresh_token",
    "access_token",
    "token_hash",
    "secret",
    "secret_key",
}


def mask_metadata(metadata: dict | None) -> dict:
    if not metadata:
        return {}
    masked = {}
    for key, value in metadata.items():
        if key.lower() in SENSITIVE_KEYS or "token" in key.lower() or "password" in key.lower():
            masked[key] = "[REDACTED]"
        else:
            masked[key] = value
    return masked
