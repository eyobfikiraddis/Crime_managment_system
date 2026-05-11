from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.modules.auth.models import (
    AuthAuditLog,
    Department,
    Officer,
    OfficerHistory,
    Person,
    PersonHistory,
    Role,
)
from app.shared.base_model import Base
from app.shared.enums import RiskLevelEnum


class DepartmentAuditLog(Base):
    __tablename__ = "department_audit_log"

    audit_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    department_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("department.department_id"), nullable=False
    )
    changed_by_officer_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("officer.officer_id"), nullable=False
    )
    event_type: Mapped[str] = mapped_column(String(100), nullable=False)
    old_value: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    new_value: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    department: Mapped[Department] = relationship("Department", backref="audit_logs")
    changed_by: Mapped[Officer] = relationship(
        "Officer", backref="department_audit_logs", foreign_keys=[changed_by_officer_id]
    )


class Suspect(Base):
    __tablename__ = "suspect"

    suspect_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    person_id: Mapped[int] = mapped_column(Integer, ForeignKey("person.person_id"), nullable=False)
    criminal_record: Mapped[str | None] = mapped_column(Text, nullable=True)
    risk_level: Mapped[RiskLevelEnum | None] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    person: Mapped[Person] = relationship("Person", backref="suspect_profiles")


class Victim(Base):
    __tablename__ = "victim"

    victim_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    person_id: Mapped[int] = mapped_column(Integer, ForeignKey("person.person_id"), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    person: Mapped[Person] = relationship("Person", backref="victim_profiles")


class Witness(Base):
    __tablename__ = "witness"

    witness_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    person_id: Mapped[int] = mapped_column(Integer, ForeignKey("person.person_id"), nullable=False)
    credibility_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_protected: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    person: Mapped[Person] = relationship("Person", backref="witness_profiles")


__all__ = [
    "AuthAuditLog",
    "Department",
    "DepartmentAuditLog",
    "Officer",
    "OfficerHistory",
    "Person",
    "PersonHistory",
    "Role",
    "Suspect",
    "Victim",
    "Witness",
]
