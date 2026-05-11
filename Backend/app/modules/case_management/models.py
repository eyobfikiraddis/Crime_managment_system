from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.modules.auth.models import Location, Officer, Person
from app.modules.personnel.models import Suspect, Victim, Witness
from app.shared.base_model import AuditMixin, Base
from app.shared.enums import (
    AccessLevelEnum,
    ChargeStatusEnum,
    RiskLevelEnum,
    RoleInCaseEnum,
    SeverityEnum,
    VerdictEnum,
)


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
    archived_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    updated_by: Mapped[int | None] = mapped_column(Integer, ForeignKey("officer.officer_id"), nullable=True)
    archived_by: Mapped[int | None] = mapped_column(Integer, ForeignKey("officer.officer_id"), nullable=True)
    closed_by: Mapped[int | None] = mapped_column(Integer, ForeignKey("officer.officer_id"), nullable=True)
    risk_level: Mapped[RiskLevelEnum | None] = mapped_column(nullable=True)

    crime_type: Mapped[CrimeType] = relationship("CrimeType", back_populates="cases")
    status: Mapped[CaseStatus] = relationship("CaseStatus", back_populates="cases")
    primary_location: Mapped[Location | None] = relationship("Location")
    lead_officer: Mapped[Officer | None] = relationship(
        "Officer", backref="leading_cases", foreign_keys=[lead_officer_id]
    )
    updated_by_officer: Mapped[Officer | None] = relationship("Officer", foreign_keys=[updated_by])
    archived_by_officer: Mapped[Officer | None] = relationship("Officer", foreign_keys=[archived_by])
    closed_by_officer: Mapped[Officer | None] = relationship("Officer", foreign_keys=[closed_by])

    participants: Mapped[list["CasePerson"]] = relationship("CasePerson", back_populates="case")
    suspect_links: Mapped[list["CaseSuspect"]] = relationship("CaseSuspect", back_populates="case")
    victim_links: Mapped[list["CaseVictim"]] = relationship("CaseVictim", back_populates="case")
    witness_links: Mapped[list["CaseWitness"]] = relationship("CaseWitness", back_populates="case")
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
    suspect_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("suspect.suspect_id"), nullable=True
    )
    court_case_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("court_case.court_case_id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    case: Mapped[Case] = relationship("Case", back_populates="charges")
    person: Mapped[Person] = relationship("Person", backref="charges")
    crime_type: Mapped[CrimeType] = relationship("CrimeType", back_populates="charges")
    suspect: Mapped[Suspect | None] = relationship("Suspect", foreign_keys=[suspect_id])
    court_case: Mapped["CourtCase | None"] = relationship(
        "CourtCase", back_populates="charges", foreign_keys=[court_case_id]
    )


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
    removed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    assigned_by: Mapped[int | None] = mapped_column(Integer, ForeignKey("officer.officer_id"), nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    case: Mapped[Case] = relationship("Case", back_populates="case_officers")
    assigned_by_officer: Mapped[Officer | None] = relationship("Officer", foreign_keys=[assigned_by])
    officer: Mapped[Officer] = relationship("Officer", backref="case_assignments")


class EvidenceType(Base):
    __tablename__ = "evidence_type"

    evidence_type_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    evidence_items: Mapped[list["Evidence"]] = relationship("Evidence", back_populates="evidence_type")


class Evidence(Base, AuditMixin):
    __tablename__ = "evidence"

    evidence_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    case_id: Mapped[int] = mapped_column(Integer, ForeignKey("case.case_id"), nullable=False)
    evidence_tag: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    evidence_type_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("evidence_type.evidence_type_id"), nullable=True
    )
    is_sensitive: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    storage_location_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("location.location_id"), nullable=True
    )
    collected_by_officer_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("officer.officer_id"), nullable=True
    )
    chain_of_custody_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    collected_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    case: Mapped[Case] = relationship("Case", back_populates="evidence_items")
    evidence_type: Mapped[EvidenceType | None] = relationship(
        "EvidenceType", back_populates="evidence_items"
    )
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
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    case: Mapped[Case] = relationship("Case", back_populates="notes")
    officer: Mapped[Officer] = relationship("Officer", backref="case_notes")


