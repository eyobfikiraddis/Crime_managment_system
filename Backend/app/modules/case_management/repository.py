from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.auth.models import Officer
from app.modules.auth.schemas.responses import CurrentOfficerContext
from app.modules.case_management.models import Case, CaseOfficer, CasePermission, CaseUpdate, CaseSuspect, CaseVictim, CaseWitness, Charge, Arrest, Evidence, CaseNote, ChainOfCustody
from app.shared.enums import RoleNameEnum


class CaseRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_id(self, case_id: int) -> Case | None:
        result = await self.session.execute(
            select(Case)
            .options(
                selectinload(Case.status),
                selectinload(Case.crime_type),
                selectinload(Case.lead_officer).selectinload(Officer.person),
                selectinload(Case.case_officers)
                .selectinload(CaseOfficer.officer)
                .selectinload(Officer.person),
            )
            .where(Case.case_id == case_id, Case.deleted_at.is_(None))
        )
        return result.scalar_one_or_none()

    async def list_visible_cases(
        self,
        officer: CurrentOfficerContext,
        page: int,
        size: int,
    ) -> tuple[list[Case], int]:
        offset = (page - 1) * size
        if officer.role_name in (RoleNameEnum.admin.value, RoleNameEnum.superadmin.value):
            count_q = select(func.count()).select_from(Case).where(Case.deleted_at.is_(None))
            total = int((await self.session.execute(count_q)).scalar_one() or 0)
            stmt = (
                select(Case)
                .options(
                    selectinload(Case.status),
                    selectinload(Case.crime_type),
                )
                .where(Case.deleted_at.is_(None))
                .order_by(Case.opened_at.desc().nullslast(), Case.case_id.desc())
                .offset(offset)
                .limit(size)
            )
            rows = await self.session.scalars(stmt)
            return list(rows.all()), total

        perm_cases = select(CasePermission.case_id).where(
            CasePermission.officer_id == officer.officer_id,
            CasePermission.revoked_at.is_(None),
        )
        assign_cases = select(CaseOfficer.case_id).where(
            CaseOfficer.officer_id == officer.officer_id,
            CaseOfficer.active.is_(True),
        )
        cond = or_(
            Case.lead_officer_id == officer.officer_id,
            Case.case_id.in_(perm_cases),
            Case.case_id.in_(assign_cases),
        )
        if officer.role_name == RoleNameEnum.department_head.value and officer.department_id:
            dept_officer_ids = select(Officer.officer_id).where(
                Officer.department_id == officer.department_id,
                Officer.deleted_at.is_(None),
            )
            cond = or_(cond, Case.lead_officer_id.in_(dept_officer_ids))

        count_q = (
            select(func.count()).select_from(Case).where(Case.deleted_at.is_(None), cond)
        )
        total = int((await self.session.execute(count_q)).scalar_one() or 0)
        stmt = (
            select(Case)
            .options(selectinload(Case.status), selectinload(Case.crime_type))
            .where(Case.deleted_at.is_(None), cond)
            .order_by(Case.opened_at.desc().nullslast(), Case.case_id.desc())
            .offset(offset)
            .limit(size)
        )
        rows = await self.session.scalars(stmt)
        return list(rows.all()), total

    async def create(
        self,
        case_number: str,
        title: str,
        description: str | None,
        crime_type_id: int,
        status_id: int,
        lead_officer_id: int | None,
        opened_at: datetime | None,
    ) -> Case:
        now = datetime.now(tz=timezone.utc)
        row = Case(
            case_number=case_number,
            title=title,
            description=description,
            crime_type_id=crime_type_id,
            status_id=status_id,
            lead_officer_id=lead_officer_id,
            opened_at=opened_at or now,
            created_at=now,
        )
        self.session.add(row)
        await self.session.flush()
        await self.session.refresh(row)
        return row

    async def case_number_exists(self, case_number: str) -> bool:
        r = await self.session.execute(
            select(func.count())
            .select_from(Case)
            .where(Case.case_number == case_number, Case.deleted_at.is_(None))
        )
        return int(r.scalar_one() or 0) > 0

    async def update_case(
        self, case_id: int, data: dict, updated_by: int
    ) -> Case | None:
        case = await self.session.get(Case, case_id)
        if not case or case.deleted_at is not None:
            return None
        for key, value in data.items():
            if hasattr(case, key):
                setattr(case, key, value)
        case.updated_at = datetime.now(tz=timezone.utc)
        case.updated_by = updated_by
        await self.session.flush()
        await self.session.refresh(case)
        return case

    async def update_case_status(
        self, case_id: int, new_status_id: int, updated_by: int, description: str
    ) -> Case | None:
        case = await self.session.get(Case, case_id)
        if not case or case.deleted_at is not None:
            return None
        case.status_id = new_status_id
        case.updated_at = datetime.now(tz=timezone.utc)
        case.updated_by = updated_by
        
        update_row = CaseUpdate(
            case_id=case_id,
            officer_id=updated_by,
            update_type="status_change",
            description=description,
            created_at=datetime.now(tz=timezone.utc)
        )
        self.session.add(update_row)
        await self.session.flush()
        await self.session.refresh(case)
        return case

    async def soft_delete_case(self, case_id: int, deleted_by: int) -> bool:
        case = await self.session.get(Case, case_id)
        if not case or case.deleted_at is not None:
            return False
        case.deleted_at = datetime.now(tz=timezone.utc)
        case.updated_at = datetime.now(tz=timezone.utc)
        case.updated_by = deleted_by
        await self.session.flush()
        return True

    async def assign_officer(self, case_id: int, officer_id: int, role: str, assigned_by: int) -> CaseOfficer:
        row = CaseOfficer(
            case_id=case_id,
            officer_id=officer_id,
            role_in_case=role,
            assigned_by=assigned_by,
            assigned_at=datetime.now(tz=timezone.utc),
            active=True
        )
        self.session.add(row)
        await self.session.flush()
        await self.session.refresh(row)
        return row

    async def list_assignments(self, case_id: int) -> list[CaseOfficer]:
        from sqlalchemy.orm import selectinload
        r = await self.session.execute(
            select(CaseOfficer)
            .options(selectinload(CaseOfficer.officer).selectinload(Officer.person))
            .where(CaseOfficer.case_id == case_id)
            .order_by(CaseOfficer.assigned_at.desc())
        )
        return list(r.scalars().all())

    async def remove_assignment(self, case_id: int, officer_id: int) -> bool:
        r = await self.session.execute(
            select(CaseOfficer)
            .where(
                CaseOfficer.case_id == case_id,
                CaseOfficer.officer_id == officer_id,
                CaseOfficer.active.is_(True)
            )
        )
        assignment = r.scalars().first()
        if not assignment:
            return False
        assignment.active = False
        assignment.removed_at = datetime.now(tz=timezone.utc)
        assignment.unassigned_at = datetime.now(tz=timezone.utc)
        await self.session.flush()
        return True

    # --- Suspects ---
    async def add_case_suspect(self, case_id: int, suspect_id: int, notes: str | None, added_by: int) -> CaseSuspect:
        row = CaseSuspect(
            case_id=case_id,
            suspect_id=suspect_id,
            notes=notes,
            added_at=datetime.now(tz=timezone.utc),
            added_by=added_by
        )
        self.session.add(row)
        await self.session.flush()
        await self.session.refresh(row)
        return row

    async def list_case_suspects(self, case_id: int) -> list[CaseSuspect]:
        from sqlalchemy.orm import selectinload
        from app.modules.personnel.models import Suspect
        r = await self.session.execute(
            select(CaseSuspect)
            .options(selectinload(CaseSuspect.suspect).selectinload(Suspect.person))
            .where(CaseSuspect.case_id == case_id, CaseSuspect.deleted_at.is_(None))
        )
        return list(r.scalars().all())

    async def remove_case_suspect(self, case_id: int, suspect_id: int) -> bool:
        r = await self.session.execute(
            select(CaseSuspect)
            .where(
                CaseSuspect.case_id == case_id,
                CaseSuspect.suspect_id == suspect_id,
                CaseSuspect.deleted_at.is_(None)
            )
        )
        row = r.scalars().first()
        if not row:
            return False
        row.deleted_at = datetime.now(tz=timezone.utc)
        await self.session.flush()
        return True

    # --- Victims ---
    async def add_case_victim(self, case_id: int, victim_id: int, notes: str | None, added_by: int) -> CaseVictim:
        row = CaseVictim(
            case_id=case_id,
            victim_id=victim_id,
            notes=notes,
            added_at=datetime.now(tz=timezone.utc),
            added_by=added_by
        )
        self.session.add(row)
        await self.session.flush()
        await self.session.refresh(row)
        return row

    async def list_case_victims(self, case_id: int) -> list[CaseVictim]:
        from sqlalchemy.orm import selectinload
        from app.modules.personnel.models import Victim
        r = await self.session.execute(
            select(CaseVictim)
            .options(selectinload(CaseVictim.victim).selectinload(Victim.person))
            .where(CaseVictim.case_id == case_id, CaseVictim.deleted_at.is_(None))
        )
        return list(r.scalars().all())

    async def remove_case_victim(self, case_id: int, victim_id: int) -> bool:
        r = await self.session.execute(
            select(CaseVictim)
            .where(
                CaseVictim.case_id == case_id,
                CaseVictim.victim_id == victim_id,
                CaseVictim.deleted_at.is_(None)
            )
        )
        row = r.scalars().first()
        if not row:
            return False
        row.deleted_at = datetime.now(tz=timezone.utc)
        await self.session.flush()
        return True

    # --- Witnesses ---
    async def add_case_witness(self, case_id: int, witness_id: int, notes: str | None, added_by: int) -> CaseWitness:
        row = CaseWitness(
            case_id=case_id,
            witness_id=witness_id,
            notes=notes,
            added_at=datetime.now(tz=timezone.utc),
            added_by=added_by
        )
        self.session.add(row)
        await self.session.flush()
        await self.session.refresh(row)
        return row

    async def list_case_witnesses(self, case_id: int) -> list[CaseWitness]:
        from sqlalchemy.orm import selectinload
        from app.modules.personnel.models import Witness
        r = await self.session.execute(
            select(CaseWitness)
            .options(selectinload(CaseWitness.witness).selectinload(Witness.person))
            .where(CaseWitness.case_id == case_id, CaseWitness.deleted_at.is_(None))
        )
        return list(r.scalars().all())

    async def remove_case_witness(self, case_id: int, witness_id: int) -> bool:
        r = await self.session.execute(
            select(CaseWitness)
            .where(
                CaseWitness.case_id == case_id,
                CaseWitness.witness_id == witness_id,
                CaseWitness.deleted_at.is_(None)
            )
        )
        row = r.scalars().first()
        if not row:
            return False
        row.deleted_at = datetime.now(tz=timezone.utc)
        await self.session.flush()
        return True

    # --- Charges ---
    async def create_charge(
        self, case_id: int, person_id: int, suspect_id: int, crime_type_id: int, description: str, court_case_id: int | None
    ) -> Charge:
        from app.shared.enums import ChargeStatusEnum
        row = Charge(
            case_id=case_id,
            person_id=person_id,
            suspect_id=suspect_id,
            crime_type_id=crime_type_id,
            charge_status=ChargeStatusEnum.filed,
            description=description,
            court_case_id=court_case_id,
            filed_at=datetime.now(tz=timezone.utc),
            created_at=datetime.now(tz=timezone.utc)
        )
        self.session.add(row)
        await self.session.flush()
        await self.session.refresh(row)
        return row

    async def update_charge(self, charge_id: int, data: dict) -> Charge | None:
        charge = await self.session.get(Charge, charge_id)
        if not charge or charge.deleted_at is not None:
            return None
        for k, v in data.items():
            if hasattr(charge, k):
                setattr(charge, k, v)
        charge.updated_at = datetime.now(tz=timezone.utc)
        await self.session.flush()
        await self.session.refresh(charge)
        return charge

    async def update_charge_status(self, charge_id: int, status) -> Charge | None:
        charge = await self.session.get(Charge, charge_id)
        if not charge or charge.deleted_at is not None:
            return None
        charge.charge_status = status
        charge.updated_at = datetime.now(tz=timezone.utc)
        await self.session.flush()
        await self.session.refresh(charge)
        return charge

    async def list_case_charges(self, case_id: int) -> list[Charge]:
        from sqlalchemy.orm import selectinload
        from app.modules.case_management.models import CrimeType
        from app.modules.auth.models import Person
        r = await self.session.execute(
            select(Charge)
            .options(
                selectinload(Charge.person),
                selectinload(Charge.crime_type)
            )
            .where(Charge.case_id == case_id, Charge.deleted_at.is_(None))
        )
        return list(r.scalars().all())

    # --- Arrests ---
    async def create_arrest(self, case_id: int, officer_id: int, data: dict) -> Arrest:
        row = Arrest(
            case_id=case_id,
            officer_id=officer_id,
            **data,
            created_at=datetime.now(tz=timezone.utc)
        )
        self.session.add(row)
        await self.session.flush()
        await self.session.refresh(row)
        return row

    async def update_arrest(self, arrest_id: int, data: dict) -> Arrest | None:
        arrest = await self.session.get(Arrest, arrest_id)
        if not arrest or arrest.deleted_at is not None:
            return None
        for k, v in data.items():
            if hasattr(arrest, k):
                setattr(arrest, k, v)
        arrest.updated_at = datetime.now(tz=timezone.utc)
        await self.session.flush()
        await self.session.refresh(arrest)
        return arrest

    async def list_case_arrests(self, case_id: int) -> list[Arrest]:
        from sqlalchemy.orm import selectinload
        from app.modules.auth.models import Officer
        from app.modules.personnel.models import Suspect
        r = await self.session.execute(
            select(Arrest)
            .options(
                selectinload(Arrest.suspect).selectinload(Suspect.person),
                selectinload(Arrest.arresting_officer).selectinload(Officer.person),
                selectinload(Arrest.location)
            )
            .where(Arrest.case_id == case_id, Arrest.deleted_at.is_(None))
        )
        return list(r.scalars().all())

    # --- Evidence ---
    async def create_evidence(self, case_id: int, officer_id: int, data: dict):
        from app.modules.case_management.models import Evidence
        row = Evidence(
            case_id=case_id,
            collected_by_officer_id=officer_id,
            **data
        )
        self.session.add(row)
        await self.session.flush()
        await self.session.refresh(row)
        return row

    async def update_evidence(self, evidence_id: int, data: dict):
        from app.modules.case_management.models import Evidence
        evidence = await self.session.get(Evidence, evidence_id)
        if not evidence:
            return None
        for k, v in data.items():
            if hasattr(evidence, k):
                setattr(evidence, k, v)
        await self.session.flush()
        await self.session.refresh(evidence)
        return evidence

    async def list_case_evidence(self, case_id: int):
        from app.modules.case_management.models import Evidence
        from sqlalchemy.orm import selectinload
        r = await self.session.execute(
            select(Evidence)
            .options(
                selectinload(Evidence.evidence_type),
                selectinload(Evidence.storage_location),
                selectinload(Evidence.collected_by_officer)
            )
            .where(Evidence.case_id == case_id)
        )
        return list(r.scalars().all())

    # --- Chain of Custody ---
    async def append_custody_event(self, evidence_id: int, action: str, officer_id: int, data: dict):
        from app.modules.case_management.models import ChainOfCustody
        row = ChainOfCustody(
            evidence_id=evidence_id,
            officer_id=officer_id,
            action=action,
            transferred_to=data.get("transferred_to"),
            location_id=data.get("location_id"),
            notes=data.get("notes"),
            created_at=datetime.now(tz=timezone.utc)
        )
        self.session.add(row)
        await self.session.flush()
        await self.session.refresh(row)
        return row

    async def get_full_chain(self, evidence_id: int):
        from app.modules.case_management.models import ChainOfCustody
        from sqlalchemy.orm import selectinload
        from app.modules.auth.models import Officer
        r = await self.session.execute(
            select(ChainOfCustody)
            .options(
                selectinload(ChainOfCustody.officer).selectinload(Officer.person),
                selectinload(ChainOfCustody.transferred_to_officer).selectinload(Officer.person),
                selectinload(ChainOfCustody.location)
            )
            .where(ChainOfCustody.evidence_id == evidence_id)
            .order_by(ChainOfCustody.created_at.asc())
        )
        return list(r.scalars().all())

    # --- Case Notes ---
    async def create_note(self, case_id: int, officer_id: int, data: dict):
        from app.modules.case_management.models import CaseNote
        row = CaseNote(
            case_id=case_id,
            officer_id=officer_id,
            **data,
            created_at=datetime.now(tz=timezone.utc)
        )
        self.session.add(row)
        await self.session.flush()
        await self.session.refresh(row)
        return row

    async def list_notes_by_case(self, case_id: int):
        from app.modules.case_management.models import CaseNote
        from sqlalchemy.orm import selectinload
        from app.modules.auth.models import Officer
        r = await self.session.execute(
            select(CaseNote)
            .options(selectinload(CaseNote.officer).selectinload(Officer.person))
            .where(CaseNote.case_id == case_id, CaseNote.deleted_at.is_(None))
            .order_by(CaseNote.created_at.desc())
        )
        return list(r.scalars().all())

    async def get_note_by_id(self, note_id: int):
        from app.modules.case_management.models import CaseNote
        from sqlalchemy.orm import selectinload
        from app.modules.auth.models import Officer
        r = await self.session.execute(
            select(CaseNote)
            .options(selectinload(CaseNote.officer).selectinload(Officer.person))
            .where(CaseNote.note_id == note_id, CaseNote.deleted_at.is_(None))
        )
        return r.scalars().first()

    async def update_note(self, note_id: int, data: dict):
        note = await self.get_note_by_id(note_id)
        if not note:
            return None
        for k, v in data.items():
            if hasattr(note, k):
                setattr(note, k, v)
        note.updated_at = datetime.now(tz=timezone.utc)
        await self.session.flush()
        await self.session.refresh(note)
        return note

    async def soft_delete_note(self, note_id: int):
        note = await self.get_note_by_id(note_id)
        if not note:
            return False
        note.deleted_at = datetime.now(tz=timezone.utc)
        await self.session.flush()
        return True

    # --- Advanced Queries ---
    async def get_case_timeline(self, case_id: int, update_type: str | None = None, page: int = 1, size: int = 20):
        query = select(CaseUpdate).options(
            selectinload(CaseUpdate.officer).selectinload(Officer.person)
        ).where(CaseUpdate.case_id == case_id)
        
        if update_type:
            query = query.where(CaseUpdate.update_type == update_type)
            
        query = query.order_by(CaseUpdate.created_at.desc())
        
        count_query = select(func.count()).select_from(query.subquery())
        total = (await self.session.execute(count_query)).scalar_one()
        
        query = query.offset((page - 1) * size).limit(size)
        r = await self.session.execute(query)
        return list(r.scalars().all()), total

    async def get_full_case_details(self, case_id: int):
        from sqlalchemy.orm import joinedload
        from app.modules.personnel.models import Suspect, Victim, Witness
        
        r = await self.session.execute(
            select(Case)
            .options(
                joinedload(Case.status),
                joinedload(Case.crime_type),
                joinedload(Case.primary_location),
                joinedload(Case.lead_officer).joinedload(Officer.person),
                selectinload(Case.assignments).selectinload(CaseOfficer.officer).selectinload(Officer.person),
                selectinload(Case.suspect_links).selectinload(CaseSuspect.suspect).selectinload(Suspect.person),
                selectinload(Case.victim_links).selectinload(CaseVictim.victim).selectinload(Victim.person),
                selectinload(Case.witness_links).selectinload(CaseWitness.witness).selectinload(Witness.person),
                selectinload(Case.charges).selectinload(Charge.crime_type),
                selectinload(Case.charges).selectinload(Charge.status),
                selectinload(Case.arrests).selectinload(Arrest.suspect).selectinload(Suspect.person),
                selectinload(Case.arrests).selectinload(Arrest.arresting_officer).selectinload(Officer.person),
                selectinload(Case.arrests).selectinload(Arrest.location),
                selectinload(Case.evidence_items).selectinload(Evidence.evidence_type),
                selectinload(Case.evidence_items).selectinload(Evidence.storage_location),
                selectinload(Case.notes).selectinload(CaseNote.officer).selectinload(Officer.person),
                selectinload(Case.updates).selectinload(CaseUpdate.officer).selectinload(Officer.person)
            )
            .where(Case.case_id == case_id, Case.deleted_at.is_(None))
        )
        return r.scalars().first()

    async def search_cases(self, filters: dict, requester: CurrentOfficerContext, page: int = 1, size: int = 20, sort_by: str = "created_at", sort_order: str = "desc"):
        from app.modules.case_management.models import CrimeType
        from app.modules.personnel.models import Suspect, Person
        from sqlalchemy.orm import joinedload
        
        query = select(Case).options(
            joinedload(Case.status),
            joinedload(Case.crime_type)
        ).where(Case.deleted_at.is_(None))
        
        # Visibility Rules
        if requester.role == RoleNameEnum.OFFICER:
            query = query.join(Case.assignments).where(CaseOfficer.officer_id == requester.officer_id)
        elif requester.role == RoleNameEnum.DEPARTMENT_HEAD:
            query = query.where(Case.department_id == requester.department_id)
            
        # Filters
        if filters.get("q"):
            query = query.where(Case.title.ilike(f"%{filters['q']}%"))
        if filters.get("case_number"):
            query = query.where(Case.case_id == filters["case_number"])
        if filters.get("suspect_name"):
            query = query.join(Case.suspect_links).join(CaseSuspect.suspect).join(Suspect.person).where(
                or_(
                    Person.first_name.ilike(f"%{filters['suspect_name']}%"),
                    Person.last_name.ilike(f"%{filters['suspect_name']}%")
                )
            )
        if filters.get("officer_id"):
            query = query.join(Case.assignments).where(CaseOfficer.officer_id == filters["officer_id"])
        if filters.get("crime_type_id"):
            query = query.where(Case.crime_type_id == filters["crime_type_id"])
        if filters.get("status_id"):
            query = query.where(Case.status_id == filters["status_id"])
        if filters.get("severity"):
            query = query.join(Case.crime_type).where(CrimeType.severity == filters["severity"])
        if filters.get("date_from"):
            query = query.where(Case.date_reported >= filters["date_from"])
        if filters.get("date_to"):
            query = query.where(Case.date_reported <= filters["date_to"])
        if filters.get("department_id"):
            if requester.role in (RoleNameEnum.ADMIN, RoleNameEnum.SUPERADMIN):
                query = query.where(Case.department_id == filters["department_id"])
            elif requester.role == RoleNameEnum.DEPARTMENT_HEAD:
                if filters["department_id"] == requester.department_id:
                     query = query.where(Case.department_id == filters["department_id"])
                else:
                    query = query.where(Case.department_id == -1)

        # Sorting
        sort_attr = getattr(Case, sort_by, Case.created_at)
        if sort_order == "desc":
            query = query.order_by(sort_attr.desc())
        else:
            query = query.order_by(sort_attr.asc())
            
        count_query = select(func.count()).select_from(query.subquery())
        total = (await self.session.execute(count_query)).scalar_one()
        
        query = query.offset((page - 1) * size).limit(size)
        r = await self.session.execute(query)
        return list(r.scalars().all()), total
