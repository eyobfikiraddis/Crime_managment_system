from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased, selectinload

from app.modules.auth.models import Department, Officer, OfficerHistory, Person, PersonHistory, Role
from app.modules.case_management.models import Arrest, Case, CaseOfficer, CasePerson, Charge
from app.modules.personnel.models import Suspect, Victim, Witness
from app.shared.enums import ChargeStatusEnum, RiskLevelEnum


class PersonRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_id(self, person_id: int, include_deleted: bool = False) -> Person | None:
        conditions = [Person.person_id == person_id]
        if not include_deleted:
            conditions.append(Person.deleted_at.is_(None))
        result = await self.session.execute(select(Person).where(and_(*conditions)))
        return result.scalar_one_or_none()

    async def get_by_national_id(
        self, national_id: str, include_deleted: bool = True
    ) -> Person | None:
        conditions = [Person.national_id == national_id]
        if not include_deleted:
            conditions.append(Person.deleted_at.is_(None))
        result = await self.session.execute(select(Person).where(and_(*conditions)))
        return result.scalar_one_or_none()

    async def list_persons(
        self,
        search: str | None,
        active_only: bool,
        offset: int,
        limit: int,
    ) -> tuple[list[Person], int]:
        conditions: list[Any] = []
        if active_only:
            conditions.append(Person.deleted_at.is_(None))
        if search:
            pattern = f"%{search}%"
            conditions.append(
                or_(
                    Person.first_name.ilike(pattern),
                    Person.last_name.ilike(pattern),
                    Person.national_id.ilike(pattern),
                )
            )

        count_stmt = select(func.count()).select_from(Person)
        if conditions:
            count_stmt = count_stmt.where(and_(*conditions))
        count_result = await self.session.execute(count_stmt)
        total: int = count_result.scalar_one()

        stmt = select(Person)
        if conditions:
            stmt = stmt.where(and_(*conditions))
        result = await self.session.execute(
            stmt.order_by(Person.created_at.desc()).offset(offset).limit(limit)
        )
        return list(result.scalars().all()), total

    async def create(
        self,
        first_name: str,
        last_name: str,
        national_id: str,
        gender: str | None,
        dob: Any | None,
        phone: str | None,
        address: str | None,
    ) -> Person:
        now = datetime.now(tz=timezone.utc)
        person = Person(
            first_name=first_name,
            last_name=last_name,
            national_id=national_id,
            gender=gender,
            dob=dob,
            phone=phone,
            address=address,
            created_at=now,
        )
        self.session.add(person)
        await self.session.flush()
        await self.session.refresh(person)
        return person

    async def update(
        self,
        person: Person,
        changed_by_officer_id: int,
        updates: dict[str, Any],
    ) -> Person:
        now = datetime.now(tz=timezone.utc)
        history_rows: list[PersonHistory] = []
        for field_name, new_value in updates.items():
            old_value = getattr(person, field_name, None)
            if old_value != new_value:
                history_rows.append(
                    PersonHistory(
                        person_id=person.person_id,
                        changed_by=changed_by_officer_id,
                        field_name=field_name,
                        old_value=str(old_value) if old_value is not None else None,
                        new_value=str(new_value) if new_value is not None else None,
                        changed_at=now,
                    )
                )
                setattr(person, field_name, new_value)
        person.updated_at = now
        self.session.add(person)
        for row in history_rows:
            self.session.add(row)
        await self.session.flush()
        await self.session.refresh(person)
        return person

    async def soft_delete(self, person: Person) -> None:
        now = datetime.now(tz=timezone.utc)
        person.deleted_at = now
        person.updated_at = now
        self.session.add(person)
        await self.session.flush()


class OfficerRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_id(
        self, officer_id: int, include_deleted: bool = False
    ) -> Officer | None:
        conditions = [Officer.officer_id == officer_id]
        if not include_deleted:
            conditions.append(Officer.deleted_at.is_(None))
        result = await self.session.execute(
            select(Officer)
            .options(
                selectinload(Officer.person),
                selectinload(Officer.role),
                selectinload(Officer.department),
            )
            .where(and_(*conditions))
        )
        return result.scalar_one_or_none()

    async def get_by_person_id(
        self, person_id: int, include_deleted: bool = False
    ) -> Officer | None:
        conditions = [Officer.person_id == person_id]
        if not include_deleted:
            conditions.append(Officer.deleted_at.is_(None))
        result = await self.session.execute(
            select(Officer)
            .options(
                selectinload(Officer.person),
                selectinload(Officer.role),
                selectinload(Officer.department),
            )
            .where(and_(*conditions))
        )
        return result.scalar_one_or_none()

    async def get_by_badge_number(
        self, badge_number: str, exclude_officer_id: int | None = None
    ) -> Officer | None:
        conditions = [
            Officer.badge_number == badge_number,
            Officer.deleted_at.is_(None),
        ]
        if exclude_officer_id is not None:
            conditions.append(Officer.officer_id != exclude_officer_id)
        result = await self.session.execute(select(Officer).where(and_(*conditions)))
        return result.scalar_one_or_none()

    async def list_officers(
        self,
        department_id: int | None,
        role_id: int | None,
        search: str | None,
        active_only: bool,
        offset: int,
        limit: int,
    ) -> tuple[list[Officer], int]:
        conditions: list[Any] = [Officer.deleted_at.is_(None)]
        if active_only:
            conditions.append(Officer.is_active.is_(True))
        if department_id is not None:
            conditions.append(Officer.department_id == department_id)
        if role_id is not None:
            conditions.append(Officer.role_id == role_id)
        if search:
            pattern = f"%{search}%"
            conditions.append(
                or_(
                    Person.first_name.ilike(pattern),
                    Person.last_name.ilike(pattern),
                    Officer.badge_number.ilike(pattern),
                )
            )

        base_query = (
            select(Officer)
            .join(Officer.person)
            .options(
                selectinload(Officer.person),
                selectinload(Officer.role),
                selectinload(Officer.department),
            )
            .where(and_(*conditions))
        )

        count_query = (
            select(func.count())
            .select_from(Officer)
            .join(Officer.person)
            .where(and_(*conditions))
        )

        total_result = await self.session.execute(count_query)
        total: int = total_result.scalar_one()

        result = await self.session.execute(
            base_query.order_by(Officer.created_at.desc()).offset(offset).limit(limit)
        )
        return list(result.scalars().all()), total

    async def create(
        self,
        person_id: int,
        department_id: int | None,
        role_id: int,
        password_hash: str,
        rank: str | None,
        badge_number: str | None,
    ) -> Officer:
        now = datetime.now(tz=timezone.utc)
        officer = Officer(
            person_id=person_id,
            department_id=department_id,
            role_id=role_id,
            password_hash=password_hash,
            rank=rank,
            badge_number=badge_number,
            is_active=True,
            created_at=now,
        )
        self.session.add(officer)
        await self.session.flush()
        await self.session.refresh(officer)
        return officer

    async def update(
        self,
        officer: Officer,
        changed_by_officer_id: int,
        updates: dict[str, Any],
    ) -> Officer:
        now = datetime.now(tz=timezone.utc)
        history_rows: list[OfficerHistory] = []
        for field_name, new_value in updates.items():
            old_value = getattr(officer, field_name, None)
            if old_value != new_value:
                history_rows.append(
                    OfficerHistory(
                        officer_id=officer.officer_id,
                        changed_by=changed_by_officer_id,
                        field_name=field_name,
                        old_value=str(old_value) if old_value is not None else None,
                        new_value=str(new_value) if new_value is not None else None,
                        changed_at=now,
                    )
                )
                setattr(officer, field_name, new_value)
        officer.updated_at = now
        self.session.add(officer)
        for row in history_rows:
            self.session.add(row)
        await self.session.flush()
        await self.session.refresh(officer)
        return officer

    async def write_officer_history(
        self,
        officer_id: int,
        changed_by: int,
        field_name: str,
        old_value: str | None,
        new_value: str | None,
    ) -> None:
        row = OfficerHistory(
            officer_id=officer_id,
            changed_by=changed_by,
            field_name=field_name,
            old_value=old_value,
            new_value=new_value,
            changed_at=datetime.now(tz=timezone.utc),
        )
        self.session.add(row)
        await self.session.flush()

    async def soft_delete(self, officer: Officer) -> None:
        now = datetime.now(tz=timezone.utc)
        officer.deleted_at = now
        officer.updated_at = now
        officer.is_active = False
        self.session.add(officer)
        await self.session.flush()


class RoleRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_id(self, role_id: int) -> Role | None:
        result = await self.session.execute(select(Role).where(Role.role_id == role_id))
        return result.scalar_one_or_none()


class DepartmentRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_id(self, department_id: int) -> Department | None:
        result = await self.session.execute(
            select(Department).where(
                Department.department_id == department_id,
                Department.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()


ACTIVE_CHARGE_STATUSES = (
    ChargeStatusEnum.filed,
    ChargeStatusEnum.pending,
    ChargeStatusEnum.convicted,
    ChargeStatusEnum.appealed,
)


class CiviliansRepository:
    """Suspect, victim, witness, and officer history reads."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_suspect_by_person_id(
        self, person_id: int, *, include_deleted: bool = False
    ) -> Suspect | None:
        conditions = [Suspect.person_id == person_id]
        if not include_deleted:
            conditions.append(Suspect.deleted_at.is_(None))
        result = await self.session.execute(
            select(Suspect)
            .options(selectinload(Suspect.person))
            .where(and_(*conditions))
        )
        return result.scalar_one_or_none()

    async def get_suspect_by_id(self, suspect_id: int) -> Suspect | None:
        result = await self.session.execute(
            select(Suspect)
            .options(selectinload(Suspect.person))
            .where(Suspect.suspect_id == suspect_id, Suspect.deleted_at.is_(None))
        )
        return result.scalar_one_or_none()

    async def get_suspect_by_id_include_deleted(self, suspect_id: int) -> Suspect | None:
        result = await self.session.execute(
            select(Suspect)
            .options(selectinload(Suspect.person))
            .where(Suspect.suspect_id == suspect_id)
        )
        return result.scalar_one_or_none()

    async def create_suspect(
        self,
        person_id: int,
        criminal_record: str | None,
        risk_level: RiskLevelEnum | None,
    ) -> Suspect:
        now = datetime.now(tz=timezone.utc)
        row = Suspect(
            person_id=person_id,
            criminal_record=criminal_record,
            risk_level=risk_level,
            created_at=now,
        )
        self.session.add(row)
        await self.session.flush()
        await self.session.refresh(row)
        return row

    async def reactivate_suspect(
        self,
        suspect: Suspect,
        criminal_record: str | None,
        risk_level: RiskLevelEnum | None,
    ) -> Suspect:
        now = datetime.now(tz=timezone.utc)
        suspect.deleted_at = None
        suspect.criminal_record = criminal_record
        suspect.risk_level = risk_level
        suspect.updated_at = now
        self.session.add(suspect)
        await self.session.flush()
        await self.session.refresh(suspect)
        return suspect

    async def soft_delete_suspect(self, suspect: Suspect) -> Suspect:
        now = datetime.now(tz=timezone.utc)
        suspect.deleted_at = now
        suspect.updated_at = now
        self.session.add(suspect)
        await self.session.flush()
        await self.session.refresh(suspect)
        return suspect

    async def person_has_blocking_charges(self, person_id: int) -> bool:
        result = await self.session.execute(
            select(func.count())
            .select_from(Charge)
            .where(
                Charge.person_id == person_id,
                Charge.charge_status.in_(ACTIVE_CHARGE_STATUSES),
            )
        )
        return int(result.scalar_one() or 0) > 0

    async def list_suspects(
        self,
        *,
        risk_level: RiskLevelEnum | None,
        include_deleted: bool,
        case_id: int | None,
        page: int,
        size: int,
    ) -> tuple[list[Suspect], int]:
        conditions: list[Any] = []
        if not include_deleted:
            conditions.append(Suspect.deleted_at.is_(None))
        if risk_level is not None:
            conditions.append(Suspect.risk_level == risk_level)
        if case_id is not None:
            sub = (
                select(1)
                .select_from(CasePerson)
                .where(
                    CasePerson.person_id == Suspect.person_id,
                    CasePerson.case_id == case_id,
                    CasePerson.role_type.ilike("%suspect%"),
                )
                .exists()
            )
            conditions.append(sub)

        base = select(Suspect).options(selectinload(Suspect.person))
        if conditions:
            base = base.where(and_(*conditions))

        count_stmt = select(func.count()).select_from(Suspect)
        if conditions:
            count_stmt = count_stmt.where(and_(*conditions))
        total_result = await self.session.execute(count_stmt)
        total: int = total_result.scalar_one()

        offset = (page - 1) * size
        result = await self.session.execute(
            base.order_by(Suspect.created_at.desc()).offset(offset).limit(size)
        )
        return list(result.scalars().all()), total

    async def count_active_cases_as_suspect_for_persons(
        self, person_ids: list[int]
    ) -> dict[int, int]:
        if not person_ids:
            return {}
        stmt = (
            select(CasePerson.person_id, func.count(func.distinct(CasePerson.case_id)))
            .join(Case, Case.case_id == CasePerson.case_id)
            .where(
                Case.deleted_at.is_(None),
                CasePerson.person_id.in_(person_ids),
                CasePerson.role_type.ilike("%suspect%"),
            )
            .group_by(CasePerson.person_id)
        )
        rows = (await self.session.execute(stmt)).all()
        return {int(r[0]): int(r[1]) for r in rows}

    async def count_active_charges_for_persons(self, person_ids: list[int]) -> dict[int, int]:
        if not person_ids:
            return {}
        stmt = (
            select(Charge.person_id, func.count())
            .select_from(Charge)
            .where(
                Charge.person_id.in_(person_ids),
                Charge.charge_status.in_(ACTIVE_CHARGE_STATUSES),
            )
            .group_by(Charge.person_id)
        )
        rows = (await self.session.execute(stmt)).all()
        return {int(r[0]): int(r[1]) for r in rows}

    async def count_arrests_for_suspect(self, suspect_id: int) -> int:
        r = await self.session.execute(
            select(func.count())
            .select_from(Arrest)
            .where(Arrest.suspect_id == suspect_id, Arrest.deleted_at.is_(None))
        )
        return int(r.scalar_one() or 0)

    async def count_charges_for_person(self, person_id: int) -> int:
        r = await self.session.execute(
            select(func.count()).select_from(Charge).where(Charge.person_id == person_id)
        )
        return int(r.scalar_one() or 0)

    async def count_cases_as_suspect_for_person(self, person_id: int) -> int:
        r = await self.session.execute(
            select(func.count(func.distinct(CasePerson.case_id)))
            .select_from(CasePerson)
            .join(Case, Case.case_id == CasePerson.case_id)
            .where(
                CasePerson.person_id == person_id,
                Case.deleted_at.is_(None),
                CasePerson.role_type.ilike("%suspect%"),
            )
        )
        return int(r.scalar_one() or 0)

    async def get_suspect_cases(
        self, person_id: int, offset: int, limit: int
    ) -> tuple[list[Case], int]:
        count_q = (
            select(func.count(func.distinct(Case.case_id)))
            .select_from(Case)
            .join(CasePerson, CasePerson.case_id == Case.case_id)
            .where(
                CasePerson.person_id == person_id,
                Case.deleted_at.is_(None),
                CasePerson.role_type.ilike("%suspect%"),
            )
        )
        total = int((await self.session.execute(count_q)).scalar_one() or 0)

        stmt = (
            select(Case)
            .join(CasePerson, CasePerson.case_id == Case.case_id)
            .options(
                selectinload(Case.status),
                selectinload(Case.crime_type),
                selectinload(Case.case_officers).selectinload(CaseOfficer.officer).selectinload(
                    Officer.person
                ),
            )
            .where(
                CasePerson.person_id == person_id,
                Case.deleted_at.is_(None),
                CasePerson.role_type.ilike("%suspect%"),
            )
            .order_by(Case.opened_at.desc().nullslast(), Case.case_id.desc())
            .distinct()
            .offset(offset)
            .limit(limit)
        )
        result = await self.session.scalars(stmt)
        return list(result.unique().all()), total

    async def get_suspect_arrests(
        self, suspect_id: int, offset: int, limit: int
    ) -> tuple[list[Arrest], int]:
        count_q = (
            select(func.count())
            .select_from(Arrest)
            .where(Arrest.suspect_id == suspect_id, Arrest.deleted_at.is_(None))
        )
        total = int((await self.session.execute(count_q)).scalar_one() or 0)
        stmt = (
            select(Arrest)
            .options(
                selectinload(Arrest.arresting_officer).selectinload(Officer.person),
                selectinload(Arrest.case),
            )
            .where(Arrest.suspect_id == suspect_id, Arrest.deleted_at.is_(None))
            .order_by(Arrest.date.desc())
            .offset(offset)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all()), total

    async def get_suspect_charges(
        self, person_id: int, offset: int, limit: int
    ) -> tuple[list[Charge], int]:
        count_q = (
            select(func.count()).select_from(Charge).where(Charge.person_id == person_id)
        )
        total = int((await self.session.execute(count_q)).scalar_one() or 0)
        stmt = (
            select(Charge)
            .options(
                selectinload(Charge.crime_type),
                selectinload(Charge.case).selectinload(Case.status),
            )
            .where(Charge.person_id == person_id)
            .order_by(Charge.filed_at.desc().nullslast(), Charge.charge_id.desc())
            .offset(offset)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all()), total

    async def get_victim_by_person_id(
        self, person_id: int, *, include_deleted: bool = False
    ) -> Victim | None:
        conditions = [Victim.person_id == person_id]
        if not include_deleted:
            conditions.append(Victim.deleted_at.is_(None))
        result = await self.session.execute(
            select(Victim)
            .options(selectinload(Victim.person))
            .where(and_(*conditions))
        )
        return result.scalar_one_or_none()

    async def create_victim(self, person_id: int, notes: str | None) -> Victim:
        now = datetime.now(tz=timezone.utc)
        row = Victim(person_id=person_id, notes=notes, created_at=now)
        self.session.add(row)
        await self.session.flush()
        await self.session.refresh(row)
        return row

    async def reactivate_victim(self, victim: Victim, notes: str | None) -> Victim:
        now = datetime.now(tz=timezone.utc)
        victim.deleted_at = None
        victim.notes = notes
        victim.updated_at = now
        self.session.add(victim)
        await self.session.flush()
        await self.session.refresh(victim)
        return victim

    async def soft_delete_victim(self, victim: Victim) -> Victim:
        now = datetime.now(tz=timezone.utc)
        victim.deleted_at = now
        victim.updated_at = now
        self.session.add(victim)
        await self.session.flush()
        await self.session.refresh(victim)
        return victim

    async def get_witness_by_person_id(
        self, person_id: int, *, include_deleted: bool = False
    ) -> Witness | None:
        conditions = [Witness.person_id == person_id]
        if not include_deleted:
            conditions.append(Witness.deleted_at.is_(None))
        result = await self.session.execute(
            select(Witness)
            .options(selectinload(Witness.person))
            .where(and_(*conditions))
        )
        return result.scalar_one_or_none()

    async def create_witness(
        self, person_id: int, credibility_notes: str | None, is_protected: bool
    ) -> Witness:
        now = datetime.now(tz=timezone.utc)
        row = Witness(
            person_id=person_id,
            credibility_notes=credibility_notes,
            is_protected=is_protected,
            created_at=now,
        )
        self.session.add(row)
        await self.session.flush()
        await self.session.refresh(row)
        return row

    async def reactivate_witness(
        self,
        witness: Witness,
        credibility_notes: str | None,
        is_protected: bool,
    ) -> Witness:
        now = datetime.now(tz=timezone.utc)
        witness.deleted_at = None
        witness.credibility_notes = credibility_notes
        witness.is_protected = is_protected
        witness.updated_at = now
        self.session.add(witness)
        await self.session.flush()
        await self.session.refresh(witness)
        return witness

    async def soft_delete_witness(self, witness: Witness) -> Witness:
        now = datetime.now(tz=timezone.utc)
        witness.deleted_at = now
        witness.updated_at = now
        self.session.add(witness)
        await self.session.flush()
        await self.session.refresh(witness)
        return witness

    async def get_officer_history(
        self, officer_id: int, offset: int, limit: int
    ) -> tuple[list[tuple[OfficerHistory, str]], int]:
        changer = aliased(Officer)
        count_q = (
            select(func.count())
            .select_from(OfficerHistory)
            .where(OfficerHistory.officer_id == officer_id)
        )
        total = int((await self.session.execute(count_q)).scalar_one() or 0)

        stmt = (
            select(OfficerHistory, Person.first_name, Person.last_name)
            .join(changer, changer.officer_id == OfficerHistory.changed_by)
            .join(Person, Person.person_id == changer.person_id)
            .where(OfficerHistory.officer_id == officer_id)
            .order_by(OfficerHistory.changed_at.desc())
            .offset(offset)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        rows = [(h, f"{fn} {ln}") for h, fn, ln in result.all()]
        return rows, total
