from __future__ import annotations

from datetime import datetime, date as date_type, timezone
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.case_management.models import CaseSuspect, Charge, CourtCase, Sentence
from app.shared.enums import ChargeStatusEnum


class LegalRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_court_case_by_case_id(self, case_id: int) -> CourtCase | None:
        result = await self.session.execute(
            select(CourtCase).where(
                CourtCase.case_id == case_id,
                CourtCase.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    async def get_court_case_by_id(self, court_case_id: int) -> CourtCase | None:
        result = await self.session.execute(
            select(CourtCase).where(
                CourtCase.court_case_id == court_case_id,
                CourtCase.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    async def create_court_case(
        self,
        case_id: int,
        court_name: str,
        court_reference: Optional[str],
        judge_name: Optional[str],
        prosecutor_name: Optional[str],
        hearing_date: Optional[date_type],
    ) -> CourtCase:
        now = datetime.now(tz=timezone.utc)
        obj = CourtCase(
            case_id=case_id,
            court_name=court_name,
            court_reference=court_reference,
            judge_name=judge_name,
            prosecutor_name=prosecutor_name,
            hearing_date=hearing_date,
            created_at=now,
        )
        self.session.add(obj)
        await self.session.flush()
        await self.session.refresh(obj)
        return obj

    async def update_court_case(self, court_case: CourtCase) -> CourtCase:
        await self.session.flush()
        await self.session.refresh(court_case)
        return court_case

    async def get_charge_by_id(self, charge_id: int) -> Charge | None:
        result = await self.session.execute(
            select(Charge).where(
                Charge.charge_id == charge_id,
                Charge.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    async def list_charges_by_case(
        self,
        case_id: int,
        suspect_id_filter: Optional[int],
        status_filter: Optional[ChargeStatusEnum],
        page: int,
        size: int,
    ) -> tuple[list[Charge], int]:
        query = (
            select(Charge)
            .options(selectinload(Charge.sentence_record))
            .where(
                Charge.case_id == case_id,
                Charge.deleted_at.is_(None),
            )
        )
        if suspect_id_filter is not None:
            query = query.where(Charge.suspect_id == suspect_id_filter)
        if status_filter is not None:
            query = query.where(Charge.charge_status == status_filter)

        total = (
            await self.session.execute(select(func.count()).select_from(query.subquery()))
        ).scalar_one()
        rows = await self.session.execute(
            query.offset((page - 1) * size).limit(size)
        )
        return list(rows.scalars().all()), int(total or 0)

    async def create_charge(
        self,
        case_id: int,
        court_case_id: Optional[int],
        suspect_id: int,
        person_id: int,
        crime_type_id: int,
        description: str,
    ) -> Charge:
        now = datetime.now(tz=timezone.utc)
        obj = Charge(
            case_id=case_id,
            court_case_id=court_case_id,
            suspect_id=suspect_id,
            person_id=person_id,
            crime_type_id=crime_type_id,
            description=description,
            charge_status=ChargeStatusEnum.filed,
            filed_at=now,
            created_at=now,
        )
        self.session.add(obj)
        await self.session.flush()
        await self.session.refresh(obj)
        return obj

    async def update_charge_status(
        self, charge: Charge, new_status: ChargeStatusEnum
    ) -> Charge:
        charge.charge_status = new_status
        charge.updated_at = datetime.now(tz=timezone.utc)
        await self.session.flush()
        await self.session.refresh(charge)
        return charge

    async def drop_charge(self, charge: Charge) -> Charge:
        charge.charge_status = ChargeStatusEnum.dismissed
        charge.updated_at = datetime.now(tz=timezone.utc)
        await self.session.flush()
        await self.session.refresh(charge)
        return charge

    async def count_unresolved_charges_for_case(self, case_id: int) -> int:
        terminal = (
            ChargeStatusEnum.dismissed,
            ChargeStatusEnum.acquitted,
            ChargeStatusEnum.convicted,
        )
        result = await self.session.execute(
            select(func.count()).select_from(
                select(Charge)
                .where(
                    Charge.case_id == case_id,
                    Charge.deleted_at.is_(None),
                    Charge.charge_status.notin_(terminal),
                )
                .subquery()
            )
        )
        return int(result.scalar_one() or 0)

    async def count_unresolved_charges_for_court_case(self, court_case_id: int) -> int:
        terminal = (
            ChargeStatusEnum.dismissed,
            ChargeStatusEnum.acquitted,
            ChargeStatusEnum.convicted,
        )
        result = await self.session.execute(
            select(func.count()).select_from(
                select(Charge)
                .where(
                    Charge.court_case_id == court_case_id,
                    Charge.deleted_at.is_(None),
                    Charge.charge_status.notin_(terminal),
                )
                .subquery()
            )
        )
        return int(result.scalar_one() or 0)

    async def get_sentence_by_charge_id(self, charge_id: int) -> Sentence | None:
        result = await self.session.execute(
            select(Sentence).where(
                Sentence.charge_id == charge_id,
                Sentence.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    async def create_sentence(
        self,
        charge_id: int,
        court_case_id: int,
        description: str,
        duration: str,
        duration_days: Optional[int],
        start_date: Optional[date_type],
        end_date: Optional[date_type],
        sentence_type: Optional[str],
        is_suspended: Optional[bool],
        sentenced_at: Optional[datetime],
    ) -> Sentence:
        now = datetime.now(tz=timezone.utc)
        obj = Sentence(
            charge_id=charge_id,
            court_case_id=court_case_id,
            description=description,
            duration=duration,
            duration_days=duration_days,
            start_date=start_date,
            end_date=end_date,
            sentence_type=sentence_type,
            is_suspended=bool(is_suspended),
            sentenced_at=sentenced_at or now,
            created_at=now,
        )
        self.session.add(obj)
        await self.session.flush()
        await self.session.refresh(obj)
        return obj

    async def suspect_linked_to_case(self, case_id: int, suspect_id: int) -> bool:
        result = await self.session.execute(
            select(CaseSuspect).where(
                CaseSuspect.case_id == case_id,
                CaseSuspect.suspect_id == suspect_id,
                CaseSuspect.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none() is not None
