from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.auth.models import Location, Officer
from app.modules.case_management.models import Case, CaseStatus, CaseUpdate
from app.modules.evidence.models import (
    ChainOfCustody,
    CrimeScenePhoto,
    Evidence,
    EvidenceHistory,
    EvidenceType,
    ForensicReport,
    Vehicle,
    Weapon,
)
from app.shared.pagination import PaginationParams


class EvidenceRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_case_by_id(self, case_id: int) -> Case | None:
        return await self.session.get(Case, case_id)

    async def get_case_status(self, status_id: int) -> CaseStatus | None:
        return await self.session.get(CaseStatus, status_id)

    async def get_evidence_type(self, evidence_type_id: int) -> EvidenceType | None:
        return await self.session.get(EvidenceType, evidence_type_id)

    async def get_location_by_id(self, location_id: int | None) -> Location | None:
        if location_id is None:
            return None
        return await self.session.get(Location, location_id)

    async def get_officer_active(self, officer_id: int) -> Officer | None:
        result = await self.session.execute(
            select(Officer)
            .options(selectinload(Officer.person))
            .where(
                Officer.officer_id == officer_id,
                Officer.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    async def get_officer_with_person(self, officer_id: int) -> Officer | None:
        result = await self.session.execute(
            select(Officer)
            .options(selectinload(Officer.person))
            .where(Officer.officer_id == officer_id)
        )
        return result.scalar_one_or_none()

    async def get_evidence_by_id(
        self, evidence_id: int, include_deleted: bool = False
    ) -> Evidence | None:
        conditions = [Evidence.evidence_id == evidence_id]
        if not include_deleted:
            conditions.append(Evidence.deleted_at.is_(None))
        stmt = (
            select(Evidence)
            .options(
                selectinload(Evidence.evidence_type),
                selectinload(Evidence.storage_location),
                selectinload(Evidence.collected_by_officer).selectinload(Officer.person),
            )
            .where(and_(*conditions))
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_evidence_with_full_detail(self, evidence_id: int) -> Evidence | None:
        stmt = (
            select(Evidence)
            .options(
                selectinload(Evidence.evidence_type),
                selectinload(Evidence.storage_location),
                selectinload(Evidence.collected_by_officer).selectinload(Officer.person),
                selectinload(Evidence.chain_events)
                .selectinload(ChainOfCustody.officer)
                .selectinload(Officer.person),
                selectinload(Evidence.chain_events)
                .selectinload(ChainOfCustody.transferred_to_officer)
                .selectinload(Officer.person),
                selectinload(Evidence.chain_events).selectinload(ChainOfCustody.location),
                selectinload(Evidence.forensic_report_doc)
                .selectinload(ForensicReport.officer)
                .selectinload(Officer.person),
                selectinload(Evidence.vehicle_detail),
                selectinload(Evidence.weapon_detail),
            )
            .where(Evidence.evidence_id == evidence_id, Evidence.deleted_at.is_(None))
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_evidence_by_case(
        self, case_id: int, pagination: PaginationParams
    ) -> tuple[list[Evidence], int]:
        count_stmt = (
            select(func.count())
            .select_from(Evidence)
            .where(Evidence.case_id == case_id, Evidence.deleted_at.is_(None))
        )
        total = int((await self.session.execute(count_stmt)).scalar_one() or 0)
        stmt = (
            select(Evidence)
            .options(
                selectinload(Evidence.evidence_type),
                selectinload(Evidence.storage_location),
                selectinload(Evidence.collected_by_officer).selectinload(Officer.person),
            )
            .where(Evidence.case_id == case_id, Evidence.deleted_at.is_(None))
            .order_by(Evidence.created_at.desc())
            .offset(pagination.offset)
            .limit(pagination.size)
        )
        rows = await self.session.scalars(stmt)
        return list(rows.all()), total

    async def list_evidence_by_case(self, case_id: int) -> list[Evidence]:
        stmt = (
            select(Evidence)
            .options(
                selectinload(Evidence.evidence_type),
                selectinload(Evidence.storage_location),
                selectinload(Evidence.collected_by_officer).selectinload(Officer.person),
            )
            .where(Evidence.case_id == case_id, Evidence.deleted_at.is_(None))
            .order_by(Evidence.created_at.desc())
        )
        rows = await self.session.scalars(stmt)
        return list(rows.all())

    async def create_evidence(self, data: dict) -> Evidence:
        now = datetime.now(tz=timezone.utc)
        row = Evidence(
            **data,
            created_at=now,
        )
        self.session.add(row)
        await self.session.flush()
        await self.session.refresh(row)
        return row

    async def update_evidence(self, evidence_id: int, data: dict) -> Evidence | None:
        evidence = await self.session.get(Evidence, evidence_id)
        if not evidence or evidence.deleted_at is not None:
            return None
        for key, value in data.items():
            if hasattr(evidence, key):
                setattr(evidence, key, value)
        evidence.updated_at = datetime.now(tz=timezone.utc)
        await self.session.flush()
        await self.session.refresh(evidence)
        return evidence

    async def soft_delete_evidence(self, evidence_id: int) -> Evidence | None:
        evidence = await self.session.get(Evidence, evidence_id)
        if not evidence or evidence.deleted_at is not None:
            return None
        now = datetime.now(tz=timezone.utc)
        evidence.deleted_at = now
        evidence.updated_at = now
        await self.session.flush()
        return evidence

    async def add_case_update(
        self, case_id: int, officer_id: int, update_type: str, description: str
    ) -> None:
        update_row = CaseUpdate(
            case_id=case_id,
            officer_id=officer_id,
            update_type=update_type,
            description=description,
            created_at=datetime.now(tz=timezone.utc),
        )
        self.session.add(update_row)
        await self.session.flush()

    async def add_evidence_history_entries(self, entries: list[EvidenceHistory]) -> None:
        if not entries:
            return
        self.session.add_all(entries)
        await self.session.flush()

    async def get_latest_custody_entry(self, evidence_id: int) -> ChainOfCustody | None:
        stmt = (
            select(ChainOfCustody)
            .where(ChainOfCustody.evidence_id == evidence_id)
            .order_by(ChainOfCustody.created_at.desc())
            .limit(1)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def has_custody_action(self, evidence_id: int, action: str) -> bool:
        stmt = (
            select(func.count())
            .select_from(ChainOfCustody)
            .where(
                ChainOfCustody.evidence_id == evidence_id,
                ChainOfCustody.action == action,
            )
        )
        count = int((await self.session.execute(stmt)).scalar_one() or 0)
        return count > 0

    async def custody_entry_exists(
        self,
        evidence_id: int,
        officer_id: int,
        action: str,
        timestamp: datetime,
    ) -> bool:
        start = timestamp - timedelta(seconds=1)
        end = timestamp + timedelta(seconds=1)
        stmt = (
            select(func.count())
            .select_from(ChainOfCustody)
            .where(
                ChainOfCustody.evidence_id == evidence_id,
                ChainOfCustody.officer_id == officer_id,
                ChainOfCustody.action == action,
                ChainOfCustody.created_at >= start,
                ChainOfCustody.created_at <= end,
            )
        )
        count = int((await self.session.execute(stmt)).scalar_one() or 0)
        return count > 0

    async def add_custody_entry(
        self,
        evidence_id: int,
        officer_id: int,
        action: str,
        transferred_to: int | None = None,
        location_id: int | None = None,
        notes: str | None = None,
        created_at: datetime | None = None,
    ) -> ChainOfCustody:
        entry = ChainOfCustody(
            evidence_id=evidence_id,
            officer_id=officer_id,
            action=action,
            transferred_to=transferred_to,
            location_id=location_id,
            notes=notes,
            created_at=created_at or datetime.now(tz=timezone.utc),
        )
        self.session.add(entry)
        await self.session.flush()
        await self.session.refresh(entry)
        return entry

    async def get_custody_chain(self, evidence_id: int) -> list[ChainOfCustody]:
        from sqlalchemy.orm import joinedload

        stmt = (
            select(ChainOfCustody)
            .options(
                joinedload(ChainOfCustody.officer).joinedload(Officer.person),
                joinedload(ChainOfCustody.transferred_to_officer).joinedload(Officer.person),
                joinedload(ChainOfCustody.location),
            )
            .where(ChainOfCustody.evidence_id == evidence_id)
            .order_by(ChainOfCustody.created_at.asc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_forensic_report(self, evidence_id: int) -> ForensicReport | None:
        stmt = (
            select(ForensicReport)
            .options(selectinload(ForensicReport.officer).selectinload(Officer.person))
            .where(ForensicReport.evidence_id == evidence_id)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def create_forensic_report(self, data: dict) -> ForensicReport:
        report = ForensicReport(
            **data,
            created_at=datetime.now(tz=timezone.utc),
        )
        self.session.add(report)
        await self.session.flush()
        await self.session.refresh(report)
        return report

    async def get_vehicle_by_evidence_id(self, evidence_id: int) -> Vehicle | None:
        result = await self.session.execute(
            select(Vehicle).where(Vehicle.evidence_id == evidence_id)
        )
        return result.scalar_one_or_none()

    async def get_vehicle_by_plate_number(self, plate_number: str) -> Vehicle | None:
        result = await self.session.execute(
            select(Vehicle).where(Vehicle.plate_number == plate_number)
        )
        return result.scalar_one_or_none()

    async def create_vehicle_detail(self, data: dict) -> Vehicle:
        row = Vehicle(**data)
        self.session.add(row)
        await self.session.flush()
        await self.session.refresh(row)
        return row

    async def get_weapon_by_evidence_id(self, evidence_id: int) -> Weapon | None:
        result = await self.session.execute(
            select(Weapon).where(Weapon.evidence_id == evidence_id)
        )
        return result.scalar_one_or_none()

    async def get_weapon_by_serial_number(self, serial_number: str) -> Weapon | None:
        result = await self.session.execute(
            select(Weapon).where(Weapon.serial_number == serial_number)
        )
        return result.scalar_one_or_none()

    async def create_weapon_detail(self, data: dict) -> Weapon:
        row = Weapon(**data)
        self.session.add(row)
        await self.session.flush()
        await self.session.refresh(row)
        return row

    async def list_case_photos(
        self, case_id: int, pagination: PaginationParams
    ) -> tuple[list[CrimeScenePhoto], int]:
        count_stmt = (
            select(func.count())
            .select_from(CrimeScenePhoto)
            .where(CrimeScenePhoto.case_id == case_id, CrimeScenePhoto.deleted_at.is_(None))
        )
        total = int((await self.session.execute(count_stmt)).scalar_one() or 0)
        stmt = (
            select(CrimeScenePhoto)
            .options(selectinload(CrimeScenePhoto.photographer).selectinload(Officer.person))
            .where(CrimeScenePhoto.case_id == case_id, CrimeScenePhoto.deleted_at.is_(None))
            .order_by(CrimeScenePhoto.created_at.desc())
            .offset(pagination.offset)
            .limit(pagination.size)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all()), total

    async def create_case_photo(self, data: dict) -> CrimeScenePhoto:
        row = CrimeScenePhoto(
            **data,
            created_at=datetime.now(tz=timezone.utc),
        )
        self.session.add(row)
        await self.session.flush()
        await self.session.refresh(row)
        return row
