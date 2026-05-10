from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.auth.models import Department, Officer, OfficerHistory, Person, PersonHistory, Role


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
