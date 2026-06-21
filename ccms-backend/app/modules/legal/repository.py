from __future__ import annotations

from app.modules.personnel.models import Suspect
from app.modules.auth.schemas.responses import CurrentOfficerContext

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
        from app.modules.personnel.models import Suspect
        query = (
            select(Charge)
            .options(
                selectinload(Charge.sentence_record),
                selectinload(Charge.crime_type),
                selectinload(Charge.suspect).selectinload(Suspect.person),
                selectinload(Charge.person),
            )
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

    async def list_court_cases(
        self,
        officer: CurrentOfficerContext,
        search: Optional[str] = None,
        status: Optional[list[str]] = None,
        date_from: Optional[date_type] = None,
        date_to: Optional[date_type] = None,
        page: int = 1,
        size: int = 25,
        sort_field: str = "filedAt",
        sort_direction: str = "desc",
    ) -> tuple[list[CourtCase], int]:
        from sqlalchemy import or_, and_, select, func
        from sqlalchemy.orm import selectinload
        from app.modules.case_management.models import Case, CaseOfficer, CasePermission, CourtCase, Charge
        from app.modules.auth.models import Officer
        from app.shared.enums import RoleNameEnum, VerdictEnum

        # Base query
        query = select(CourtCase).join(Case).where(CourtCase.deleted_at.is_(None))

        # Visibility Rules
        if officer.role_name not in (
            RoleNameEnum.legal_officer.value,
            RoleNameEnum.admin.value,
            RoleNameEnum.superadmin.value,
        ):
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
            query = query.where(cond)

        # Filters: search
        if search:
            search_pattern = f"%{search}%"
            query = query.where(
                or_(
                    CourtCase.court_name.ilike(search_pattern),
                    CourtCase.court_reference.ilike(search_pattern),
                    CourtCase.judge_name.ilike(search_pattern),
                    CourtCase.prosecutor_name.ilike(search_pattern),
                    Case.title.ilike(search_pattern),
                    Case.case_number.ilike(search_pattern),
                )
            )

        # Filters: date range
        if date_from:
            query = query.where(CourtCase.created_at >= datetime.combine(date_from, datetime.min.time(), tzinfo=timezone.utc))
        if date_to:
            query = query.where(CourtCase.created_at <= datetime.combine(date_to, datetime.max.time(), tzinfo=timezone.utc))

        # Filters: status
        if status:
            status_conditions = []
            for st in status:
                st_upper = st.upper()
                if st_upper == "PENDING":
                    status_conditions.append(
                        and_(
                            or_(CourtCase.verdict.is_(None), CourtCase.verdict == VerdictEnum.pending),
                            CourtCase.hearing_date.is_(None),
                            CourtCase.closed_at.is_(None),
                        )
                    )
                elif st_upper == "ACTIVE":
                    status_conditions.append(
                        and_(
                            or_(CourtCase.verdict.is_(None), CourtCase.verdict == VerdictEnum.pending),
                            CourtCase.hearing_date.is_not(None),
                            CourtCase.closed_at.is_(None),
                        )
                    )
                elif st_upper == "CONCLUDED":
                    status_conditions.append(
                        and_(
                            CourtCase.closed_at.is_not(None),
                            CourtCase.verdict != VerdictEnum.dismissed,
                        )
                    )
                elif st_upper == "DISMISSED":
                    status_conditions.append(
                        and_(
                            CourtCase.closed_at.is_not(None),
                            CourtCase.verdict == VerdictEnum.dismissed,
                        )
                    )
            if status_conditions:
                query = query.where(or_(*status_conditions))

        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total = int((await self.session.execute(count_query)).scalar_one() or 0)

        # Sorting
        sort_attr = CourtCase.created_at
        if sort_field == "courtCaseNumber":
            sort_attr = CourtCase.court_reference
        elif sort_field == "filedAt":
            sort_attr = CourtCase.created_at

        if sort_direction.lower() == "desc":
            query = query.order_by(sort_attr.desc(), CourtCase.court_case_id.desc())
        else:
            query = query.order_by(sort_attr.asc(), CourtCase.court_case_id.asc())

        # Pagination and loading options
        query = query.offset((page - 1) * size).limit(size)
        query = query.options(
            selectinload(CourtCase.charges).selectinload(Charge.sentence_record),
            selectinload(CourtCase.charges).selectinload(Charge.crime_type),
            selectinload(CourtCase.charges).selectinload(Charge.suspect).selectinload(Suspect.person),
            selectinload(CourtCase.charges).selectinload(Charge.person),
        )

        result = await self.session.execute(query)
        court_cases = list(result.scalars().all())
        return court_cases, total

    async def list_charges_by_court_case(
        self,
        court_case_id: int,
        search: Optional[str] = None,
        statuses: Optional[list[str]] = None,
        page: int = 1,
        size: int = 25,
        sort_field: str = "filedAt",
        sort_direction: str = "desc",
    ) -> tuple[list[Charge], int]:
        from sqlalchemy import or_, and_, select, func
        from sqlalchemy.orm import selectinload
        from app.modules.case_management.models import Charge
        from app.modules.personnel.models import Suspect, Person

        query = select(Charge).where(
            Charge.court_case_id == court_case_id,
            Charge.deleted_at.is_(None)
        )

        # Search filter
        if search:
            search_pattern = f"%{search}%"
            query = query.join(Suspect, Charge.suspect_id == Suspect.suspect_id).join(Person, Suspect.person_id == Person.person_id)
            query = query.where(
                or_(
                    Person.first_name.ilike(search_pattern),
                    Person.last_name.ilike(search_pattern),
                    Charge.description.ilike(search_pattern),
                )
            )

        # Status filter
        if statuses:
            from app.shared.enums import ChargeStatusEnum
            status_enums = []
            for s in statuses:
                try:
                    status_enums.append(ChargeStatusEnum(s.lower()))
                except ValueError:
                    pass
            if status_enums:
                query = query.where(Charge.charge_status.in_(status_enums))

        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total = int((await self.session.execute(count_query)).scalar_one() or 0)

        # Sorting
        sort_attr = Charge.filed_at
        if sort_field == "filedAt":
            sort_attr = Charge.filed_at
        elif sort_field == "status":
            sort_attr = Charge.charge_status

        if sort_direction.lower() == "desc":
            query = query.order_by(sort_attr.desc(), Charge.charge_id.desc())
        else:
            query = query.order_by(sort_attr.asc(), Charge.charge_id.asc())

        # Pagination and loading options
        query = query.offset((page - 1) * size).limit(size)
        query = query.options(
            selectinload(Charge.sentence_record),
            selectinload(Charge.crime_type),
            selectinload(Charge.suspect).selectinload(Suspect.person),
            selectinload(Charge.person),
        )

        result = await self.session.execute(query)
        charges = list(result.scalars().all())
        return charges, total
