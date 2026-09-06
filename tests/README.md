# API test suite

Run locally after installing the project dependencies:

```powershell
python -m pytest -q
```

The suite uses FastAPI `TestClient`, a new SQLite in-memory schema for every
test, and `InMemoryStorage`. It uses fictional data only and makes no network
calls. Redis, MinIO, Celery, antivirus, OCR, email, and AI providers are not
needed to execute it.

## NVIDIA NIM is optional, not a test dependency

Do **not** put an NVIDIA API key in this repository or test environment. API
tests must not depend on a free-tier quota or an external service. If a future
feature adds optional semantic search or AI-assisted metadata extraction, put
the key only in a local `.env`/secret manager and mock the provider in tests.

Suitable current NVIDIA NIM free-endpoint candidates to evaluate at integration
time are `nemotron-3-embed-1b` (semantic search embeddings) and
`nemotron-3.5-lightning-30b-a3b` (text analysis). Availability and free quota
are provider-controlled and must be confirmed in NVIDIA Build before use.
