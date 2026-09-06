# API contract quick reference

All API routes are under `/api/v1`; authenticated calls use `Authorization: Bearer <access_token>`.

| Endpoint | Example |
| --- | --- |
| `POST /auth/login` | `{ "email":"officer@demo.local", "password":"…", "mfa_code":"123456" }` |
| `GET /auth/me` | Returns the authenticated user and role. |
| `GET /cases?page=1&page_size=20` | Lists cases visible to the current role/case membership. |
| `POST /cases` | `{ "case_number":"CASE-26-004", "title":"…", "case_type":"CRIMINAL_INVESTIGATION", "priority":"HIGH" }` |
| `GET /documents/{id}` | Returns protected document metadata. |
| `POST /cases/{caseId}/documents` | Multipart `file`, `document_number`, `title`, `document_type`, `classification`, and `is_evidence`. |
| `GET /documents/{id}/download?version_id={versionId}` | Authorized, clean version content only. |
| `GET /documents/{id}/verify-integrity` | Returns stored/computed SHA-256 digests and `matches`. |
| `POST /cases/{caseId}/evidence` | `{ "evidence_number":"EVD-004", "document_id":"…", "description":"…", "collected_at":"…" }` |
| `POST /evidence/{id}/transfer` | `{ "to_user_id":"…", "reason":"Court submission", "location":"Registry" }` |
| `GET /evidence/{id}/custody-history` | Lists chronological custody transfer events. |
| `GET /audit-logs` | Admin/auditor-only hash-chained audit records. |
| `POST /audit-logs/verify-integrity` | Verifies the audit ledger chain. |
