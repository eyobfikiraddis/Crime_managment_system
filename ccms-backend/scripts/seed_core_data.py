from __future__ import annotations

import asyncio
from datetime import date, datetime, timezone
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import async_session_factory
from app.core.security import hash_password
from app.modules.auth.models import Department, Location, Officer, Person, Role
from app.modules.case_management.models import (
    Arrest,
    Case,
    CaseNote,
    CaseOfficer,
    CasePermission,
    CasePermissionAudit,
    CasePerson,
    CaseStatus,
    CaseSuspect,
    CaseUpdate,
    CaseVictim,
    CaseWitness,
    ChainOfCustody,
    Charge,
    CrimeScenePhoto,
    CrimeType,
    CourtCase,
    Evidence,
    EvidenceHistory,
    EvidenceType,
    ForensicReport,
    Interrogation,
    Report,
    Sentence,
    Vehicle,
    Weapon,
)
from app.modules.personnel.models import DepartmentAuditLog, Suspect, Victim, Witness
from app.shared.enums import (
    AccessLevelEnum,
    ChargeStatusEnum,
    GenderEnum,
    RiskLevelEnum,
    RoleInCaseEnum,
    SeverityEnum,
    VerdictEnum,
)

OFFICER_SEEDS = [
    {
        "first_name": "Selam",
        "last_name": "Super",
        "national_id": "SUPER-0001",
        "role_name": "superadmin",
        "department": None,
        "password": "SuperPass123!",
        "badge_number": "SUP-001",
        "rank": "Commissioner",
    },
    {
        "first_name": "Dawit",
        "last_name": "Admin",
        "national_id": "ADMIN-0001",
        "role_name": "admin",
        "department": "Homicide",
        "password": "AdminPass123!",
        "badge_number": "ADM-001",
        "rank": "Commander",
    },
    {
        "first_name": "Muna",
        "last_name": "Head",
        "national_id": "HEAD-0001",
        "role_name": "department_head",
        "department": "Homicide",
        "password": "HeadPass123!",
        "badge_number": "DHD-001",
        "rank": "Captain",
    },
    {
        "first_name": "Kebede",
        "last_name": "Investigator",
        "national_id": "INV-0001",
        "role_name": "investigator",
        "department": "Homicide",
        "password": "InvestPass123!",
        "badge_number": "INV-001",
        "rank": "Detective",
    },
]

CIVILIAN_SEEDS = [
    {
        "first_name": "Alex",
        "last_name": "Smith",
        "national_id": "CIV-0001",
        "gender": GenderEnum.male,
    },
    {
        "first_name": "Ruth",
        "last_name": "Bekele",
        "national_id": "CIV-0002",
        "gender": GenderEnum.female,
    },
    {
        "first_name": "Noah",
        "last_name": "Tadesse",
        "national_id": "CIV-0003",
        "gender": GenderEnum.undisclosed,
    },
    {
        "first_name": "Hiwot",
        "last_name": "Getnet",
        "national_id": "CIV-0004",
        "gender": GenderEnum.female,
    },
    {
        "first_name": "Tariku",
        "last_name": "Demissew",
        "national_id": "CIV-0005",
        "gender": GenderEnum.male,
    },
]

CRIME_TYPES_SEEDS = [
    {"name": "Homicide", "severity": SeverityEnum.felony},
    {"name": "Robbery", "severity": SeverityEnum.felony},
    {"name": "Assault", "severity": SeverityEnum.felony},
    {"name": "Burglary", "severity": SeverityEnum.felony},
    {"name": "Theft", "severity": SeverityEnum.misdemeanor},
    {"name": "Fraud", "severity": SeverityEnum.misdemeanor},
    {"name": "DUI", "severity": SeverityEnum.misdemeanor},
]

EVIDENCE_TYPES_SEEDS = [
    {"name": "Weapon", "description": "Firearms, blades, and other weapons"},
    {"name": "Biological", "description": "Blood, saliva, tissue samples"},
    {"name": "Digital", "description": "Computers, phones, storage devices"},
    {"name": "Trace", "description": "Fibers, hair, DNA samples"},
    {"name": "Document", "description": "Written records and documents"},
    {"name": "Vehicle", "description": "Cars and other vehicles"},
    {"name": "Controlled Substance", "description": "Drugs and narcotics"},
]

CASE_STATUS_SEEDS = [
    {"status_name": "open", "is_terminal": False},
    {"status_name": "closed", "is_terminal": True},
    {"status_name": "archived", "is_terminal": True},
    {"status_name": "pending", "is_terminal": False},
    {"status_name": "under_investigation", "is_terminal": False},
]


async def _get_role(session: AsyncSession, role_name: str) -> Role:
    result = await session.execute(select(Role).where(Role.role_name == role_name))
    role = result.scalar_one_or_none()
    if not role:
        raise RuntimeError(f"Role not found: {role_name}")
    return role


async def _upsert_location(session: AsyncSession, name: str) -> Location:
    result = await session.execute(select(Location).where(Location.name == name))
    location = result.scalar_one_or_none()
    if location:
        return location
    location = Location(name=name)
    session.add(location)
    await session.flush()
    return location


async def _upsert_department(
    session: AsyncSession, name: str, location_id: int | None
) -> Department:
    result = await session.execute(select(Department).where(Department.name == name))
    department = result.scalar_one_or_none()
    if department:
        department.location_id = location_id
        department.deleted_at = None
        department.updated_at = datetime.now(tz=timezone.utc)
        session.add(department)
        await session.flush()
        return department
    department = Department(
        name=name,
        location_id=location_id,
        created_at=datetime.now(tz=timezone.utc),
    )
    session.add(department)
    await session.flush()
    return department