class Arrest(Base):
    __tablename__ = "arrest"

    arrest_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    suspect_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("suspect.suspect_id"), nullable=False
    )
    officer_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("officer.officer_id"), nullable=False
    )
    case_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("case.case_id"), nullable=True
    )
    booking_number: Mapped[str | None] = mapped_column(String(100), nullable=True, unique=True)
    location_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("location.location_id"), nullable=True
    )
    bail_amount: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    bail_set_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    released_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    suspect: Mapped[Suspect] = relationship("Suspect", backref="arrest_records")
    arresting_officer: Mapped[Officer] = relationship(
        "Officer", backref="arrests_made", foreign_keys=[officer_id]
    )
    case: Mapped[Case | None] = relationship("Case", backref="arrests")
    location: Mapped[Location | None] = relationship(
        "Location", foreign_keys=[location_id]
    )


class CaseUpdate(Base):
    __tablename__ = "case_update"

    update_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    case_id: Mapped[int] = mapped_column(Integer, ForeignKey("case.case_id"), nullable=False)
    officer_id: Mapped[int] = mapped_column(Integer, ForeignKey("officer.officer_id"), nullable=False)
    update_type: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    case: Mapped[Case] = relationship("Case", backref="case_updates")
    officer: Mapped[Officer] = relationship("Officer", backref="case_update_entries")


class CasePermission(Base):
    __tablename__ = "case_permission"

    permission_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    case_id: Mapped[int] = mapped_column(Integer, ForeignKey("case.case_id"), nullable=False)
    officer_id: Mapped[int] = mapped_column(Integer, ForeignKey("officer.officer_id"), nullable=False)
    access_level: Mapped[AccessLevelEnum] = mapped_column(nullable=False)
    can_read: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    can_write: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    can_admin: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    granted_by: Mapped[int] = mapped_column(Integer, ForeignKey("officer.officer_id"), nullable=False)
    granted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    revoked_by: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("officer.officer_id"), nullable=True
    )

    case: Mapped[Case] = relationship("Case", backref="permissions")
    officer: Mapped[Officer] = relationship("Officer", foreign_keys=[officer_id])


class CasePermissionAudit(Base):
    __tablename__ = "case_permission_audit"

    audit_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    permission_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("case_permission.permission_id"), nullable=False
    )
    case_id: Mapped[int] = mapped_column(Integer, ForeignKey("case.case_id"), nullable=False)
    officer_id: Mapped[int] = mapped_column(Integer, ForeignKey("officer.officer_id"), nullable=False)
    action: Mapped[str] = mapped_column(String(50), nullable=False)
    old_access_level: Mapped[AccessLevelEnum | None] = mapped_column(nullable=True)
    new_access_level: Mapped[AccessLevelEnum | None] = mapped_column(nullable=True)
    performed_by: Mapped[int] = mapped_column(Integer, ForeignKey("officer.officer_id"), nullable=False)
    performed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)


