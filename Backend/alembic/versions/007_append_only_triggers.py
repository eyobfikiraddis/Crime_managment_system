"""idempotent_append_only_triggers

Revision ID: 007
Revises: 006
"""
from __future__ import annotations

from alembic import op

revision = "007"
down_revision = "006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_trigger WHERE tgname = 'trg_case_update_immutable'
            ) THEN
                CREATE TRIGGER trg_case_update_immutable
                BEFORE UPDATE OR DELETE ON case_update
                FOR EACH ROW EXECUTE FUNCTION prevent_audit_table_modification();
            END IF;
        END $$;
        """
    )
    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_trigger WHERE tgname = 'trg_case_permission_audit_immutable'
            ) THEN
                CREATE TRIGGER trg_case_permission_audit_immutable
                BEFORE UPDATE OR DELETE ON case_permission_audit
                FOR EACH ROW EXECUTE FUNCTION prevent_audit_table_modification();
            END IF;
        END $$;
        """
    )
    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_trigger WHERE tgname = 'trg_chain_of_custody_immutable'
            ) THEN
                CREATE TRIGGER trg_chain_of_custody_immutable
                BEFORE UPDATE OR DELETE ON chain_of_custody
                FOR EACH ROW EXECUTE FUNCTION prevent_audit_table_modification();
            END IF;
        END $$;
        """
    )


def downgrade() -> None:
    op.execute(
        "DROP TRIGGER IF EXISTS trg_chain_of_custody_immutable ON chain_of_custody;"
    )
    op.execute(
        "DROP TRIGGER IF EXISTS trg_case_permission_audit_immutable ON case_permission_audit;"
    )
    op.execute("DROP TRIGGER IF EXISTS trg_case_update_immutable ON case_update;")
