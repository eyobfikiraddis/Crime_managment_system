from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.case_management.models import Interrogation


class InterrogationRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create_interrogation(
        self,
        case_id: int,
        suspect_id: int,
        officer_id: int,
        date: datetime,
        notes: str | None,
        location_id: int | None,
        recording_url: str | None,
    ) -> Interrogation:
        row = Interrogation(
            case_id=case_id,
            suspect_id=suspect_id,
            officer_id=officer_id,
            date=date,
            notes=notes,
            location_id=location_id,
            recording_url=recording_url,
            created_at=datetime.now(tz=timezone.utc),
        )
        self.session.add(row)
        await self.session.flush()
        await self.session.refresh(row)
        return row

    async def list_by_case(
        self, case_id: int, suspect_id_filter: int | None, page: int, size: int
    ) -> tuple[list[Interrogation], int]:
        stmt = select(Interrogation).where(
            Interrogation.case_id == case_id,
            Interrogation.deleted_at.is_(None),
        )
        if suspect_id_filter is not None:
            stmt = stmt.where(Interrogation.suspect_id == suspect_id_filter)

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = int((await self.session.execute(count_stmt)).scalar_one() or 0)
        rows = await self.session.execute(
            stmt.offset((page - 1) * size).limit(size)
        )
        return list(rows.scalars().all()), total

    async def get_by_id(self, interrogation_id: int) -> Interrogation | None:
        result = await self.session.execute(
            select(Interrogation).where(
                Interrogation.interrogation_id == interrogation_id,
                Interrogation.deleted_at.is_(None),
            )
        )
        return result.scalars().first()