class Report(Base, AuditMixin):
    __tablename__ = "report"

    report_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    case_id: Mapped[int] = mapped_column(Integer, ForeignKey("case.case_id"), nullable=False)
    officer_id: Mapped[int] = mapped_column(Integer, ForeignKey("officer.officer_id"), nullable=False)
    report_type: Mapped[str] = mapped_column(String(50), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    case: Mapped[Case] = relationship("Case", backref="reports")
    officer: Mapped[Officer] = relationship("Officer", backref="submitted_reports")


class Vehicle(Base):
    __tablename__ = "vehicle"

    vehicle_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    evidence_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("evidence.evidence_id"), nullable=False, unique=True
    )
    plate_number: Mapped[str | None] = mapped_column(String(30), nullable=True)
    type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    make: Mapped[str | None] = mapped_column(String(100), nullable=True)
    model: Mapped[str | None] = mapped_column(String(100), nullable=True)
    color: Mapped[str | None] = mapped_column(String(50), nullable=True)
    year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    vin: Mapped[str | None] = mapped_column(String(50), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    evidence: Mapped[Evidence] = relationship("Evidence", backref="vehicle_detail")


class Weapon(Base):
    __tablename__ = "weapon"

    weapon_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    evidence_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("evidence.evidence_id"), nullable=False, unique=True
    )
    type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    make: Mapped[str | None] = mapped_column(String(100), nullable=True)
    serial_number: Mapped[str | None] = mapped_column(String(100), nullable=True, unique=True)
    caliber: Mapped[str | None] = mapped_column(String(50), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    evidence: Mapped[Evidence] = relationship("Evidence", backref="weapon_detail")


class ForensicReport(Base):
    __tablename__ = "forensic_report"

    report_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    evidence_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("evidence.evidence_id"), nullable=False, unique=True
    )
    officer_id: Mapped[int] = mapped_column(Integer, ForeignKey("officer.officer_id"), nullable=False)
    findings: Mapped[str] = mapped_column(Text, nullable=False)
    methodology: Mapped[str | None] = mapped_column(Text, nullable=True)
    report_date: Mapped[date] = mapped_column(Date, nullable=False)
    lab_reference: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    evidence: Mapped[Evidence] = relationship("Evidence", backref="forensic_report_doc")
    officer: Mapped[Officer] = relationship("Officer", backref="forensic_reports")


class CrimeScenePhoto(Base):
    __tablename__ = "crime_scene_photo"

    photo_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    case_id: Mapped[int] = mapped_column(Integer, ForeignKey("case.case_id"), nullable=False)
    evidence_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("evidence.evidence_id"), nullable=True
    )
    image_url: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    captured_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    captured_by: Mapped[int] = mapped_column(Integer, ForeignKey("officer.officer_id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    case: Mapped[Case] = relationship("Case", backref="scene_photos")
    evidence: Mapped[Evidence | None] = relationship("Evidence", backref="scene_photos")
    photographer: Mapped[Officer] = relationship("Officer", backref="crime_scene_photos")


class Interrogation(Base):
    __tablename__ = "interrogation"

    interrogation_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    case_id: Mapped[int] = mapped_column(Integer, ForeignKey("case.case_id"), nullable=False)
    suspect_id: Mapped[int] = mapped_column(Integer, ForeignKey("suspect.suspect_id"), nullable=False)
    officer_id: Mapped[int] = mapped_column(Integer, ForeignKey("officer.officer_id"), nullable=False)
    location_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("location.location_id"), nullable=True
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    recording_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    case: Mapped[Case] = relationship("Case", backref="interrogations")
    suspect: Mapped[Suspect] = relationship("Suspect", backref="interrogations")
    officer: Mapped[Officer] = relationship("Officer", backref="interrogations_led")


class CourtCase(Base, AuditMixin):
    __tablename__ = "court_case"

    court_case_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    case_id: Mapped[int] = mapped_column(Integer, ForeignKey("case.case_id"), nullable=False, unique=True)
    court_name: Mapped[str] = mapped_column(String(255), nullable=False)
    court_reference: Mapped[str | None] = mapped_column(String(100), nullable=True)
    judge_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    prosecutor_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    hearing_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    verdict: Mapped[VerdictEnum | None] = mapped_column(nullable=True)
    verdict_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    case: Mapped[Case] = relationship("Case", backref="court_case_record", uselist=False)
    charges: Mapped[list["Charge"]] = relationship(
        "Charge", back_populates="court_case", foreign_keys="Charge.court_case_id"
    )


class Sentence(Base, AuditMixin):
    __tablename__ = "sentence"

    sentence_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    charge_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("charge.charge_id"), nullable=False, unique=True
    )
    court_case_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("court_case.court_case_id"), nullable=False
    )
    description: Mapped[str] = mapped_column(Text, nullable=False)
    duration: Mapped[str | None] = mapped_column(String(100), nullable=True)
    duration_days: Mapped[int | None] = mapped_column(Integer, nullable=True)
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    sentence_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    is_suspended: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    sentenced_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    charge: Mapped[Charge] = relationship("Charge", backref="sentence_record", uselist=False)
    court_case: Mapped[CourtCase] = relationship("CourtCase", backref="sentences")


