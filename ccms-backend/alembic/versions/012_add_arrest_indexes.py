"""add_arrest_indexes

Revision ID: 012
Revises: 011
Create Date: 2026-05-12
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "012"
down_revision = "011"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index(
        "idx_arrest_deleted",
        "arrest",
        ["deleted_at"],
        postgresql_where=sa.text("deleted_at IS NULL"),
    )
    op.create_index(
        "idx_arrest_released",
        "arrest",
        ["case_id"],
        postgresql_where=sa.text("released_at IS NULL"),
    )
    op.create_unique_constraint("uq_arrest_booking", "arrest", ["booking_number"])


def downgrade() -> None:
    op.drop_constraint("uq_arrest_booking", "arrest", type_="unique")
    op.drop_index("idx_arrest_released", table_name="arrest")
    op.drop_index("idx_arrest_deleted", table_name="arrest")
