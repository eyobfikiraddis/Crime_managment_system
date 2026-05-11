"""court_case_sentence_charge_foreign_keys

Revision ID: 006
Revises: 005
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "006"
down_revision = "005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "court_case",
        sa.Column("court_case_id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("case_id", sa.Integer(), sa.ForeignKey("case.case_id"), nullable=False, unique=True),
        sa.Column("court_name", sa.String(255), nullable=False),
        sa.Column("court_reference", sa.String(100), nullable=True),
        sa.Column("judge_name", sa.String(255), nullable=True),
        sa.Column("prosecutor_name", sa.String(255), nullable=True),
        sa.Column("hearing_date", sa.Date(), nullable=True),
        sa.Column(
            "verdict",
            postgresql.ENUM(
                "pending",
                "guilty",
                "not_guilty",
                "mistrial",
                "dismissed",
                name="verdictenum",
                create_type=False,
            ),
            nullable=True,
        ),
        sa.Column("verdict_notes", sa.Text(), nullable=True),
        sa.Column("closed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("idx_court_case_case_id", "court_case", ["case_id"])

    op.create_table(
        "sentence",
        sa.Column("sentence_id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "charge_id",
            sa.Integer(),
            sa.ForeignKey("charge.charge_id"),
            nullable=False,
            unique=True,
        ),
        sa.Column(
            "court_case_id",
            sa.Integer(),
            sa.ForeignKey("court_case.court_case_id"),
            nullable=False,
        ),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("duration", sa.String(100), nullable=True),
        sa.Column("duration_days", sa.Integer(), nullable=True),
        sa.Column("start_date", sa.Date(), nullable=True),
        sa.Column("end_date", sa.Date(), nullable=True),
        sa.Column("sentence_type", sa.String(100), nullable=True),
        sa.Column("is_suspended", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column(
            "sentenced_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("idx_sentence_charge", "sentence", ["charge_id"])
    op.create_index("idx_sentence_court_case", "sentence", ["court_case_id"])

    op.add_column(
        "charge",
        sa.Column(
            "suspect_id",
            sa.Integer(),
            sa.ForeignKey("suspect.suspect_id"),
            nullable=True,
        ),
    )
    op.add_column(
        "charge",
        sa.Column(
            "court_case_id",
            sa.Integer(),
            sa.ForeignKey("court_case.court_case_id"),
            nullable=True,
        ),
    )
    op.create_index("idx_charge_suspect", "charge", ["suspect_id"])
    op.create_index("idx_charge_court_case", "charge", ["court_case_id"])

def downgrade() -> None:
    op.drop_index("idx_charge_court_case", table_name="charge")
    op.drop_index("idx_charge_suspect", table_name="charge")
    op.drop_column("charge", "court_case_id")
    op.drop_column("charge", "suspect_id")
    op.drop_index("idx_sentence_court_case", table_name="sentence")
    op.drop_index("idx_sentence_charge", table_name="sentence")
    op.drop_table("sentence")
    op.drop_index("idx_court_case_case_id", table_name="court_case")
    op.drop_table("court_case")
