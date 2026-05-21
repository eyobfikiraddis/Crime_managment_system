from __future__ import annotations

import asyncio
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import async_session_factory
from app.core.security import hash_password
from app.modules.auth.models import Department, Location, Officer, Person, Role
from app.modules.case_management.models import (
    Case,
    CaseNote,
    CaseOfficer,
    CasePerson,
    CaseStatus,
    Charge,
    CrimeType,
    Evidence,
    EvidenceType,
)
from app.modules.personnel.models import DepartmentAuditLog
from app.shared.enums import (
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
        title="Seeded Homicide Case",
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
    session: AsyncSession, case_id: int, officer_id: int, location_id: int
) -> None:
    result = await session.execute(select(Evidence).where(Evidence.evidence_tag == "EVD-0001"))
    existing = result.scalar_one_or_none()
    if existing:
        return
    session.add(
        Evidence(
            case_id=case_id,
            evidence_tag="EVD-0001",
            name="Knife",
            description="Seeded evidence item",
            storage_location_id=location_id,
            collected_by_officer_id=officer_id,
            chain_of_custody_notes="Seeded by script",
            collected_at=datetime.now(tz=timezone.utc),
            created_at=datetime.now(tz=timezone.utc),
        )
    )
    await session.flush()


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
            for seed in OFFICER_SEEDS:
                role = await _get_role(session, seed["role_name"])
                department_id = None
                if seed["department"] == "Homicide":
                    department_id = homicide_department.department_id
                person = await _upsert_person(
                    session,
                    first_name=seed["first_name"],
                    last_name=seed["last_name"],
                    national_id=seed["national_id"],
                    gender=GenderEnum.undisclosed,
                )
                officer = await _upsert_officer(
                    session,
                    person=person,
                    role=role,
                    department_id=department_id,
                    rank=seed["rank"],
                    badge_number=seed["badge_number"],
                    password=seed["password"],
                )
                officers[seed["role_name"]] = officer

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
            for seed in CIVILIAN_SEEDS:
                civilian = await _upsert_person(
                    session,
                    first_name=seed["first_name"],
                    last_name=seed["last_name"],
                    national_id=seed["national_id"],
                    gender=seed["gender"],
                )
                civilians[seed["national_id"]] = civilian

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

            await _ensure_evidence(
                session,
                case.case_id,
                officers["investigator"].officer_id,
                hq_location.location_id,
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
            session.add(
                Evidence(
                    case_id=case_2.case_id,
                    evidence_tag="EVD-0002",
                    name="Stolen Cash",
                    description="$5000 stolen from the robbery",
                    storage_location_id=hq_location.location_id,
                    collected_by_officer_id=officers["admin"].officer_id,
                    chain_of_custody_notes="Collected at scene",
                    collected_at=datetime.now(tz=timezone.utc),
                    created_at=datetime.now(tz=timezone.utc),
                )
            )
            await session.flush()

            await session.commit()

        except Exception:
            await session.rollback()
            raise

    print("\n=== Seed completed successfully ===")
    print("\nLogin credentials:")
    for seed in OFFICER_SEEDS:
        print(
            f"  Role: {seed['role_name']}, National ID: {seed['national_id']}, "
            f"Password: {seed['password']}"
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
