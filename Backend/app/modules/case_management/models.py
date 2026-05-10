from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.modules.auth.models import Location, Officer, Person
from app.shared.base_model import AuditMixin, Base
from app.shared.enums import ChargeStatusEnum, RiskLevelEnum, RoleInCaseEnum, SeverityEnum, VerdictEnum


class CaseStatus(Base):
    __tablename__ = "case_status"

    status_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    status_name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_terminal: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    cases: Mapped[list["Case"]] = relationship("Case", back_populates="status")


class CrimeType(Base, AuditMixin):
    __tablename__ = "crime_type"

    crime_type_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    severity: Mapped[SeverityEnum | None] = mapped_column(nullable=True)
    penal_code: Mapped[str | None] = mapped_column(String(100), nullable=True)
    parent_crime_type_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("crime_type.crime_type_id"), nullable=True
    )

    cases: Mapped[list["Case"]] = relationship("Case", back_populates="crime_type")
    charges: Mapped[list["Charge"]] = relationship("Charge", back_populates="crime_type")


class Case(Base, AuditMixin):
    __tablename__ = "case"

    case_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    case_number: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    crime_type_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("crime_type.crime_type_id"), nullable=False
    )
    status_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("case_status.status_id"), nullable=False
    )
    severity: Mapped[SeverityEnum | None] = mapped_column(nullable=True)
    primary_location_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("location.location_id"), nullable=True
    )
    lead_officer_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("officer.officer_id"), nullable=True
    )
    opened_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    risk_level: Mapped[RiskLevelEnum | None] = mapped_column(nullable=True)

    crime_type: Mapped[CrimeType] = relationship("CrimeType", back_populates="cases")
    status: Mapped[CaseStatus] = relationship("CaseStatus", back_populates="cases")
    primary_location: Mapped[Location | None] = relationship("Location")
    lead_officer: Mapped[Officer | None] = relationship(
        "Officer", backref="leading_cases", foreign_keys=[lead_officer_id]
    )

    participants: Mapped[list["CasePerson"]] = relationship("CasePerson", back_populates="case")
    charges: Mapped[list["Charge"]] = relationship("Charge", back_populates="case")
    case_officers: Mapped[list["CaseOfficer"]] = relationship(
        "CaseOfficer", back_populates="case"
    )
    assigned_officers: Mapped[list[Officer]] = relationship(
        "Officer",
        secondary="case_officer",
        viewonly=True,
        backref="assigned_cases",
    )
    evidence_items: Mapped[list["Evidence"]] = relationship("Evidence", back_populates="case")
    notes: Mapped[list["CaseNote"]] = relationship("CaseNote", back_populates="case")


class CasePerson(Base):
    __tablename__ = "case_person"

    case_person_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    case_id: Mapped[int] = mapped_column(Integer, ForeignKey("case.case_id"), nullable=False)
    person_id: Mapped[int] = mapped_column(Integer, ForeignKey("person.person_id"), nullable=False)
    role_type: Mapped[str] = mapped_column(String(50), nullable=False)
    is_primary: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    case: Mapped[Case] = relationship("Case", back_populates="participants")
    person: Mapped[Person] = relationship("Person", backref="case_participations")


class Charge(Base):
    __tablename__ = "charge"

    charge_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    case_id: Mapped[int] = mapped_column(Integer, ForeignKey("case.case_id"), nullable=False)
    person_id: Mapped[int] = mapped_column(Integer, ForeignKey("person.person_id"), nullable=False)
    crime_type_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("crime_type.crime_type_id"), nullable=False
    )
    charge_status: Mapped[ChargeStatusEnum] = mapped_column(nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    filed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    verdict: Mapped[VerdictEnum | None] = mapped_column(nullable=True)
    sentence_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    case: Mapped[Case] = relationship("Case", back_populates="charges")
    person: Mapped[Person] = relationship("Person", backref="charges")
    crime_type: Mapped[CrimeType] = relationship("CrimeType", back_populates="charges")


class CaseOfficer(Base):
    __tablename__ = "case_officer"

    assignment_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    case_id: Mapped[int] = mapped_column(Integer, ForeignKey("case.case_id"), nullable=False)
    officer_id: Mapped[int] = mapped_column(Integer, ForeignKey("officer.officer_id"), nullable=False)
    role_in_case: Mapped[RoleInCaseEnum] = mapped_column(nullable=False)
    assigned_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    unassigned_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    case: Mapped[Case] = relationship("Case", back_populates="case_officers")
    officer: Mapped[Officer] = relationship("Officer", backref="case_assignments")


class Evidence(Base, AuditMixin):
    __tablename__ = "evidence"

    evidence_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    case_id: Mapped[int] = mapped_column(Integer, ForeignKey("case.case_id"), nullable=False)
    evidence_tag: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    storage_location_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("location.location_id"), nullable=True
    )
    collected_by_officer_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("officer.officer_id"), nullable=True
    )
    chain_of_custody_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    collected_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    case: Mapped[Case] = relationship("Case", back_populates="evidence_items")
    storage_location: Mapped[Location | None] = relationship(
        "Location", foreign_keys=[storage_location_id]
    )
    collected_by_officer: Mapped[Officer | None] = relationship(
        "Officer", backref="evidence_collected", foreign_keys=[collected_by_officer_id]
    )


class CaseNote(Base):
    __tablename__ = "case_note"

    note_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    case_id: Mapped[int] = mapped_column(Integer, ForeignKey("case.case_id"), nullable=False)
    officer_id: Mapped[int] = mapped_column(Integer, ForeignKey("officer.officer_id"), nullable=False)
    note_text: Mapped[str] = mapped_column(Text, nullable=False)
    is_internal: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    case: Mapped[Case] = relationship("Case", back_populates="notes")
    officer: Mapped[Officer] = relationship("Officer", backref="case_notes")
