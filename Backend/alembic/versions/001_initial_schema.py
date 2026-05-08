"""initial_schema

Revision ID: 001
Revises:
Create Date: 2025-01-01 00:00:00.000000
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Enums
    op.execute(
        """
        CREATE TYPE gender_enum AS ENUM ('male', 'female', 'other', 'undisclosed');
        CREATE TYPE location_type_enum AS ENUM (
            'country', 'region', 'city', 'district', 'street',
            'building', 'crime_scene', 'court', 'storage', 'other'
        );
        CREATE TYPE severity_enum AS ENUM ('infraction', 'misdemeanor', 'felony', 'capital');
        CREATE TYPE risk_level_enum AS ENUM ('low', 'medium', 'high', 'critical');
        CREATE TYPE access_level_enum AS ENUM ('read', 'write', 'admin');
        CREATE TYPE role_in_case_enum AS ENUM (
            'lead_investigator', 'co_investigator', 'support_officer',
            'forensic_officer', 'supervisor'
        );
        CREATE TYPE charge_status_enum AS ENUM (
            'filed', 'pending', 'dismissed', 'convicted', 'acquitted', 'appealed'
        );
        CREATE TYPE verdict_enum AS ENUM (
            'pending', 'guilty', 'not_guilty', 'mistrial', 'dismissed'
        );
        CREATE TYPE auth_event_enum AS ENUM (
            'login_success', 'login_failure', 'logout', 'password_change',
            'password_reset_request', 'password_reset_complete',
            'mfa_success', 'mfa_failure', 'token_refresh',
            'account_locked', 'account_unlocked'
        );
        """
    )

    # Location
    op.create_table(
        "location",
        sa.Column("location_id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("city", sa.String(100), nullable=True),
        sa.Column("region", sa.String(100), nullable=True),
        sa.Column("address", sa.String(255), nullable=True),
        sa.Column("latitude", sa.Numeric(10, 7), nullable=True),
        sa.Column("longitude", sa.Numeric(10, 7), nullable=True),
        sa.Column(
            "location_type",
            postgresql.ENUM(
                "country",
                "region",
                "city",
                "district",
                "street",
                "building",
                "crime_scene",
                "court",
                "storage",
                "other",
                name="location_type_enum",
                create_type=False,
            ),
            nullable=True,
        ),
        sa.Column(
            "parent_location_id",
            sa.Integer(),
            sa.ForeignKey("location.location_id"),
            nullable=True,
        ),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )

    # Person
    op.create_table(
        "person",
        sa.Column("person_id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("first_name", sa.String(100), nullable=False),
        sa.Column("last_name", sa.String(100), nullable=False),
        sa.Column(
            "gender",
            postgresql.ENUM(
                "male",
                "female",
                "other",
                "undisclosed",
                name="gender_enum",
                create_type=False,
            ),
            nullable=True,
        ),
        sa.Column("dob", sa.DateTime(timezone=True), nullable=True),
        sa.Column("phone", sa.String(30), nullable=True),
        sa.Column("address", sa.String(255), nullable=True),
        sa.Column("national_id", sa.String(100), nullable=False, unique=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("idx_person_national_id", "person", ["national_id"])

    # Role
    op.create_table(
        "role",
        sa.Column("role_id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("role_name", sa.String(100), nullable=False, unique=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )

    # Department
    op.create_table(
        "department",
        sa.Column("department_id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(100), nullable=False, unique=True),
        sa.Column("location_id", sa.Integer(), sa.ForeignKey("location.location_id"), nullable=True),
        sa.Column("department_head_officer_id", sa.Integer(), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )

    # Officer
    op.create_table(
        "officer",
        sa.Column("officer_id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("person_id", sa.Integer(), sa.ForeignKey("person.person_id"), nullable=False, unique=True),
        sa.Column("department_id", sa.Integer(), sa.ForeignKey("department.department_id"), nullable=True),
        sa.Column("role_id", sa.Integer(), sa.ForeignKey("role.role_id"), nullable=False),
        sa.Column("rank", sa.String(50), nullable=True),
        sa.Column("badge_number", sa.String(50), nullable=True, unique=True),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, default=True),
        sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("idx_officer_department", "officer", ["department_id"])
    op.create_index(
        "idx_officer_deleted",
        "officer",
        ["deleted_at"],
        postgresql_where=sa.text("deleted_at IS NULL"),
    )

    # Add FK from department to officer for department_head
    op.create_foreign_key(
        "fk_department_head_officer",
        "department",
        "officer",
        ["department_head_officer_id"],
        ["officer_id"],
    )

    # Officer History
    op.create_table(
        "officer_history",
        sa.Column("history_id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("officer_id", sa.Integer(), sa.ForeignKey("officer.officer_id"), nullable=False),
        sa.Column("changed_by", sa.Integer(), sa.ForeignKey("officer.officer_id"), nullable=False),
        sa.Column("field_name", sa.String(100), nullable=False),
        sa.Column("old_value", sa.Text(), nullable=True),
        sa.Column("new_value", sa.Text(), nullable=True),
        sa.Column(
            "changed_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )
    op.create_index("idx_officer_history_officer", "officer_history", ["officer_id"])

    # Person History
    op.create_table(
        "person_history",
        sa.Column("history_id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("person_id", sa.Integer(), sa.ForeignKey("person.person_id"), nullable=False),
        sa.Column("changed_by", sa.Integer(), sa.ForeignKey("officer.officer_id"), nullable=False),
        sa.Column("field_name", sa.String(100), nullable=False),
        sa.Column("old_value", sa.Text(), nullable=True),
        sa.Column("new_value", sa.Text(), nullable=True),
        sa.Column(
            "changed_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )
    op.create_index("idx_person_history_person", "person_history", ["person_id"])

    # Auth Audit Log
    op.create_table(
        "auth_audit_log",
        sa.Column("log_id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("officer_id", sa.Integer(), sa.ForeignKey("officer.officer_id"), nullable=True),
        sa.Column(
            "event_type",
            postgresql.ENUM(
                "login_success",
                "login_failure",
                "logout",
                "password_change",
                "password_reset_request",
                "password_reset_complete",
                "mfa_success",
                "mfa_failure",
                "token_refresh",
                "account_locked",
                "account_unlocked",
                name="auth_event_enum",
                create_type=False,
            ),
            nullable=False,
        ),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("user_agent", sa.Text(), nullable=True),
        sa.Column("success", sa.Boolean(), nullable=False),
        sa.Column("failure_reason", sa.Text(), nullable=True),
        sa.Column("metadata", postgresql.JSONB(), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )
    op.create_index("idx_auth_audit_officer", "auth_audit_log", ["officer_id"])

    # Password Reset Audit
    op.create_table(
        "password_reset_audit",
        sa.Column("reset_id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("officer_id", sa.Integer(), sa.ForeignKey("officer.officer_id"), nullable=False),
        sa.Column(
            "requested_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("reset_token_hash", sa.String(255), nullable=True),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("expired_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("used", sa.Boolean(), nullable=False, default=False),
    )

    # Case Status (seed data table)
    op.create_table(
        "case_status",
        sa.Column("status_id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("status_name", sa.String(50), nullable=False, unique=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_terminal", sa.Boolean(), nullable=False, default=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )

    # Crime Type
    op.create_table(
        "crime_type",
        sa.Column("crime_type_id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "severity",
            postgresql.ENUM(
                "infraction",
                "misdemeanor",
                "felony",
                "capital",
                name="severity_enum",
                create_type=False,
            ),
            nullable=True,
        ),
        sa.Column("penal_code", sa.String(100), nullable=True),
        sa.Column("parent_crime_type_id", sa.Integer(), sa.ForeignKey("crime_type.crime_type_id"), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )

    # Append-Only Trigger Function
    op.execute(
        """
        CREATE OR REPLACE FUNCTION prevent_audit_table_modification()
        RETURNS TRIGGER AS $$
        BEGIN
            RAISE EXCEPTION 'Modifications to this table are not permitted. It is append-only.';
        END;
        $$ LANGUAGE plpgsql;
        """
    )

    op.execute(
        """
        CREATE TRIGGER trg_officer_history_immutable
        BEFORE UPDATE OR DELETE ON officer_history
        FOR EACH ROW EXECUTE FUNCTION prevent_audit_table_modification();
        """
    )

    op.execute(
        """
        CREATE TRIGGER trg_person_history_immutable
        BEFORE UPDATE OR DELETE ON person_history
        FOR EACH ROW EXECUTE FUNCTION prevent_audit_table_modification();
        """
    )

    op.execute(
        """
        CREATE TRIGGER trg_auth_audit_log_immutable
        BEFORE UPDATE OR DELETE ON auth_audit_log
        FOR EACH ROW EXECUTE FUNCTION prevent_audit_table_modification();
        """
    )

    # Role Seed Data
    op.execute(
        """
        INSERT INTO role (role_name, description) VALUES
        ('readonly', 'Read-only access to permitted cases'),
        ('forensic', 'Forensic officer with evidence handling rights'),
        ('legal_officer', 'Legal proceedings and charge management'),
        ('investigator', 'Standard investigator with case creation rights'),
        ('department_head', 'Departmental administrative authority'),
        ('admin', 'Global administrative authority'),
        ('superadmin', 'Unrestricted system authority')
        ON CONFLICT (role_name) DO NOTHING;
        """
    )

    # Case Status Seed Data
    op.execute(
        """
        INSERT INTO case_status (status_name, description, is_terminal) VALUES
        ('open', 'Case is open and active', false),
        ('under_investigation', 'Case is under active investigation', false),
        ('referred_to_court', 'Case has been referred to court', false),
        ('closed', 'Case has been closed', true),
        ('archived', 'Case has been archived', true)
        ON CONFLICT (status_name) DO NOTHING;
        """
    )


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS trg_auth_audit_log_immutable ON auth_audit_log;")
    op.execute("DROP TRIGGER IF EXISTS trg_person_history_immutable ON person_history;")
    op.execute("DROP TRIGGER IF EXISTS trg_officer_history_immutable ON officer_history;")
    op.execute("DROP FUNCTION IF EXISTS prevent_audit_table_modification();")
    op.drop_table("password_reset_audit")
    op.drop_table("auth_audit_log")
    op.drop_table("person_history")
    op.drop_table("officer_history")
    op.drop_foreign_key("fk_department_head_officer", "department", "officer")
    op.drop_table("officer")
    op.drop_table("department")
    op.drop_table("role")
    op.drop_table("crime_type")
    op.drop_table("case_status")
    op.drop_table("person")
    op.drop_table("location")
    op.execute("DROP TYPE IF EXISTS auth_event_enum;")
    op.execute("DROP TYPE IF EXISTS verdict_enum;")
    op.execute("DROP TYPE IF EXISTS charge_status_enum;")
    op.execute("DROP TYPE IF EXISTS role_in_case_enum;")
    op.execute("DROP TYPE IF EXISTS access_level_enum;")
    op.execute("DROP TYPE IF EXISTS risk_level_enum;")
    op.execute("DROP TYPE IF EXISTS severity_enum;")
    op.execute("DROP TYPE IF EXISTS location_type_enum;")
    op.execute("DROP TYPE IF EXISTS gender_enum;")