async def _upsert_person(
    session: AsyncSession,
    first_name: str,
    last_name: str,
    national_id: str,
    gender: GenderEnum | None = None,
) -> Person:
    result = await session.execute(select(Person).where(Person.national_id == national_id))
    person = result.scalar_one_or_none()
    if person:
        person.first_name = first_name
        person.last_name = last_name
        person.gender = gender
        person.deleted_at = None
        person.updated_at = datetime.now(tz=timezone.utc)
        session.add(person)
        await session.flush()
        return person
    person = Person(
        first_name=first_name,
        last_name=last_name,
        national_id=national_id,
        gender=gender,
        created_at=datetime.now(tz=timezone.utc),
    )
    session.add(person)
    await session.flush()
    return person


async def _upsert_officer(
    session: AsyncSession,
    person: Person,
    role: Role,
    department_id: int | None,
    rank: str | None,
    badge_number: str | None,
    password: str,
) -> Officer:
    result = await session.execute(select(Officer).where(Officer.person_id == person.person_id))
    officer = result.scalar_one_or_none()
    if officer:
        officer.role_id = role.role_id
        officer.department_id = department_id
        officer.rank = rank
        officer.badge_number = badge_number
        officer.password_hash = hash_password(password)
        officer.is_active = True
        officer.deleted_at = None
        officer.updated_at = datetime.now(tz=timezone.utc)
        session.add(officer)
        await session.flush()
        return officer
    officer = Officer(
        person_id=person.person_id,
        role_id=role.role_id,
        department_id=department_id,
        rank=rank,
        badge_number=badge_number,
        password_hash=hash_password(password),
        is_active=True,
        created_at=datetime.now(tz=timezone.utc),
    )
    session.add(officer)
    await session.flush()
    return officer


async def _get_case_status(session: AsyncSession, status_name: str) -> CaseStatus:
    result = await session.execute(
        select(CaseStatus).where(CaseStatus.status_name == status_name)
    )
    status = result.scalar_one_or_none()
    if not status:
        raise RuntimeError(f"case_status not found: {status_name}")
    return status


async def _upsert_crime_type(session: AsyncSession, name: str, severity: SeverityEnum | None = None) -> CrimeType:
    result = await session.execute(select(CrimeType).where(CrimeType.name == name))
    crime_type = result.scalar_one_or_none()
    if crime_type:
        crime_type.deleted_at = None
        crime_type.updated_at = datetime.now(tz=timezone.utc)
        session.add(crime_type)
        await session.flush()
        return crime_type
    crime_type = CrimeType(
        name=name,
        description=f"Seeded crime type: {name}",
        severity=severity or SeverityEnum.felony,
        created_at=datetime.now(tz=timezone.utc),
    )
    session.add(crime_type)
    await session.flush()
    return crime_type


async def _ensure_case_status(session: AsyncSession, status_name: str, is_terminal: bool = False) -> None:
    result = await session.execute(
        select(CaseStatus).where(CaseStatus.status_name == status_name)
    )
    existing = result.scalar_one_or_none()
    if existing:
        return
    session.add(
        CaseStatus(
            status_name=status_name,
            description=f"Case status: {status_name}",
            is_terminal=is_terminal,
            created_at=datetime.now(tz=timezone.utc),
        )
    )
    await session.flush()


async def _ensure_evidence_type(session: AsyncSession, name: str, description: str | None = None) -> EvidenceType:
    result = await session.execute(
        select(EvidenceType).where(EvidenceType.name == name)
    )
    existing = result.scalar_one_or_none()
    if existing:
        return existing
    evidence_type = EvidenceType(
        name=name,
        description=description or f"Evidence type: {name}",
        created_at=datetime.now(tz=timezone.utc),
    )
    session.add(evidence_type)
    await session.flush()
    return evidence_type


async def _upsert_case(
    session: AsyncSession,
    case_number: str,
    crime_type: CrimeType,
    status: CaseStatus,
    lead_officer: Officer,
    location: Location,
) -> Case:
    result = await session.execute(select(Case).where(Case.case_number == case_number))
    case = result.scalar_one_or_none()
    if case:
        case.crime_type_id = crime_type.crime_type_id
        case.status_id = status.status_id
        case.lead_officer_id = lead_officer.officer_id
        case.primary_location_id = location.location_id
        case.deleted_at = None
        case.updated_at = datetime.now(tz=timezone.utc)
        session.add(case)
        await session.flush()
        return case
    case = Case(
        case_number=case_number,
        title="Seeded Case",
        description="Initial seeded case for development",
        crime_type_id=crime_type.crime_type_id,
        status_id=status.status_id,
        severity=SeverityEnum.felony,
        primary_location_id=location.location_id,
        lead_officer_id=lead_officer.officer_id,
        opened_at=datetime.now(tz=timezone.utc),
        risk_level=RiskLevelEnum.high,
        created_at=datetime.now(tz=timezone.utc),
    )
    session.add(case)
    await session.flush()
    return case


