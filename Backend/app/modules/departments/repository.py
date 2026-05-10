from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.auth.models import Department, Officer
from app.modules.personnel.models import DepartmentAuditLog


class DepartmentRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_id(
        self, department_id: int, include_deleted: bool = False
    ) -> Department | None:
        conditions = [Department.department_id == department_id]
        if not include_deleted:
            conditions.append(Department.deleted_at.is_(None))
        result = await self.session.execute(
            select(Department)
            .options(
                selectinload(Department.department_head).selectinload(Officer.person)
            )
            .where(and_(*conditions))
        )
        return result.scalar_one_or_none()

    async def get_by_name_case_insensitive(
        self, name: str, exclude_id: int | None = None
    ) -> Department | None:
        conditions = [func.lower(Department.name) == name.lower()]
        if exclude_id is not None:
            conditions.append(Department.department_id != exclude_id)
        result = await self.session.execute(
            select(Department).where(and_(*conditions))
        )
        return result.scalar_one_or_none()

    async def list_departments(
        self, offset: int, limit: int
    ) -> tuple[list[tuple[Department, int]], int]:
        count_result = await self.session.execute(
            select(func.count()).select_from(Department).where(Department.deleted_at.is_(None))
        )
        total: int = count_result.scalar_one()

        officer_count_subq = (
            select(
                Officer.department_id,
                func.count(Officer.officer_id).label("officer_count"),
            )
            .where(
                Officer.deleted_at.is_(None),
                Officer.is_active.is_(True),
            )
            .group_by(Officer.department_id)
            .subquery()
        )

        stmt = (
            select(Department, func.coalesce(officer_count_subq.c.officer_count, 0))
            .outerjoin(
                officer_count_subq,
                officer_count_subq.c.department_id == Department.department_id,
            )
            .options(
                selectinload(Department.department_head).selectinload(Officer.person)
            )
            .where(Department.deleted_at.is_(None))
            .order_by(Department.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        rows = list(result.all())
        return [(row[0], int(row[1])) for row in rows], total

    async def create(self, name: str, location_id: int | None) -> Department:
        now = datetime.now(tz=timezone.utc)
        department = Department(
            name=name,
            location_id=location_id,
            created_at=now,
        )
        self.session.add(department)
        await self.session.flush()
        await self.session.refresh(department)
        return department

    async def update(self, department: Department, updates: dict[str, Any]) -> Department:
        now = datetime.now(tz=timezone.utc)
        for field_name, new_value in updates.items():
            setattr(department, field_name, new_value)
        department.updated_at = now
        self.session.add(department)
        await self.session.flush()
        await self.session.refresh(department)
        return department

    async def soft_delete(self, department: Department) -> None:
        now = datetime.now(tz=timezone.utc)
        department.deleted_at = now
        department.updated_at = now
        self.session.add(department)
        await self.session.flush()

    async def count_active_officers(self, department_id: int) -> int:
        result = await self.session.execute(
            select(func.count())
            .select_from(Officer)
            .where(
                Officer.department_id == department_id,
                Officer.deleted_at.is_(None),
                Officer.is_active.is_(True),
            )
        )
        return result.scalar_one()

    async def get_officer_in_department(self, officer_id: int, department_id: int) -> Officer | None:
        result = await self.session.execute(
            select(Officer)
            .where(
                Officer.officer_id == officer_id,
                Officer.department_id == department_id,
                Officer.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    async def write_audit_log(
        self,
        department_id: int,
        changed_by_officer_id: int,
        event_type: str,
        old_value: dict | None = None,
        new_value: dict | None = None,
    ) -> None:
        audit = DepartmentAuditLog(
            department_id=department_id,
            changed_by_officer_id=changed_by_officer_id,
            event_type=event_type,
            old_value=old_value,
            new_value=new_value,
            created_at=datetime.now(tz=timezone.utc),
        )
        self.session.add(audit)
        await self.session.flush()
