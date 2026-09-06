"""enforce immutable document-version content in PostgreSQL

Revision ID: 0002_version_immutable
Revises: 0001_initial
"""

from alembic import op

revision = "0002_version_immutable"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Application-level guards cover all supported databases.  PostgreSQL also
    # receives a database guard to protect against accidental direct SQL.
    if op.get_bind().dialect.name != "postgresql":
        return
    op.execute(
        """
        CREATE FUNCTION prevent_document_version_mutation() RETURNS trigger AS $$
        BEGIN
          IF TG_OP = 'DELETE' THEN
            RAISE EXCEPTION 'document versions are immutable';
          END IF;
          IF NEW.document_id IS DISTINCT FROM OLD.document_id
             OR NEW.version_number IS DISTINCT FROM OLD.version_number
             OR NEW.storage_key IS DISTINCT FROM OLD.storage_key
             OR NEW.original_filename IS DISTINCT FROM OLD.original_filename
             OR NEW.mime_type IS DISTINCT FROM OLD.mime_type
             OR NEW.file_size IS DISTINCT FROM OLD.file_size
             OR NEW.sha256_hash IS DISTINCT FROM OLD.sha256_hash
             OR NEW.uploaded_by IS DISTINCT FROM OLD.uploaded_by
             OR NEW.change_reason IS DISTINCT FROM OLD.change_reason
             OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
            RAISE EXCEPTION 'document version content is immutable';
          END IF;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        CREATE TRIGGER document_versions_immutable
          BEFORE UPDATE OR DELETE ON document_versions
          FOR EACH ROW EXECUTE FUNCTION prevent_document_version_mutation();
        """
    )


def downgrade() -> None:
    if op.get_bind().dialect.name == "postgresql":
        op.execute("DROP TRIGGER IF EXISTS document_versions_immutable ON document_versions")
        op.execute("DROP FUNCTION IF EXISTS prevent_document_version_mutation()")