async def _ensure_case_person(
    session: AsyncSession, case_id: int, person_id: int, role_type: str
) -> None:
    result = await session.execute(
        select(CasePerson).where(
            CasePerson.case_id == case_id,
            CasePerson.person_id == person_id,
            CasePerson.role_type == role_type,
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        return
    session.add(
        CasePerson(
            case_id=case_id,
            person_id=person_id,
            role_type=role_type,
            is_primary=role_type == "suspect",
            notes="Seeded participant",
            created_at=datetime.now(tz=timezone.utc),
        )
    )
    await session.flush()


async def _ensure_case_officer(
    session: AsyncSession, case_id: int, officer_id: int, role_in_case: RoleInCaseEnum
) -> None:
    result = await session.execute(
        select(CaseOfficer).where(
            CaseOfficer.case_id == case_id,
            CaseOfficer.officer_id == officer_id,
            CaseOfficer.role_in_case == role_in_case,
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        return
    session.add(
        CaseOfficer(
            case_id=case_id,
            officer_id=officer_id,
            role_in_case=role_in_case,
            assigned_at=datetime.now(tz=timezone.utc),
            active=True,
        )
    )
    await session.flush()


async def _ensure_charge(
    session: AsyncSession, case_id: int, person_id: int, crime_type_id: int
) -> None:
    result = await session.execute(
        select(Charge).where(
            Charge.case_id == case_id,
            Charge.person_id == person_id,
            Charge.charge_status == ChargeStatusEnum.filed,
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        return
    session.add(
        Charge(
            case_id=case_id,
            person_id=person_id,
            crime_type_id=crime_type_id,
            charge_status=ChargeStatusEnum.filed,
            description="Seeded charge",
            filed_at=datetime.now(tz=timezone.utc),
            verdict=VerdictEnum.pending,
            created_at=datetime.now(tz=timezone.utc),
        )
    )
    await session.flush()


async def _ensure_evidence(
    session: AsyncSession, case_id: int, officer_id: int, location_id: int, evidence_tag: str, name: str
) -> Evidence:
    result = await session.execute(select(Evidence).where(Evidence.evidence_tag == evidence_tag))
    existing = result.scalar_one_or_none()
    if existing:
        return existing
    new_evd = Evidence(
        case_id=case_id,
        evidence_tag=evidence_tag,
        name=name,
        description="Seeded evidence item",
        storage_location_id=location_id,
        collected_by_officer_id=officer_id,
        chain_of_custody_notes="Seeded by script",
        collected_at=datetime.now(tz=timezone.utc),
        created_at=datetime.now(tz=timezone.utc),
    )
    session.add(new_evd)
    await session.flush()
    return new_evd


async def _ensure_case_note(session: AsyncSession, case_id: int, officer_id: int) -> None:
    result = await session.execute(
        select(CaseNote).where(
            CaseNote.case_id == case_id,
            CaseNote.officer_id == officer_id,
            CaseNote.note_text == "Initial seeded case note",
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        return
    session.add(
        CaseNote(
            case_id=case_id,
            officer_id=officer_id,
            note_text="Initial seeded case note",
            is_internal=True,
            created_at=datetime.now(tz=timezone.utc),
        )
    )
    await session.flush()


async def _ensure_department_audit_log(
    session: AsyncSession, department_id: int, officer_id: int
) -> None:
    result = await session.execute(
        select(DepartmentAuditLog).where(
            DepartmentAuditLog.department_id == department_id,
            DepartmentAuditLog.event_type == "seed_department_head_assigned",
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        return
    session.add(
        DepartmentAuditLog(
            department_id=department_id,
            changed_by_officer_id=officer_id,
            event_type="seed_department_head_assigned",
            old_value=None,
            new_value={"department_head_officer_id": officer_id},
            created_at=datetime.now(tz=timezone.utc),
        )
    )
    await session.flush()


# --- New Seeding Helpers ---

async def _upsert_suspect(
    session: AsyncSession, person_id: int, criminal_record: str | None, risk_level: RiskLevelEnum | None
) -> Suspect:
    result = await session.execute(select(Suspect).where(Suspect.person_id == person_id))
    suspect = result.scalar_one_or_none()
    if suspect:
        suspect.criminal_record = criminal_record
        suspect.risk_level = risk_level
        suspect.deleted_at = None
        suspect.updated_at = datetime.now(tz=timezone.utc)
        session.add(suspect)
        await session.flush()
        return suspect
    suspect = Suspect(
        person_id=person_id,
        criminal_record=criminal_record,
        risk_level=risk_level,
        created_at=datetime.now(tz=timezone.utc),
    )
    session.add(suspect)
    await session.flush()
    return suspect


async def _upsert_victim(
    session: AsyncSession, person_id: int, notes: str | None
) -> Victim:
    result = await session.execute(select(Victim).where(Victim.person_id == person_id))
    victim = result.scalar_one_or_none()
    if victim:
        victim.notes = notes
        victim.deleted_at = None
        victim.updated_at = datetime.now(tz=timezone.utc)
        session.add(victim)
        await session.flush()
        return victim
    victim = Victim(
        person_id=person_id,
        notes=notes,
        created_at=datetime.now(tz=timezone.utc),
    )
    session.add(victim)
    await session.flush()
    return victim


async def _upsert_witness(
    session: AsyncSession, person_id: int, credibility_notes: str | None, is_protected: bool
) -> Witness:
    result = await session.execute(select(Witness).where(Witness.person_id == person_id))
    witness = result.scalar_one_or_none()
    if witness:
        witness.credibility_notes = credibility_notes
        witness.is_protected = is_protected
        witness.deleted_at = None
        witness.updated_at = datetime.now(tz=timezone.utc)
        session.add(witness)
        await session.flush()
        return witness
    witness = Witness(
        person_id=person_id,
        credibility_notes=credibility_notes,
        is_protected=is_protected,
        created_at=datetime.now(tz=timezone.utc),
    )
    session.add(witness)
    await session.flush()
    return witness


async def _ensure_case_suspect(
    session: AsyncSession, case_id: int, suspect_id: int, added_by: int, notes: str | None = None
) -> CaseSuspect:
    result = await session.execute(
        select(CaseSuspect).where(
            CaseSuspect.case_id == case_id,
            CaseSuspect.suspect_id == suspect_id,
        )
    )
    case_suspect = result.scalar_one_or_none()
    if case_suspect:
        case_suspect.deleted_at = None
        session.add(case_suspect)
        await session.flush()
        return case_suspect
    case_suspect = CaseSuspect(
        case_id=case_id,
        suspect_id=suspect_id,
        notes=notes,
        added_by=added_by,
        added_at=datetime.now(tz=timezone.utc),
    )
    session.add(case_suspect)
    await session.flush()
    return case_suspect


async def _ensure_case_victim(
    session: AsyncSession, case_id: int, victim_id: int, added_by: int, notes: str | None = None
) -> CaseVictim:
    result = await session.execute(
        select(CaseVictim).where(
            CaseVictim.case_id == case_id,
            CaseVictim.victim_id == victim_id,
        )
    )
    case_victim = result.scalar_one_or_none()
    if case_victim:
        case_victim.deleted_at = None
        session.add(case_victim)
        await session.flush()
        return case_victim
    case_victim = CaseVictim(
        case_id=case_id,
        victim_id=victim_id,
        notes=notes,
        added_by=added_by,
        added_at=datetime.now(tz=timezone.utc),
    )
    session.add(case_victim)
    await session.flush()
    return case_victim


async def _ensure_case_witness(
    session: AsyncSession, case_id: int, witness_id: int, added_by: int, notes: str | None = None
) -> CaseWitness:
    result = await session.execute(
        select(CaseWitness).where(
            CaseWitness.case_id == case_id,
            CaseWitness.witness_id == witness_id,
        )
    )
    case_witness = result.scalar_one_or_none()
    if case_witness:
        case_witness.deleted_at = None
        session.add(case_witness)
        await session.flush()
        return case_witness
    case_witness = CaseWitness(
        case_id=case_id,
        witness_id=witness_id,
        notes=notes,
        added_by=added_by,
        added_at=datetime.now(tz=timezone.utc),
    )
    session.add(case_witness)
    await session.flush()
    return case_witness


async def _upsert_arrest(
    session: AsyncSession,
    suspect_id: int,
    officer_id: int,
    case_id: int | None,
    booking_number: str | None,
    location_id: int | None,
    bail_amount: Decimal | None,
    bail_set_at: datetime | None,
    date: datetime,
    released_at: datetime | None,
    notes: str | None,
) -> Arrest:
    if booking_number:
        result = await session.execute(select(Arrest).where(Arrest.booking_number == booking_number))
        arrest = result.scalar_one_or_none()
        if arrest:
            arrest.suspect_id = suspect_id
            arrest.officer_id = officer_id
            arrest.case_id = case_id
            arrest.location_id = location_id
            arrest.bail_amount = bail_amount
            arrest.bail_set_at = bail_set_at
            arrest.date = date
            arrest.released_at = released_at
            arrest.notes = notes
            arrest.deleted_at = None
            arrest.updated_at = datetime.now(tz=timezone.utc)
            session.add(arrest)
            await session.flush()
            return arrest

    result = await session.execute(
        select(Arrest).where(
            Arrest.suspect_id == suspect_id,
            Arrest.case_id == case_id,
            Arrest.date == date,
        )
    )
    arrest = result.scalar_one_or_none()
    if arrest:
        arrest.booking_number = booking_number
        arrest.officer_id = officer_id
        arrest.location_id = location_id
        arrest.bail_amount = bail_amount
        arrest.bail_set_at = bail_set_at
        arrest.released_at = released_at
        arrest.notes = notes
        arrest.deleted_at = None
        arrest.updated_at = datetime.now(tz=timezone.utc)
        session.add(arrest)
        await session.flush()
        return arrest

    arrest = Arrest(
        suspect_id=suspect_id,
        officer_id=officer_id,
        case_id=case_id,
        booking_number=booking_number,
        location_id=location_id,
        bail_amount=bail_amount,
        bail_set_at=bail_set_at,
        date=date,
        released_at=released_at,
        notes=notes,
        created_at=datetime.now(tz=timezone.utc),
    )
    session.add(arrest)
    await session.flush()
    return arrest


async def _upsert_interrogation(
    session: AsyncSession,
    case_id: int,
    suspect_id: int,
    officer_id: int,
    location_id: int | None,
    notes: str | None,
    recording_url: str | None,
    date: datetime,
) -> Interrogation:
    result = await session.execute(
        select(Interrogation).where(
            Interrogation.case_id == case_id,
            Interrogation.suspect_id == suspect_id,
            Interrogation.date == date,
        )
    )
    interrogation = result.scalar_one_or_none()
    if interrogation:
        interrogation.officer_id = officer_id
        interrogation.location_id = location_id
        interrogation.notes = notes
        interrogation.recording_url = recording_url
        interrogation.deleted_at = None
        interrogation.updated_at = datetime.now(tz=timezone.utc)
        session.add(interrogation)
        await session.flush()
        return interrogation

    interrogation = Interrogation(
        case_id=case_id,
        suspect_id=suspect_id,
        officer_id=officer_id,
        location_id=location_id,
        notes=notes,
        recording_url=recording_url,
        date=date,
        created_at=datetime.now(tz=timezone.utc),
    )
    session.add(interrogation)
    await session.flush()
    return interrogation


async def _upsert_report(
    session: AsyncSession,
    case_id: int,
    officer_id: int,
    report_type: str,
    content: str,
) -> Report:
    result = await session.execute(
        select(Report).where(
            Report.case_id == case_id,
            Report.report_type == report_type,
        )
    )
    report = result.scalar_one_or_none()
    if report:
        report.officer_id = officer_id
        report.content = content
        report.deleted_at = None
        report.updated_at = datetime.now(tz=timezone.utc)
        session.add(report)
        await session.flush()
        return report

    report = Report(
        case_id=case_id,
        officer_id=officer_id,
        report_type=report_type,
        content=content,
        created_at=datetime.now(tz=timezone.utc),
    )
    session.add(report)
    await session.flush()
    return report


async def _upsert_vehicle(
    session: AsyncSession,
    evidence_id: int,
    plate_number: str | None,
    type: str | None,
    make: str | None,
    model: str | None,
    color: str | None,
    year: int | None,
    vin: str | None,
    description: str | None,
) -> Vehicle:
    result = await session.execute(select(Vehicle).where(Vehicle.evidence_id == evidence_id))
    vehicle = result.scalar_one_or_none()
    if vehicle:
        vehicle.plate_number = plate_number
        vehicle.type = type
        vehicle.make = make
        vehicle.model = model
        vehicle.color = color
        vehicle.year = year
        vehicle.vin = vin
        vehicle.description = description
        session.add(vehicle)
        await session.flush()
        return vehicle

    vehicle = Vehicle(
        evidence_id=evidence_id,
        plate_number=plate_number,
        type=type,
        make=make,
        model=model,
        color=color,
        year=year,
        vin=vin,
        description=description,
    )
    session.add(vehicle)
    await session.flush()
    return vehicle


async def _upsert_weapon(
    session: AsyncSession,
    evidence_id: int,
    type: str | None,
    make: str | None,
    serial_number: str | None,
    caliber: str | None,
    description: str | None,
) -> Weapon:
    result = await session.execute(select(Weapon).where(Weapon.evidence_id == evidence_id))
    weapon = result.scalar_one_or_none()
    if weapon:
        weapon.type = type
        weapon.make = make
        weapon.serial_number = serial_number
        weapon.caliber = caliber
        weapon.description = description
        session.add(weapon)
        await session.flush()
        return weapon

    weapon = Weapon(
        evidence_id=evidence_id,
        type=type,
        make=make,
        serial_number=serial_number,
        caliber=caliber,
        description=description,
    )
    session.add(weapon)
    await session.flush()
    return weapon


async def _upsert_forensic_report(
    session: AsyncSession,
    evidence_id: int,
    officer_id: int,
    findings: str,
    methodology: str | None,
    report_date: date,
    lab_reference: str | None,
) -> ForensicReport:
    result = await session.execute(
        select(ForensicReport).where(ForensicReport.evidence_id == evidence_id)
    )
    report = result.scalar_one_or_none()
    if report:
        report.officer_id = officer_id
        report.findings = findings
        report.methodology = methodology
        report.report_date = report_date
        report.lab_reference = lab_reference
        report.updated_at = datetime.now(tz=timezone.utc)
        session.add(report)
        await session.flush()
        return report

    report = ForensicReport(
        evidence_id=evidence_id,
        officer_id=officer_id,
        findings=findings,
        methodology=methodology,
        report_date=report_date,
        lab_reference=lab_reference,
        created_at=datetime.now(tz=timezone.utc),
    )
    session.add(report)
    await session.flush()
    return report


async def _upsert_crime_scene_photo(
    session: AsyncSession,
    case_id: int,
    evidence_id: int | None,
    image_url: str,
    description: str | None,
    captured_at: datetime | None,
    captured_by: int,
) -> CrimeScenePhoto:
    result = await session.execute(
        select(CrimeScenePhoto).where(
            CrimeScenePhoto.case_id == case_id,
            CrimeScenePhoto.image_url == image_url,
        )
    )
    photo = result.scalar_one_or_none()
    if photo:
        photo.evidence_id = evidence_id
        photo.description = description
        photo.captured_at = captured_at
        photo.captured_by = captured_by
        photo.deleted_at = None
        session.add(photo)
        await session.flush()
        return photo

    photo = CrimeScenePhoto(
        case_id=case_id,
        evidence_id=evidence_id,
        image_url=image_url,
        description=description,
        captured_at=captured_at,
        captured_by=captured_by,
        created_at=datetime.now(tz=timezone.utc),
    )
    session.add(photo)
    await session.flush()
    return photo


async def _upsert_case_update(
    session: AsyncSession,
    case_id: int,
    officer_id: int,
    update_type: str,
    description: str,
) -> CaseUpdate:
    result = await session.execute(
        select(CaseUpdate).where(
            CaseUpdate.case_id == case_id,
            CaseUpdate.description == description,
        )
    )
    update = result.scalar_one_or_none()
    if update:
        update.officer_id = officer_id
        update.update_type = update_type
        session.add(update)
        await session.flush()
        return update

    update = CaseUpdate(
        case_id=case_id,
        officer_id=officer_id,
        update_type=update_type,
        description=description,
        created_at=datetime.now(tz=timezone.utc),
    )
    session.add(update)
    await session.flush()
    return update


async def _upsert_case_permission(
    session: AsyncSession,
    case_id: int,
    officer_id: int,
    access_level: AccessLevelEnum,
    can_read: bool,
    can_write: bool,
    can_admin: bool,
    granted_by: int,
) -> CasePermission:
    result = await session.execute(
        select(CasePermission).where(
            CasePermission.case_id == case_id,
            CasePermission.officer_id == officer_id,
        )
    )
    permission = result.scalar_one_or_none()
    if permission:
        permission.access_level = access_level
        permission.can_read = can_read
        permission.can_write = can_write
        permission.can_admin = can_admin
        permission.granted_by = granted_by
        permission.revoked_at = None
        permission.revoked_by = None
        session.add(permission)
        await session.flush()
        return permission

    permission = CasePermission(
        case_id=case_id,
        officer_id=officer_id,
        access_level=access_level,
        can_read=can_read,
        can_write=can_write,
        can_admin=can_admin,
        granted_by=granted_by,
        granted_at=datetime.now(tz=timezone.utc),
    )
    session.add(permission)
    await session.flush()
    return permission


async def _ensure_case_permission_audit(
    session: AsyncSession,
    permission_id: int,
    case_id: int,
    officer_id: int,
    action: str,
    old_access_level: AccessLevelEnum | None,
    new_access_level: AccessLevelEnum | None,
    performed_by: int,
) -> CasePermissionAudit:
    result = await session.execute(
        select(CasePermissionAudit).where(
            CasePermissionAudit.permission_id == permission_id,
            CasePermissionAudit.action == action,
            CasePermissionAudit.performed_by == performed_by,
        )
    )
    audit = result.scalar_one_or_none()
    if audit:
        return audit

    audit = CasePermissionAudit(
        permission_id=permission_id,
        case_id=case_id,
        officer_id=officer_id,
        action=action,
        old_access_level=old_access_level,
        new_access_level=new_access_level,
        performed_by=performed_by,
        performed_at=datetime.now(tz=timezone.utc),
    )
    session.add(audit)
    await session.flush()
    return audit


async def _ensure_evidence_history(
    session: AsyncSession,
    evidence_id: int,
    changed_by: int,
    field_name: str,
    old_value: str | None,
    new_value: str | None,
) -> EvidenceHistory:
    result = await session.execute(
        select(EvidenceHistory).where(
            EvidenceHistory.evidence_id == evidence_id,
            EvidenceHistory.field_name == field_name,
            EvidenceHistory.new_value == new_value,
        )
    )
    history = result.scalar_one_or_none()
    if history:
        return history

    history = EvidenceHistory(
        evidence_id=evidence_id,
        changed_by=changed_by,
        field_name=field_name,
        old_value=old_value,
        new_value=new_value,
        changed_at=datetime.now(tz=timezone.utc),
    )
    session.add(history)
    await session.flush()
    return history


async def _ensure_chain_of_custody(
    session: AsyncSession,
    evidence_id: int,
    officer_id: int,
    action: str,
    transferred_to: int | None,
    location_id: int | None,
    notes: str | None,
) -> ChainOfCustody:
    result = await session.execute(
        select(ChainOfCustody).where(
            ChainOfCustody.evidence_id == evidence_id,
            ChainOfCustody.officer_id == officer_id,
            ChainOfCustody.action == action,
            ChainOfCustody.notes == notes,
        )
    )
    chain = result.scalar_one_or_none()
    if chain:
        return chain

    chain = ChainOfCustody(
        evidence_id=evidence_id,
        officer_id=officer_id,
        action=action,
        transferred_to=transferred_to,
        location_id=location_id,
        notes=notes,
        created_at=datetime.now(tz=timezone.utc),
    )
    session.add(chain)
    await session.flush()
    return chain


async def _upsert_court_case(
    session: AsyncSession,
    case_id: int,
    court_name: str,
    court_reference: str | None,
    judge_name: str | None,
    prosecutor_name: str | None,
    hearing_date: date | None,
    verdict: VerdictEnum | None,
    verdict_notes: str | None,
) -> CourtCase:
    result = await session.execute(select(CourtCase).where(CourtCase.case_id == case_id))
    court_case = result.scalar_one_or_none()
    if court_case:
        court_case.court_name = court_name
        court_case.court_reference = court_reference
        court_case.judge_name = judge_name
        court_case.prosecutor_name = prosecutor_name
        court_case.hearing_date = hearing_date
        court_case.verdict = verdict
        court_case.verdict_notes = verdict_notes
        court_case.deleted_at = None
        court_case.updated_at = datetime.now(tz=timezone.utc)
        session.add(court_case)
        await session.flush()
        return court_case

    court_case = CourtCase(
        case_id=case_id,
        court_name=court_name,
        court_reference=court_reference,
        judge_name=judge_name,
        prosecutor_name=prosecutor_name,
        hearing_date=hearing_date,
        verdict=verdict,
        verdict_notes=verdict_notes,
        created_at=datetime.now(tz=timezone.utc),
    )
    session.add(court_case)
    await session.flush()
    return court_case


async def _upsert_sentence(
    session: AsyncSession,
    charge_id: int,
    court_case_id: int,
    description: str,
    duration: str | None,
    duration_days: int | None,
    start_date: date | None,
    end_date: date | None,
    sentence_type: str | None,
    is_suspended: bool,
    sentenced_at: datetime,
) -> Sentence:
    result = await session.execute(select(Sentence).where(Sentence.charge_id == charge_id))
    sentence = result.scalar_one_or_none()
    if sentence:
        sentence.court_case_id = court_case_id
        sentence.description = description
        sentence.duration = duration
        sentence.duration_days = duration_days
        sentence.start_date = start_date
        sentence.end_date = end_date
        sentence.sentence_type = sentence_type
        sentence.is_suspended = is_suspended
        sentence.sentenced_at = sentenced_at
        sentence.deleted_at = None
        sentence.updated_at = datetime.now(tz=timezone.utc)
        session.add(sentence)
        await session.flush()
        return sentence

    sentence = Sentence(
        charge_id=charge_id,
        court_case_id=court_case_id,
        description=description,
        duration=duration,
        duration_days=duration_days,
        start_date=start_date,
        end_date=end_date,
        sentence_type=sentence_type,
        is_suspended=is_suspended,
        sentenced_at=sentenced_at,
        created_at=datetime.now(tz=timezone.utc),
    )
    session.add(sentence)
    await session.flush()
    return sentence


async def seed() -> None:
    async with async_session_factory() as session:
        try:
            # Seed Locations
            hq_location = await _upsert_location(session, "Central HQ")
            downtown_location = await _upsert_location(session, "Downtown District")
            airport_location = await _upsert_location(session, "Airport Terminal")
            harbor_location = await _upsert_location(session, "Port Harbor")

            # Seed Departments
            homicide_department = await _upsert_department(
                session, "Homicide", hq_location.location_id
            )
            cybercrime_department = await _upsert_department(session, "Cyber", hq_location.location_id)
            robbery_department = await _upsert_department(session, "Robbery", downtown_location.location_id)
            
            # Seed Case Statuses
            for case_status_seed in CASE_STATUS_SEEDS:
                await _ensure_case_status(session, case_status_seed["status_name"], case_status_seed["is_terminal"])

            officers: dict[str, Officer] = {}
            for seed_info in OFFICER_SEEDS:
                role = await _get_role(session, seed_info["role_name"])
                department_id = None
                if seed_info["department"] == "Homicide":
                    department_id = homicide_department.department_id
                person = await _upsert_person(
                    session,
                    first_name=seed_info["first_name"],
                    last_name=seed_info["last_name"],
                    national_id=seed_info["national_id"],
                    gender=GenderEnum.undisclosed,
                )
                officer = await _upsert_officer(
                    session,
                    person=person,
                    role=role,
                    department_id=department_id,
                    rank=seed_info["rank"],
                    badge_number=seed_info["badge_number"],
                    password=seed_info["password"],
                )
                officers[seed_info["role_name"]] = officer

            homicide_department.department_head_officer_id = officers[
                "department_head"
            ].officer_id
            homicide_department.updated_at = datetime.now(tz=timezone.utc)
            session.add(homicide_department)
            await session.flush()

            await _ensure_department_audit_log(
                session, homicide_department.department_id, officers["superadmin"].officer_id
            )

            civilians: dict[str, Person] = {}
            for seed_info in CIVILIAN_SEEDS:
                civilian = await _upsert_person(
                    session,
                    first_name=seed_info["first_name"],
                    last_name=seed_info["last_name"],
                    national_id=seed_info["national_id"],
                    gender=seed_info["gender"],
                )
                civilians[seed_info["national_id"]] = civilian

            status_open = await _get_case_status(session, "open")
            
            # Seed Crime Types
            crime_types: dict[str, CrimeType] = {}
            for crime_type_seed in CRIME_TYPES_SEEDS:
                ct = await _upsert_crime_type(session, crime_type_seed["name"], crime_type_seed["severity"])
                crime_types[crime_type_seed["name"]] = ct
            
            # Seed Evidence Types
            evidence_types: dict[str, EvidenceType] = {}
            for evidence_type_seed in EVIDENCE_TYPES_SEEDS:
                et = await _ensure_evidence_type(session, evidence_type_seed["name"], evidence_type_seed["description"])
                evidence_types[evidence_type_seed["name"]] = et
            
            crime_type = crime_types["Homicide"]

            case = await _upsert_case(
                session,
                case_number="CASE-2026-0001",
                crime_type=crime_type,
                status=status_open,
                lead_officer=officers["investigator"],
                location=downtown_location,
            )

            await _ensure_case_person(
                session, case.case_id, civilians["CIV-0001"].person_id, "suspect"
            )
            await _ensure_case_person(
                session, case.case_id, civilians["CIV-0002"].person_id, "victim"
            )
            await _ensure_case_person(
                session, case.case_id, civilians["CIV-0003"].person_id, "witness"
            )

            await _ensure_case_officer(
                session,
                case.case_id,
                officers["investigator"].officer_id,
                RoleInCaseEnum.lead_investigator,
            )
            await _ensure_case_officer(
                session,
                case.case_id,
                officers["department_head"].officer_id,
                RoleInCaseEnum.supervisor,
            )

            await _ensure_charge(
                session,
                case.case_id,
                civilians["CIV-0001"].person_id,
                crime_type.crime_type_id,
            )

            evd_knife = await _ensure_evidence(
                session,
                case.case_id,
                officers["investigator"].officer_id,
                hq_location.location_id,
                "EVD-0001",
                "Knife",
            )

            await _ensure_case_note(
                session,
                case.case_id,
                officers["investigator"].officer_id,
            )

            # Seed additional cases with different statuses
            status_pending = await _get_case_status(session, "pending")
            case_2 = await _upsert_case(
                session,
                case_number="CASE-2026-0002",
                crime_type=crime_types["Robbery"],
                status=status_pending,
                lead_officer=officers["admin"],
                location=downtown_location,
            )
            
            await _ensure_case_person(
                session, case_2.case_id, civilians["CIV-0004"].person_id, "suspect"
            )
            await _ensure_case_person(
                session, case_2.case_id, civilians["CIV-0005"].person_id, "victim"
            )
            
            await _ensure_case_officer(
                session,
                case_2.case_id,
                officers["admin"].officer_id,
                RoleInCaseEnum.lead_investigator,
            )
            
            # Add additional evidence
            evd_cash = await _ensure_evidence(
                session,
                case_2.case_id,
                officers["admin"].officer_id,
                hq_location.location_id,
                "EVD-0002",
                "Stolen Cash",
            )

            # --- Seed remaining tables ---

            # Seed Suspects, Victims, Witnesses
            suspect_alex = await _upsert_suspect(
                session, civilians["CIV-0001"].person_id, "Prior assault charge in 2024", RiskLevelEnum.medium
            )
            suspect_hiwot = await _upsert_suspect(
                session, civilians["CIV-0004"].person_id, "None", RiskLevelEnum.low
            )
            victim_ruth = await _upsert_victim(
                session, civilians["CIV-0002"].person_id, "Suffered non-life threatening injuries"
            )
            victim_tariku = await _upsert_victim(
                session, civilians["CIV-0005"].person_id, "Reported stolen cash of $5000"
            )
            witness_noah = await _upsert_witness(
                session, civilians["CIV-0003"].person_id, "Highly credible, witnessed the suspect fleeing the scene", True
            )

            # Link Suspects/Victims/Witnesses to Cases
            await _ensure_case_suspect(
                session, case.case_id, suspect_alex.suspect_id, officers["investigator"].officer_id, "Primary suspect"
            )
            await _ensure_case_victim(
                session, case.case_id, victim_ruth.victim_id, officers["investigator"].officer_id, "Primary victim"
            )
            await _ensure_case_witness(
                session, case.case_id, witness_noah.witness_id, officers["investigator"].officer_id, "Eyewitness near alleyway"
            )

            await _ensure_case_suspect(
                session, case_2.case_id, suspect_hiwot.suspect_id, officers["admin"].officer_id, "Suspected of fleeing with cash"
            )
            await _ensure_case_victim(
                session, case_2.case_id, victim_tariku.victim_id, officers["admin"].officer_id, "Owner of stolen cash"
            )

            # Seed Arrest
            await _upsert_arrest(
                session,
                suspect_id=suspect_alex.suspect_id,
                officer_id=officers["investigator"].officer_id,
                case_id=case.case_id,
                booking_number="BKG-2026-0001",
                location_id=downtown_location.location_id,
                bail_amount=Decimal("50000.00"),
                bail_set_at=datetime.now(tz=timezone.utc),
                date=datetime.now(tz=timezone.utc),
                released_at=None,
                notes="Arrested without incident at his residence.",
            )

            # Seed Interrogation
            await _upsert_interrogation(
                session,
                case_id=case.case_id,
                suspect_id=suspect_alex.suspect_id,
                officer_id=officers["investigator"].officer_id,
                location_id=hq_location.location_id,
                notes="Suspect denied any involvement but was visibly nervous.",
                recording_url="http://storage.ccms.local/recordings/int-0001.mp3",
                date=datetime.now(tz=timezone.utc),
            )

            # Seed Report
            await _upsert_report(
                session,
                case_id=case.case_id,
                officer_id=officers["investigator"].officer_id,
                report_type="Incident Report",
                content="Full incident report detailing the homicide crime scene and initial findings.",
            )

            # Seed Weapon
            await _upsert_weapon(
                session,
                evidence_id=evd_knife.evidence_id,
                type="Knife",
                make="Kitchen Knife",
                serial_number="WPN-KNIFE-998",
                caliber="N/A",
                description="10-inch chef knife with black handle",
            )

            # Seed Forensic Report
            await _upsert_forensic_report(
                session,
                evidence_id=evd_knife.evidence_id,
                officer_id=officers["investigator"].officer_id,
                findings="Fingerprints matching Alex Smith found on the hilt.",
                methodology="Latent fingerprint dusting and cyanoacrylate fuming.",
                report_date=datetime.now(tz=timezone.utc).date(),
                lab_reference="LAB-2026-887",
            )

            # Seed Getaway Vehicle Evidence
            evd_car = await _ensure_evidence(
                session,
                case_2.case_id,
                officers["admin"].officer_id,
                hq_location.location_id,
                "EVD-0003",
                "Getaway Car",
            )

            # Seed Vehicle
            await _upsert_vehicle(
                session,
                evidence_id=evd_car.evidence_id,
                plate_number="AA-123-BC",
                type="Sedan",
                make="Toyota",
                model="Corolla",
                color="Red",
                year=2018,
                vin="1NXBR32E9HZ123456",
                description="Vehicle matches description given by witnesses.",
            )

            # Seed Crime Scene Photo
            await _upsert_crime_scene_photo(
                session,
                case_id=case.case_id,
                evidence_id=evd_knife.evidence_id,
                image_url="http://storage.ccms.local/photos/scene-0001.jpg",
                description="Photo of the kitchen knife recovered near the body",
                captured_at=datetime.now(tz=timezone.utc),
                captured_by=officers["investigator"].officer_id,
            )

            # Seed Case Update
            await _upsert_case_update(
                session,
                case_id=case.case_id,
                officer_id=officers["investigator"].officer_id,
                update_type="Investigation Status Change",
                description="Suspect was arrested and booked; case moved to under investigation.",
            )

            # Seed Case Permission and Case Permission Audit
            permission = await _upsert_case_permission(
                session,
                case_id=case.case_id,
                officer_id=officers["admin"].officer_id,
                access_level=AccessLevelEnum.write,
                can_read=True,
                can_write=True,
                can_admin=False,
                granted_by=officers["superadmin"].officer_id,
            )
            await _ensure_case_permission_audit(
                session,
                permission_id=permission.permission_id,
                case_id=case.case_id,
                officer_id=officers["admin"].officer_id,
                action="grant",
                old_access_level=None,
                new_access_level=AccessLevelEnum.write,
                performed_by=officers["superadmin"].officer_id,
            )

            # Seed Evidence History
            await _ensure_evidence_history(
                session,
                evidence_id=evd_knife.evidence_id,
                changed_by=officers["investigator"].officer_id,
                field_name="storage_location_id",
                old_value=None,
                new_value=str(hq_location.location_id),
            )

            # Seed Chain Of Custody
            await _ensure_chain_of_custody(
                session,
                evidence_id=evd_knife.evidence_id,
                officer_id=officers["investigator"].officer_id,
                action="Collected",
                transferred_to=None,
                location_id=downtown_location.location_id,
                notes="Collected at the crime scene.",
            )
            await _ensure_chain_of_custody(
                session,
                evidence_id=evd_knife.evidence_id,
                officer_id=officers["investigator"].officer_id,
                action="Transfer",
                transferred_to=officers["admin"].officer_id,
                location_id=hq_location.location_id,
                notes="Transferred to evidence locker for safekeeping.",
            )

            # Seed Court Case and Sentence
            court_case = await _upsert_court_case(
                session,
                case_id=case.case_id,
                court_name="Federal High Court, Criminal Division",
                court_reference="FHC-2026-CR-009",
                judge_name="Judge Almaz Abebe",
                prosecutor_name="Prosecutor Daniel Yohannes",
                hearing_date=datetime.now(tz=timezone.utc).date(),
                verdict=VerdictEnum.guilty,
                verdict_notes="Guilty beyond a reasonable doubt based on forensic fingerprint evidence.",
            )

            # Fetch the seeded Charge for CIV-0001 (Alex Smith) and update it
            result_charge = await session.execute(
                select(Charge).where(
                    Charge.case_id == case.case_id,
                    Charge.person_id == civilians["CIV-0001"].person_id,
                )
            )
            charge = result_charge.scalar_one()
            charge.court_case_id = court_case.court_case_id
            charge.verdict = VerdictEnum.guilty
            charge.sentence_summary = "15 years imprisonment"
            session.add(charge)
            await session.flush()

            await _upsert_sentence(
                session,
                charge_id=charge.charge_id,
                court_case_id=court_case.court_case_id,
                description="15 years of rigorous imprisonment at Central Prison.",
                duration="15 Years",
                duration_days=5475,
                start_date=datetime.now(tz=timezone.utc).date(),
                end_date=None,
                sentence_type="Imprisonment",
                is_suspended=False,
                sentenced_at=datetime.now(tz=timezone.utc),
            )

            await session.commit()

        except Exception:
            await session.rollback()
            raise

    print("\n=== Seed completed successfully ===")
    print("\nLogin credentials:")
    for seed_info in OFFICER_SEEDS:
        print(
            f"  Role: {seed_info['role_name']}, National ID: {seed_info['national_id']}, "
            f"Password: {seed_info['password']}"
        )
    print("\nSeeded data overview:")
    print(f"  Locations: 4")
    print(f"  Departments: 3")
    print(f"  Crime Types: {len(CRIME_TYPES_SEEDS)}")
    print(f"  Evidence Types: {len(EVIDENCE_TYPES_SEEDS)}")
    print(f"  Case Statuses: {len(CASE_STATUS_SEEDS)}")
    print(f"  Cases: 2")
    print(f"  Officers: {len(OFFICER_SEEDS)}")
    print(f"  Civilians: {len(CIVILIAN_SEEDS)}")


if __name__ == "__main__":
    asyncio.run(seed())
