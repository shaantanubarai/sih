# Database alignment notes

`database.sql` is a useful domain reference, but it is not directly compatible with this FastAPI backend.

| Provided MySQL schema | Current backend | Safe integration decision |
| --- | --- | --- |
| MySQL `INT AUTO_INCREMENT` IDs | PostgreSQL UUID IDs | Keep UUIDs for externally exposed resources and audit correlation; map legacy integer IDs during import. |
| Singular names: `document`, `legal_case`, `app_user` | Plural SQLAlchemy tables: `documents`, `cases`, `users` | Do not rename live tables; use an import/ETL mapping. |
| `document_version.file_hash`, `file_path` | immutable version with `sha256_hash`, `storage_key`, MIME, bytes, scan/OCR status | Preserve the current immutable model; map source values to those columns. |
| `evidence.integrity_hash` and `evidence_custody.integrity_hash` | evidence plus separate custody-transfer and hash-chained audit event records | Retain source digests as migration metadata and recompute/attest the stored object after import. |
| ordinary audit rows | cryptographically chained audit ledger | Import legacy rows as `LEGACY_IMPORT` events, then begin a new attested chain. |
| master `role`, `permission`, `role_permission` tables | application roles and authorization service | Map source role names to the existing enums; do not grant permissions from unreviewed imported rows. |

## Domain coverage

The supplied schema usefully confirms the product needs organizations, RBAC, cases, people/witnesses, FIRs, documents/versions/access, evidence/custody, court proceedings, compliance, and audit history. The current app already covers RBAC, cases, documents/versions/access, evidence/custody, signatures, and audit. FIR, person/witness, court proceeding, organization, and compliance are appropriate next backend modules.

## Recommended migration sequence

1. Provision PostgreSQL and apply the repository Alembic migrations.
2. Create a one-time importer that reads the MySQL schema/data into staging tables.
3. Map organizations to departments, roles to approved application roles, cases to `cases`, and documents to `documents` plus `document_versions`.
4. Copy file objects into the approved storage provider; calculate SHA-256 after persistence and only then create an immutable version.
5. Convert custody history to transfer records; write `LEGACY_IMPORT` audit entries and verify the new ledger.
6. Reconcile record counts and hashes with a privileged administrator before enabling user access.

Do not run `database.sql` against the application database: its first statement drops a database and it assumes a different database engine and data model.
