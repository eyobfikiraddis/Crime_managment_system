"""case_and_personnel_foundation

Revision ID: 002
Revises: 001
Create Date: 2026-05-10 00:00:00.000000
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "case",
        sa.Column("case_id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("case_number", sa.String(100), nullable=False, unique=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "crime_type_id",
            sa.Integer(),
            sa.ForeignKey("crime_type.crime_type_id"),
            nullable=False,
        ),
        sa.Column(
            "status_id",
            sa.Integer(),
            sa.ForeignKey("case_status.status_id"),
            nullable=False,
        ),
        sa.Column(
            "severity",
            postgresql.ENUM(
                "infraction",
                "misdemeanor",
                "felony",
                "capital",
                name="severityenum",
                create_type=False,
            ),
            nullable=True,
        ),
        sa.Column(
            "primary_location_id",
            sa.Integer(),
            sa.ForeignKey("location.location_id"),
            nullable=True,
        ),
        sa.Column(
            "lead_officer_id",
            sa.Integer(),
            sa.ForeignKey("officer.officer_id"),
            nullable=True,
        ),
        sa.Column("opened_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("closed_at", sa.DateTime(timezone=True), nullable=True),
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
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("idx_case_case_number", "case", ["case_number"])
    op.create_index("idx_case_status_id", "case", ["status_id"])
    op.create_index("idx_case_lead_officer_id", "case", ["lead_officer_id"])
    op.create_index("idx_case_deleted_at", "case", ["deleted_at"])

    op.create_table(
        "case_person",
        sa.Column("case_person_id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("case_id", sa.Integer(), sa.ForeignKey("case.case_id"), nullable=False),
        sa.Column("person_id", sa.Integer(), sa.ForeignKey("person.person_id"), nullable=False),
        sa.Column("role_type", sa.String(50), nullable=False),
        sa.Column("is_primary", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )
    op.create_index("idx_case_person_case_id", "case_person", ["case_id"])
    op.create_index("idx_case_person_person_id", "case_person", ["person_id"])
    op.create_index("idx_case_person_role_type", "case_person", ["role_type"])

    op.create_table(
        "charge",
        sa.Column("charge_id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("case_id", sa.Integer(), sa.ForeignKey("case.case_id"), nullable=False),
        sa.Column("person_id", sa.Integer(), sa.ForeignKey("person.person_id"), nullable=False),
        sa.Column(
            "crime_type_id",
            sa.Integer(),
            sa.ForeignKey("crime_type.crime_type_id"),
            nullable=False,
        ),
        sa.Column(
            "charge_status",
            postgresql.ENUM(
                "filed",
                "pending",
                "dismissed",
                "convicted",
                "acquitted",
                "appealed",
                name="chargestatusenum",
                create_type=False,
            ),
            nullable=False,
        ),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("filed_at", sa.DateTime(timezone=True), nullable=True),
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
        sa.Column("sentence_summary", sa.Text(), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("idx_charge_case_id", "charge", ["case_id"])
    op.create_index("idx_charge_person_id", "charge", ["person_id"])
    op.create_index("idx_charge_status", "charge", ["charge_status"])

    op.create_table(
        "case_officer",
        sa.Column("assignment_id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("case_id", sa.Integer(), sa.ForeignKey("case.case_id"), nullable=False),
        sa.Column("officer_id", sa.Integer(), sa.ForeignKey("officer.officer_id"), nullable=False),
        sa.Column(
            "role_in_case",
            postgresql.ENUM(
                "lead_investigator",
                "co_investigator",
                "support_officer",
                "forensic_officer",
                "supervisor",
                name="roleincaseenum",
                create_type=False,
            ),
            nullable=False,
        ),
        sa.Column(
            "assigned_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column("unassigned_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
    )
    op.create_index("idx_case_officer_case_id", "case_officer", ["case_id"])
    op.create_index("idx_case_officer_officer_id", "case_officer", ["officer_id"])
    op.create_index("idx_case_officer_active", "case_officer", ["active"])

    op.create_table(
        "evidence",
        sa.Column("evidence_id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("case_id", sa.Integer(), sa.ForeignKey("case.case_id"), nullable=False),
        sa.Column("evidence_tag", sa.String(100), nullable=False, unique=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "storage_location_id",
            sa.Integer(),
            sa.ForeignKey("location.location_id"),
            nullable=True,
        ),
        sa.Column(
            "collected_by_officer_id",
            sa.Integer(),
            sa.ForeignKey("officer.officer_id"),
            nullable=True,
        ),
        sa.Column("chain_of_custody_notes", sa.Text(), nullable=True),
        sa.Column("collected_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("idx_evidence_tag", "evidence", ["evidence_tag"])
    op.create_index("idx_evidence_case_id", "evidence", ["case_id"])

    op.create_table(
        "case_note",
        sa.Column("note_id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("case_id", sa.Integer(), sa.ForeignKey("case.case_id"), nullable=False),
        sa.Column("officer_id", sa.Integer(), sa.ForeignKey("officer.officer_id"), nullable=False),
        sa.Column("note_text", sa.Text(), nullable=False),
        sa.Column("is_internal", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("idx_case_note_case_id", "case_note", ["case_id"])
    op.create_index("idx_case_note_officer_id", "case_note", ["officer_id"])

    op.create_table(
        "department_audit_log",
        sa.Column("audit_id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "department_id",
            sa.Integer(),
            sa.ForeignKey("department.department_id"),
            nullable=False,
        ),
        sa.Column(
            "changed_by_officer_id",
            sa.Integer(),
            sa.ForeignKey("officer.officer_id"),
            nullable=False,
        ),
        sa.Column("event_type", sa.String(100), nullable=False),
        sa.Column("old_value", postgresql.JSONB(), nullable=True),
        sa.Column("new_value", postgresql.JSONB(), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )
    op.execute(
        """
        CREATE TRIGGER trg_department_audit_log_immutable
        BEFORE UPDATE OR DELETE ON department_audit_log
        FOR EACH ROW EXECUTE FUNCTION prevent_audit_table_modification();
        """
    )


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS trg_department_audit_log_immutable ON department_audit_log;")
    op.drop_table("department_audit_log")
    op.drop_index("idx_case_note_officer_id", table_name="case_note")
    op.drop_index("idx_case_note_case_id", table_name="case_note")
    op.drop_table("case_note")
    op.drop_index("idx_evidence_case_id", table_name="evidence")
    op.drop_index("idx_evidence_tag", table_name="evidence")
    op.drop_table("evidence")
    op.drop_index("idx_case_officer_active", table_name="case_officer")
    op.drop_index("idx_case_officer_officer_id", table_name="case_officer")
    op.drop_index("idx_case_officer_case_id", table_name="case_officer")
    op.drop_table("case_officer")
    op.drop_index("idx_charge_status", table_name="charge")
    op.drop_index("idx_charge_person_id", table_name="charge")
    op.drop_index("idx_charge_case_id", table_name="charge")
    op.drop_table("charge")
    op.drop_index("idx_case_person_role_type", table_name="case_person")
    op.drop_index("idx_case_person_person_id", table_name="case_person")
    op.drop_index("idx_case_person_case_id", table_name="case_person")
    op.drop_table("case_person")
    op.drop_index("idx_case_deleted_at", table_name="case")
    op.drop_index("idx_case_lead_officer_id", table_name="case")
    op.drop_index("idx_case_status_id", table_name="case")
    op.drop_index("idx_case_case_number", table_name="case")
    op.drop_table("case")
