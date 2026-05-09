from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.base_model import Base, AuditMixin, TimestampMixin
from app.shared.enums import AuthEventEnum, GenderEnum, LocationTypeEnum


class Role(Base, TimestampMixin):
    __tablename__ = "role"

    role_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    role_name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    officers: Mapped[list["Officer"]] = relationship("Officer", back_populates="role")


class Department(Base, AuditMixin):
    __tablename__ = "department"

    department_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    location_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("location.location_id"), nullable=True
    )
    department_head_officer_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("officer.officer_id"), nullable=True
    )

    officers: Mapped[list["Officer"]] = relationship(
        "Officer",
        primaryjoin="Department.department_id == Officer.department_id",
        back_populates="department",
        foreign_keys="Officer.department_id",
    )
    department_head: Mapped["Officer | None"] = relationship(
        "Officer",
        primaryjoin="Department.department_head_officer_id == Officer.officer_id",
        foreign_keys="Department.department_head_officer_id",
        uselist=False,
    )


class Person(Base, AuditMixin):
    __tablename__ = "person"

    person_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    gender: Mapped[GenderEnum | None] = mapped_column(nullable=True)
    dob: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    address: Mapped[str | None] = mapped_column(String(255), nullable=True)
    national_id: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)

    officer: Mapped["Officer | None"] = relationship("Officer", back_populates="person", uselist=False)
    history: Mapped[list["PersonHistory"]] = relationship("PersonHistory", back_populates="person")


class Officer(Base, AuditMixin):
    __tablename__ = "officer"

    officer_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    person_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("person.person_id"), nullable=False, unique=True
    )
    department_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("department.department_id"), nullable=True
    )
    role_id: Mapped[int] = mapped_column(Integer, ForeignKey("role.role_id"), nullable=False)
    rank: Mapped[str | None] = mapped_column(String(50), nullable=True)
    badge_number: Mapped[str | None] = mapped_column(String(50), nullable=True, unique=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    person: Mapped["Person"] = relationship("Person", back_populates="officer")
    role: Mapped["Role"] = relationship("Role", back_populates="officers")
    department: Mapped["Department | None"] = relationship(
        "Department",
        back_populates="officers",
        foreign_keys="Officer.department_id",
    )
    history: Mapped[list["OfficerHistory"]] = relationship(
    "OfficerHistory",
    back_populates="officer",
    foreign_keys="OfficerHistory.officer_id",   # explicitly link via officer_id
    )
    auth_audit_logs: Mapped[list["AuthAuditLog"]] = relationship(
        "AuthAuditLog", back_populates="officer"
    )
    password_reset_audits: Mapped[list["PasswordResetAudit"]] = relationship(
        "PasswordResetAudit", back_populates="officer"
    )


class OfficerHistory(Base):
    __tablename__ = "officer_history"

    history_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    officer_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("officer.officer_id"), nullable=False, index=True
    )
    changed_by: Mapped[int] = mapped_column(
        Integer, ForeignKey("officer.officer_id"), nullable=False
    )
    field_name: Mapped[str] = mapped_column(String(100), nullable=False)
    old_value: Mapped[str | None] = mapped_column(Text, nullable=True)
    new_value: Mapped[str | None] = mapped_column(Text, nullable=True)
    changed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    officer: Mapped["Officer"] = relationship(
        "Officer", foreign_keys=[officer_id], back_populates="history"
    )


class PersonHistory(Base):
    __tablename__ = "person_history"

    history_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    person_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("person.person_id"), nullable=False, index=True
    )
    changed_by: Mapped[int] = mapped_column(
        Integer, ForeignKey("officer.officer_id"), nullable=False
    )
    field_name: Mapped[str] = mapped_column(String(100), nullable=False)
    old_value: Mapped[str | None] = mapped_column(Text, nullable=True)
    new_value: Mapped[str | None] = mapped_column(Text, nullable=True)
    changed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    person: Mapped["Person"] = relationship("Person", back_populates="history")


class AuthAuditLog(Base):
    __tablename__ = "auth_audit_log"

    log_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    officer_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("officer.officer_id"), nullable=True, index=True
    )
    event_type: Mapped[AuthEventEnum] = mapped_column(nullable=False)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)
    success: Mapped[bool] = mapped_column(Boolean, nullable=False)
    failure_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    audit_metadata: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    officer: Mapped["Officer | None"] = relationship("Officer", back_populates="auth_audit_logs")


class PasswordResetAudit(Base):
    __tablename__ = "password_reset_audit"

    reset_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    officer_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("officer.officer_id"), nullable=False, index=True
    )
    requested_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    reset_token_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    expired_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    used: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    officer: Mapped["Officer"] = relationship("Officer", back_populates="password_reset_audits")


# TEMPORARY: Add a simple Location model for demonstration purposes
class Location(Base):
    __tablename__ = "location"

    location_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    # Add only the columns that are referenced – the FK from department just needs the table to exist
    name: Mapped[str] = mapped_column(String(255), nullable=False)