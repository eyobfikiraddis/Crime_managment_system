"""reporting_indexes

Revision ID: 009
Revises: 008
Create Date: 2026-05-11
"""
from __future__ import annotations

from alembic import op

revision = "009"
down_revision = "008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        CREATE INDEX IF NOT EXISTS idx_case_update_case_created_at
        ON case_update (case_id, created_at);
        """
    )
    op.execute(
        """
        CREATE INDEX IF NOT EXISTS idx_chain_of_custody_evidence_created_at
        ON chain_of_custody (evidence_id, created_at);
        """
    )
    op.execute(
        """
        CREATE INDEX IF NOT EXISTS idx_arrest_date
        ON arrest (date);
        """
    )
    op.execute(
        """
        CREATE INDEX IF NOT EXISTS idx_evidence_created_at
        ON evidence (created_at);
        """
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_evidence_created_at;")
    op.execute("DROP INDEX IF EXISTS idx_arrest_date;")
    op.execute("DROP INDEX IF EXISTS idx_chain_of_custody_evidence_created_at;")
    op.execute("DROP INDEX IF EXISTS idx_case_update_case_created_at;")
