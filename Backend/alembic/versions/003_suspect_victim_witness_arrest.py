"""suspect_victim_witness_arrest

Adds suspect, victim, witness, and arrest tables. Core case tables already exist in 002.

Revision ID: 003
Revises: 002
Create Date: 2026-05-10
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "suspect",
        sa.Column("suspect_id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("person_id", sa.Integer(), sa.ForeignKey("person.person_id"), nullable=False),
        sa.Column("criminal_record", sa.Text(), nullable=True),
        sa.Column(
            "risk_level",
            postgresql.ENUM(
                "low",
                "medium",
                "high",
                "critical",
                name="risklevelenum",
                create_type=False,
            ),
            nullable=True,
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
    op.create_index("idx_suspect_person_id", "suspect", ["person_id"])
    op.create_index("idx_suspect_deleted_at", "suspect", ["deleted_at"])

    op.create_table(
        "victim",
        sa.Column("victim_id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("person_id", sa.Integer(), sa.ForeignKey("person.person_id"), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("idx_victim_person_id", "victim", ["person_id"])
    op.create_index("idx_victim_deleted_at", "victim", ["deleted_at"])

    op.create_table(
        "witness",
        sa.Column("witness_id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("person_id", sa.Integer(), sa.ForeignKey("person.person_id"), nullable=False),
        sa.Column("credibility_notes", sa.Text(), nullable=True),
        sa.Column("is_protected", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("idx_witness_person_id", "witness", ["person_id"])
    op.create_index("idx_witness_deleted_at", "witness", ["deleted_at"])

    op.create_table(
        "arrest",
        sa.Column("arrest_id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("suspect_id", sa.Integer(), sa.ForeignKey("suspect.suspect_id"), nullable=False),
        sa.Column("officer_id", sa.Integer(), sa.ForeignKey("officer.officer_id"), nullable=False),
        sa.Column("case_id", sa.Integer(), sa.ForeignKey("case.case_id"), nullable=True),
        sa.Column("booking_number", sa.String(100), nullable=True, unique=True),
        sa.Column(
            "location_id",
            sa.Integer(),
            sa.ForeignKey("location.location_id"),
            nullable=True,
        ),
        sa.Column("bail_amount", sa.Numeric(12, 2), nullable=True),
        sa.Column("bail_set_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("released_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("idx_arrest_suspect_id", "arrest", ["suspect_id"])
    op.create_index("idx_arrest_case_id", "arrest", ["case_id"])
    op.create_index("idx_arrest_officer_id", "arrest", ["officer_id"])
    op.create_index("idx_arrest_deleted_at", "arrest", ["deleted_at"])


def downgrade() -> None:
    op.drop_index("idx_arrest_deleted_at", table_name="arrest")
    op.drop_index("idx_arrest_officer_id", table_name="arrest")
    op.drop_index("idx_arrest_case_id", table_name="arrest")
    op.drop_index("idx_arrest_suspect_id", table_name="arrest")
    op.drop_table("arrest")
    op.drop_index("idx_witness_deleted_at", table_name="witness")
    op.drop_index("idx_witness_person_id", table_name="witness")
    op.drop_table("witness")
    op.drop_index("idx_victim_deleted_at", table_name="victim")
    op.drop_index("idx_victim_person_id", table_name="victim")
    op.drop_table("victim")
    op.drop_index("idx_suspect_deleted_at", table_name="suspect")
    op.drop_index("idx_suspect_person_id", table_name="suspect")
    op.drop_table("suspect")
