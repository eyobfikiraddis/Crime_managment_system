"""add_interrogation_indexes

Revision ID: 011
Revises: 010
Create Date: 2026-05-12
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "011"
down_revision = "009"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index("idx_interrogation_case", "interrogation", ["case_id"])
    op.create_index("idx_interrogation_suspect", "interrogation", ["suspect_id"])


def downgrade() -> None:
    op.drop_index("idx_interrogation_suspect", table_name="interrogation")
    op.drop_index("idx_interrogation_case", table_name="interrogation")
