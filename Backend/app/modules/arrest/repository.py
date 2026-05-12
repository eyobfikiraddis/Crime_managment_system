from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.arrest.schemas.requests import ArrestCreateRequest, ArrestUpdateRequest
from app.modules.case_management.models import Arrest, CaseSuspect


class ArrestRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create_arrest(
        self, data: ArrestCreateRequest, created_by_officer_id: int
    ) -> Arrest:
        row = Arrest(
            suspect_id=data.suspect_id,
            officer_id=data.arrested_by_officer_id,
            case_id=data.case_id,
            booking_number=data.booking_number,
            location_id=data.arrest_location_id,
            bail_amount=data.bail_amount,
            date=data.arrest_datetime,
            notes=data.notes,
            created_at=datetime.now(tz=timezone.utc),
        )
        self.session.add(row)
        await self.session.flush()
        await self.session.refresh(row)
        return row

    async def get_by_id(self, arrest_id: int) -> Arrest | None:
        result = await self.session.execute(
            select(Arrest).where(
                Arrest.arrest_id == arrest_id,
                Arrest.deleted_at.is_(None),
            )
        )
        return result.scalars().first()

    async def list_by_case(
        self, case_id: int, page: int, size: int
    ) -> tuple[list[Arrest], int]:
        stmt = select(Arrest).where(
            Arrest.case_id == case_id,
            Arrest.deleted_at.is_(None),
        )
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = int((await self.session.execute(count_stmt)).scalar_one() or 0)
        rows = await self.session.execute(
            stmt.offset((page - 1) * size).limit(size)
        )
        return list(rows.scalars().all()), total

    async def update_arrest(
        self, arrest: Arrest, data: ArrestUpdateRequest
    ) -> Arrest:
        if data.bail_amount is not None:
            arrest.bail_amount = data.bail_amount
        if data.notes is not None:
            arrest.notes = data.notes
        if data.released_at is not None:
            arrest.released_at = data.released_at
        arrest.updated_at = datetime.now(tz=timezone.utc)
        await self.session.flush()
        await self.session.refresh(arrest)
        return arrest

    async def soft_delete(self, arrest: Arrest) -> None:
        arrest.deleted_at = datetime.now(tz=timezone.utc)
        await self.session.flush()

    async def get_by_booking_number(self, booking_number: str) -> Arrest | None:
        result = await self.session.execute(
            select(Arrest).where(Arrest.booking_number == booking_number)
        )
        return result.scalars().first()

    async def suspect_linked_to_case(
        self, case_id: int, suspect_id: int
    ) -> bool:
        result = await self.session.execute(
            select(CaseSuspect).where(
                CaseSuspect.case_id == case_id,
                CaseSuspect.suspect_id == suspect_id,
                CaseSuspect.deleted_at.is_(None),
            )
        )
        return result.scalars().first() is not None

    async def link_suspect_to_case(
        self, case_id: int, suspect_id: int, added_by: int
    ) -> None:
        row = CaseSuspect(
            case_id=case_id,
            suspect_id=suspect_id,
            added_by=added_by,
            added_at=datetime.now(tz=timezone.utc),
        )
        self.session.add(row)
        await self.session.flush()
