"""evidence_type_vehicle_weapon_custody_forensic_photo_interrogation

Revision ID: 005
Revises: 004
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "005"
down_revision = "004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "evidence_type",
        sa.Column("evidence_type_id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    op.add_column(
        "evidence",
        sa.Column(
            "evidence_type_id",
            sa.Integer(),
            sa.ForeignKey("evidence_type.evidence_type_id"),
            nullable=True,
        ),
    )
    op.add_column(
        "evidence",
        sa.Column(
            "is_sensitive",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )
    op.create_index("idx_evidence_evidence_type_id", "evidence", ["evidence_type_id"])

    op.create_table(
        "vehicle",
        sa.Column("vehicle_id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "evidence_id",
            sa.Integer(),
            sa.ForeignKey("evidence.evidence_id"),
            nullable=False,
            unique=True,
        ),
        sa.Column("plate_number", sa.String(30), nullable=True),
        sa.Column("type", sa.String(50), nullable=True),
        sa.Column("make", sa.String(100), nullable=True),
        sa.Column("model", sa.String(100), nullable=True),
        sa.Column("color", sa.String(50), nullable=True),
        sa.Column("year", sa.Integer(), nullable=True),
        sa.Column("vin", sa.String(50), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
    )

    op.create_table(
        "weapon",
        sa.Column("weapon_id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "evidence_id",
            sa.Integer(),
            sa.ForeignKey("evidence.evidence_id"),
            nullable=False,
            unique=True,
        ),
        sa.Column("type", sa.String(50), nullable=True),
        sa.Column("make", sa.String(100), nullable=True),
        sa.Column("serial_number", sa.String(100), nullable=True, unique=True),
        sa.Column("caliber", sa.String(50), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
    )

    op.create_table(
        "chain_of_custody",
        sa.Column("chain_id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "evidence_id",
            sa.Integer(),
            sa.ForeignKey("evidence.evidence_id"),
            nullable=False,
        ),
        sa.Column(
            "officer_id",
            sa.Integer(),
            sa.ForeignKey("officer.officer_id"),
            nullable=False,
        ),
        sa.Column("action", sa.String(100), nullable=False),
        sa.Column(
            "transferred_to",
            sa.Integer(),
            sa.ForeignKey("officer.officer_id"),
            nullable=True,
        ),
        sa.Column(
            "location_id",
            sa.Integer(),
            sa.ForeignKey("location.location_id"),
            nullable=True,
        ),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("idx_chain_evidence", "chain_of_custody", ["evidence_id"])

    op.create_table(
        "forensic_report",
        sa.Column("report_id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "evidence_id",
            sa.Integer(),
            sa.ForeignKey("evidence.evidence_id"),
            nullable=False,
            unique=True,
        ),
        sa.Column(
            "officer_id",
            sa.Integer(),
            sa.ForeignKey("officer.officer_id"),
            nullable=False,
        ),
        sa.Column("findings", sa.Text(), nullable=False),
        sa.Column("methodology", sa.Text(), nullable=True),
        sa.Column("report_date", sa.Date(), nullable=False),
        sa.Column("lab_reference", sa.String(100), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )

    op.create_table(
        "crime_scene_photo",
        sa.Column("photo_id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("case_id", sa.Integer(), sa.ForeignKey("case.case_id"), nullable=False),
        sa.Column(
            "evidence_id",
            sa.Integer(),
            sa.ForeignKey("evidence.evidence_id"),
            nullable=True,
        ),
        sa.Column("image_url", sa.String(500), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("captured_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "captured_by",
            sa.Integer(),
            sa.ForeignKey("officer.officer_id"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("idx_crime_scene_photo_case_id", "crime_scene_photo", ["case_id"])

    op.create_table(
        "interrogation",
        sa.Column("interrogation_id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("case_id", sa.Integer(), sa.ForeignKey("case.case_id"), nullable=False),
        sa.Column(
            "suspect_id",
            sa.Integer(),
            sa.ForeignKey("suspect.suspect_id"),
            nullable=False,
        ),
        sa.Column(
            "officer_id",
            sa.Integer(),
            sa.ForeignKey("officer.officer_id"),
            nullable=False,
        ),
        sa.Column(
            "location_id",
            sa.Integer(),
            sa.ForeignKey("location.location_id"),
            nullable=True,
        ),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("recording_url", sa.String(500), nullable=True),
        sa.Column("date", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("idx_interrogation_case_id", "interrogation", ["case_id"])

    op.create_index("idx_evidence_case", "evidence", ["case_id"])
    op.create_index("idx_arrest_case", "arrest", ["case_id"])
    op.create_index(
        "idx_arrest_released",
        "arrest",
        ["case_id"],
        postgresql_where=sa.text("released_at IS NULL"),
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_arrest_released;")
    op.execute("DROP INDEX IF EXISTS idx_arrest_case;")
    op.execute("DROP INDEX IF EXISTS idx_evidence_case;")
    op.drop_index("idx_interrogation_case_id", table_name="interrogation")
    op.drop_table("interrogation")
    op.drop_index("idx_crime_scene_photo_case_id", table_name="crime_scene_photo")
    op.drop_table("crime_scene_photo")
    op.drop_table("forensic_report")
    op.drop_index("idx_chain_evidence", table_name="chain_of_custody")
    op.drop_table("chain_of_custody")
    op.drop_table("weapon")
    op.drop_table("vehicle")
    op.drop_index("idx_evidence_evidence_type_id", table_name="evidence")
    op.drop_column("evidence", "is_sensitive")
    op.drop_column("evidence", "evidence_type_id")
    op.drop_table("evidence_type")