class CaseSuspect(Base):
    __tablename__ = "case_suspects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    case_id: Mapped[int] = mapped_column(Integer, ForeignKey("case.case_id"), nullable=False)
    suspect_id: Mapped[int] = mapped_column(Integer, ForeignKey("suspect.suspect_id"), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    added_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    added_by: Mapped[int] = mapped_column(Integer, ForeignKey("officer.officer_id"), nullable=False)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    case: Mapped[Case] = relationship("Case", back_populates="suspect_links")
    suspect: Mapped[Suspect] = relationship("Suspect", backref="case_links")
    added_by_officer: Mapped[Officer] = relationship("Officer", foreign_keys=[added_by])


class CaseVictim(Base):
    __tablename__ = "case_victims"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    case_id: Mapped[int] = mapped_column(Integer, ForeignKey("case.case_id"), nullable=False)
    victim_id: Mapped[int] = mapped_column(Integer, ForeignKey("victim.victim_id"), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    added_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    added_by: Mapped[int] = mapped_column(Integer, ForeignKey("officer.officer_id"), nullable=False)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    case: Mapped[Case] = relationship("Case", back_populates="victim_links")
    victim: Mapped[Victim] = relationship("Victim", backref="case_links")
    added_by_officer: Mapped[Officer] = relationship("Officer", foreign_keys=[added_by])


class CaseWitness(Base):
    __tablename__ = "case_witnesses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    case_id: Mapped[int] = mapped_column(Integer, ForeignKey("case.case_id"), nullable=False)
    witness_id: Mapped[int] = mapped_column(Integer, ForeignKey("witness.witness_id"), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    added_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    added_by: Mapped[int] = mapped_column(Integer, ForeignKey("officer.officer_id"), nullable=False)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    case: Mapped[Case] = relationship("Case", back_populates="witness_links")
    witness: Mapped[Witness] = relationship("Witness", backref="case_links")
    added_by_officer: Mapped[Officer] = relationship("Officer", foreign_keys=[added_by])


class EvidenceHistory(Base):
    __tablename__ = "evidence_history"

    history_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    evidence_id: Mapped[int] = mapped_column(Integer, ForeignKey("evidence.evidence_id"), nullable=False)
    changed_by: Mapped[int] = mapped_column(Integer, ForeignKey("officer.officer_id"), nullable=False)
    field_name: Mapped[str] = mapped_column(String(100), nullable=False)
    old_value: Mapped[str | None] = mapped_column(Text, nullable=True)
    new_value: Mapped[str | None] = mapped_column(Text, nullable=True)
    changed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    evidence: Mapped[Evidence] = relationship("Evidence", backref="history_records")
    changed_by_officer: Mapped[Officer] = relationship("Officer", foreign_keys=[changed_by])


class ChainOfCustody(Base):
    __tablename__ = "chain_of_custody"

    chain_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    evidence_id: Mapped[int] = mapped_column(Integer, ForeignKey("evidence.evidence_id"), nullable=False)
    officer_id: Mapped[int] = mapped_column(Integer, ForeignKey("officer.officer_id"), nullable=False)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    transferred_to: Mapped[int | None] = mapped_column(Integer, ForeignKey("officer.officer_id"), nullable=True)
    location_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("location.location_id"), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    evidence: Mapped[Evidence] = relationship("Evidence", backref="chain_events")
    officer: Mapped[Officer] = relationship("Officer", foreign_keys=[officer_id])
    transferred_to_officer: Mapped[Officer | None] = relationship("Officer", foreign_keys=[transferred_to])
    location: Mapped[Location | None] = relationship("Location", foreign_keys=[location_id])
