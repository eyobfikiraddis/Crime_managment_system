"""case_management_completion

Revision ID: 008
Revises: 007
Create Date: 2026-05-10
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op


revision = "008"
down_revision = "007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add missing columns to `case`
    op.add_column("case", sa.Column("updated_by", sa.Integer(), sa.ForeignKey("officer.officer_id"), nullable=True))
    op.add_column("case", sa.Column("archived_by", sa.Integer(), sa.ForeignKey("officer.officer_id"), nullable=True))
    op.add_column("case", sa.Column("closed_by", sa.Integer(), sa.ForeignKey("officer.officer_id"), nullable=True))
    op.add_column("case", sa.Column("archived_at", sa.DateTime(timezone=True), nullable=True))

    # Add missing column to `case_officer`
    op.add_column("case_officer", sa.Column("assigned_by", sa.Integer(), sa.ForeignKey("officer.officer_id"), nullable=True))
    # It says 'removed_at' instead of 'unassigned_at' in Instruction_5.md, but to not break existing we'll add removed_at
    op.add_column("case_officer", sa.Column("removed_at", sa.DateTime(timezone=True), nullable=True))

    # Add missing column to `charge`
    op.add_column("charge", sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True))
    op.create_index("idx_charge_deleted", "charge", ["deleted_at"], postgresql_where=sa.text("deleted_at IS NULL"))

    # Add missing column to `case_note`
    op.add_column("case_note", sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True))
    op.create_index("idx_case_note_deleted", "case_note", ["deleted_at"], postgresql_where=sa.text("deleted_at IS NULL"))

    # Create `case_suspects`
    op.create_table(
        "case_suspects",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("case_id", sa.Integer(), sa.ForeignKey("case.case_id"), nullable=False),
        sa.Column("suspect_id", sa.Integer(), sa.ForeignKey("suspect.suspect_id"), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("added_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("added_by", sa.Integer(), sa.ForeignKey("officer.officer_id"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("idx_case_suspects_case", "case_suspects", ["case_id"])
    op.create_index("idx_case_suspects_suspect", "case_suspects", ["suspect_id"])

    # Create `case_victims`
    op.create_table(
        "case_victims",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("case_id", sa.Integer(), sa.ForeignKey("case.case_id"), nullable=False),
        sa.Column("victim_id", sa.Integer(), sa.ForeignKey("victim.victim_id"), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("added_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("added_by", sa.Integer(), sa.ForeignKey("officer.officer_id"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("idx_case_victims_case", "case_victims", ["case_id"])
    op.create_index("idx_case_victims_victim", "case_victims", ["victim_id"])

    # Create `case_witnesses`
    op.create_table(
        "case_witnesses",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("case_id", sa.Integer(), sa.ForeignKey("case.case_id"), nullable=False),
        sa.Column("witness_id", sa.Integer(), sa.ForeignKey("witness.witness_id"), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("added_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("added_by", sa.Integer(), sa.ForeignKey("officer.officer_id"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("idx_case_witnesses_case", "case_witnesses", ["case_id"])
    op.create_index("idx_case_witnesses_witness", "case_witnesses", ["witness_id"])

    # Create `evidence_history`
    op.create_table(
        "evidence_history",
        sa.Column("history_id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("evidence_id", sa.Integer(), sa.ForeignKey("evidence.evidence_id"), nullable=False),
        sa.Column("changed_by", sa.Integer(), sa.ForeignKey("officer.officer_id"), nullable=False),
        sa.Column("field_name", sa.String(100), nullable=False),
        sa.Column("old_value", sa.Text(), nullable=True),
        sa.Column("new_value", sa.Text(), nullable=True),
        sa.Column("changed_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("idx_evidence_history_evidence", "evidence_history", ["evidence_id"])

    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_trigger WHERE tgname = 'trg_evidence_history_immutable'
            ) THEN
                CREATE TRIGGER trg_evidence_history_immutable
                BEFORE UPDATE OR DELETE ON evidence_history
                FOR EACH ROW EXECUTE FUNCTION prevent_audit_table_modification();
            END IF;
        END $$;
        """
    )


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS trg_evidence_history_immutable ON evidence_history;")
    
    op.drop_index("idx_evidence_history_evidence", table_name="evidence_history")
    op.drop_table("evidence_history")

    op.drop_index("idx_case_witnesses_witness", table_name="case_witnesses")
    op.drop_index("idx_case_witnesses_case", table_name="case_witnesses")
    op.drop_table("case_witnesses")

    op.drop_index("idx_case_victims_victim", table_name="case_victims")
    op.drop_index("idx_case_victims_case", table_name="case_victims")
    op.drop_table("case_victims")

    op.drop_index("idx_case_suspects_suspect", table_name="case_suspects")
    op.drop_index("idx_case_suspects_case", table_name="case_suspects")
    op.drop_table("case_suspects")

    op.drop_index("idx_case_note_deleted", table_name="case_note")
    op.drop_column("case_note", "deleted_at")

    op.drop_index("idx_charge_deleted", table_name="charge")
    op.drop_column("charge", "deleted_at")

    op.drop_column("case_officer", "removed_at")
    op.drop_column("case_officer", "assigned_by")

    op.drop_column("case", "archived_at")
    op.drop_column("case", "closed_by")
    op.drop_column("case", "archived_by")
    op.drop_column("case", "updated_by")
