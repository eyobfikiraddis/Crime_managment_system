"""case_permissions_case_update_report

Revision ID: 004
Revises: 003
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "004"
down_revision = "003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "case_update",
        sa.Column("update_id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("case_id", sa.Integer(), sa.ForeignKey("case.case_id"), nullable=False),
        sa.Column("officer_id", sa.Integer(), sa.ForeignKey("officer.officer_id"), nullable=False),
        sa.Column("update_type", sa.String(50), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("idx_case_update_case_id", "case_update", ["case_id"])

    op.create_table(
        "case_permission",
        sa.Column("permission_id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("case_id", sa.Integer(), sa.ForeignKey("case.case_id"), nullable=False),
        sa.Column("officer_id", sa.Integer(), sa.ForeignKey("officer.officer_id"), nullable=False),
        sa.Column(
            "access_level",
            postgresql.ENUM(
                "read",
                "write",
                "admin",
                name="accesslevelenum",
                create_type=False,
            ),
            nullable=False,
        ),
        sa.Column("can_read", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("can_write", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("can_admin", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column(
            "granted_by",
            sa.Integer(),
            sa.ForeignKey("officer.officer_id"),
            nullable=False,
        ),
        sa.Column(
            "granted_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "revoked_by",
            sa.Integer(),
            sa.ForeignKey("officer.officer_id"),
            nullable=True,
        ),
    )
    op.create_index("idx_case_permission_case_id", "case_permission", ["case_id"])
    op.create_index("idx_case_permission_officer", "case_permission", ["officer_id"])

    op.create_table(
        "case_permission_audit",
        sa.Column("audit_id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "permission_id",
            sa.Integer(),
            sa.ForeignKey("case_permission.permission_id"),
            nullable=False,
        ),
        sa.Column("case_id", sa.Integer(), sa.ForeignKey("case.case_id"), nullable=False),
        sa.Column("officer_id", sa.Integer(), sa.ForeignKey("officer.officer_id"), nullable=False),
        sa.Column("action", sa.String(50), nullable=False),
        sa.Column(
            "old_access_level",
            postgresql.ENUM(
                "read",
                "write",
                "admin",
                name="accesslevelenum",
                create_type=False,
            ),
            nullable=True,
        ),
        sa.Column(
            "new_access_level",
            postgresql.ENUM(
                "read",
                "write",
                "admin",
                name="accesslevelenum",
                create_type=False,
            ),
            nullable=True,
        ),
        sa.Column(
            "performed_by",
            sa.Integer(),
            sa.ForeignKey("officer.officer_id"),
            nullable=False,
        ),
        sa.Column(
            "performed_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("notes", sa.Text(), nullable=True),
    )
    op.create_index(
        "idx_case_permission_audit_case",
        "case_permission_audit",
        ["case_id"],
    )
    op.create_index(
        "idx_case_permission_audit_officer",
        "case_permission_audit",
        ["officer_id"],
    )

    op.create_table(
        "report",
        sa.Column("report_id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("case_id", sa.Integer(), sa.ForeignKey("case.case_id"), nullable=False),
        sa.Column("officer_id", sa.Integer(), sa.ForeignKey("officer.officer_id"), nullable=False),
        sa.Column("report_type", sa.String(50), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("idx_report_case_id", "report", ["case_id"])

    op.execute(
        """
        CREATE UNIQUE INDEX IF NOT EXISTS uq_case_lead_investigator
        ON case_officer (case_id)
        WHERE role_in_case = 'lead_investigator';
        """
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS uq_case_lead_investigator;")
    op.drop_index("idx_report_case_id", table_name="report")
    op.drop_table("report")
    op.drop_index("idx_case_permission_audit_officer", table_name="case_permission_audit")
    op.drop_index("idx_case_permission_audit_case", table_name="case_permission_audit")
    op.drop_table("case_permission_audit")
    op.drop_index("idx_case_permission_officer", table_name="case_permission")
    op.drop_index("idx_case_permission_case_id", table_name="case_permission")
    op.drop_table("case_permission")
    op.drop_index("idx_case_update_case_id", table_name="case_update")
    op.drop_table("case_update")
