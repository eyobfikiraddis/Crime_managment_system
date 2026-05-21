from __future__ import annotations

from datetime import date

from sqlalchemy import and_, cast, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased
from sqlalchemy.types import Integer

from app.modules.auth.models import Department, Location, Officer, Person
from app.modules.case_management.models import (
    Arrest,
    Case,
    CaseOfficer,
    CasePermission,
    CaseStatus,
    CaseUpdate,
    CrimeType,
    Evidence,
    ForensicReport,
    Report,
)
from app.modules.evidence.models import ChainOfCustody
from app.shared.pagination import PaginationParams


class ReportingRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def officer_in_department(self, officer_id: int, department_id: int) -> bool:
        result = await self.session.execute(
            select(func.count())
            .select_from(Officer)
            .where(
                Officer.officer_id == officer_id,
                Officer.department_id == department_id,
                Officer.deleted_at.is_(None),
            )
        )
        return int(result.scalar_one() or 0) > 0

    def _department_officer_ids_subquery(self, department_id: int):
        return select(Officer.officer_id).where(
            Officer.department_id == department_id,
            Officer.deleted_at.is_(None),
        )

    def _visible_case_condition(self, officer_id: int):
        perm_cases = select(CasePermission.case_id).where(
            CasePermission.officer_id == officer_id,
            CasePermission.revoked_at.is_(None),
        )
        assigned_cases = select(CaseOfficer.case_id).where(
            CaseOfficer.officer_id == officer_id,
            CaseOfficer.active.is_(True),
        )
        return or_(
            Case.lead_officer_id == officer_id,
            Case.case_id.in_(perm_cases),
            Case.case_id.in_(assigned_cases),
        )

    def _visible_case_ids_subquery(self, officer_id: int):
        return select(Case.case_id).where(
            Case.deleted_at.is_(None),
            self._visible_case_condition(officer_id),
        )

    def _department_case_condition(self, department_id: int):
        dept_officers = self._department_officer_ids_subquery(department_id)
        dept_assignments = select(CaseOfficer.case_id).where(
            CaseOfficer.officer_id.in_(dept_officers),
            CaseOfficer.active.is_(True),
        )
        return or_(
            Case.lead_officer_id.in_(dept_officers),
            Case.case_id.in_(dept_assignments),
        )

    def _case_scope_conditions(
        self,
        date_from: date | None,
        date_to: date | None,
        department_id: int | None,
        visible_officer_id: int | None,
        status_id: int | None = None,
        crime_type_id: int | None = None,
    ) -> list:
        conditions = [Case.deleted_at.is_(None)]
        if date_from:
            conditions.append(Case.opened_at >= date_from)
        if date_to:
            conditions.append(Case.opened_at <= date_to)
        if status_id is not None:
            conditions.append(Case.status_id == status_id)
        if crime_type_id is not None:
            conditions.append(Case.crime_type_id == crime_type_id)
        if department_id is not None:
            conditions.append(self._department_case_condition(department_id))
        if visible_officer_id is not None:
            conditions.append(self._visible_case_condition(visible_officer_id))
        return conditions

    def _evidence_case_conditions(
        self,
        date_from: date | None,
        date_to: date | None,
        department_id: int | None,
        case_id: int | None,
        visible_officer_id: int | None,
    ) -> list:
        conditions = [Evidence.deleted_at.is_(None), Case.deleted_at.is_(None)]
        if date_from:
            conditions.append(Evidence.created_at >= date_from)
        if date_to:
            conditions.append(Evidence.created_at <= date_to)
        if case_id is not None:
            conditions.append(Evidence.case_id == case_id)
        if department_id is not None:
            conditions.append(self._department_case_condition(department_id))
        if visible_officer_id is not None:
            visible_cases = self._visible_case_ids_subquery(visible_officer_id)
            conditions.append(Case.case_id.in_(visible_cases))
        return conditions

    async def case_summary(
        self,
        date_from: date | None,
        date_to: date | None,
        department_id: int | None,
        visible_officer_id: int | None,
    ) -> dict:
        conditions = self._case_scope_conditions(
            date_from=date_from,
            date_to=date_to,
            department_id=department_id,
            visible_officer_id=visible_officer_id,
        )
        stmt = (
            select(
                func.coalesce(func.count(Case.case_id), 0).label("total_cases"),
                func.coalesce(
                    func.count(Case.case_id).filter(CaseStatus.status_name == "open"), 0
                ).label("open_cases"),
                func.coalesce(
                    func.count(Case.case_id).filter(CaseStatus.status_name == "closed"), 0
                ).label("closed_cases"),
                func.coalesce(
                    func.count(Case.case_id).filter(CaseStatus.status_name == "archived"),
                    0,
                ).label("archived_cases"),
                func.coalesce(
                    func.count(Case.case_id).filter(
                        CaseStatus.status_name == "under_investigation"
                    ),
                    0,
                ).label("under_investigation_cases"),
                func.coalesce(
                    func.count(Case.case_id).filter(
                        CaseStatus.status_name == "referred_to_court"
                    ),
                    0,
                ).label("referred_to_court_cases"),
            )
            .select_from(Case)
            .join(CaseStatus, Case.status_id == CaseStatus.status_id)
            .where(and_(*conditions))
        )
        result = await self.session.execute(stmt)
        row = result.one()
        return {
            "total_cases": int(row.total_cases or 0),
            "open_cases": int(row.open_cases or 0),
            "closed_cases": int(row.closed_cases or 0),
            "archived_cases": int(row.archived_cases or 0),
            "under_investigation_cases": int(row.under_investigation_cases or 0),
            "referred_to_court_cases": int(row.referred_to_court_cases or 0),
        }

    async def cases_by_status(
        self,
        date_from: date | None,
        date_to: date | None,
        department_id: int | None,
        visible_officer_id: int | None,
        pagination: PaginationParams,
    ) -> tuple[list[dict], int]:
        conditions = self._case_scope_conditions(
            date_from=date_from,
            date_to=date_to,
            department_id=department_id,
            visible_officer_id=visible_officer_id,
        )
        base_stmt = (
            select(
                CaseStatus.status_id,
                CaseStatus.status_name,
                func.count(Case.case_id).label("case_count"),
            )
            .select_from(Case)
            .join(CaseStatus, Case.status_id == CaseStatus.status_id)
            .where(and_(*conditions))
            .group_by(CaseStatus.status_id, CaseStatus.status_name)
        )
        count_stmt = select(func.count()).select_from(base_stmt.subquery())
        total = int((await self.session.execute(count_stmt)).scalar_one() or 0)

        stmt = (
            base_stmt.order_by(CaseStatus.status_name.asc())
            .offset(pagination.offset)
            .limit(pagination.size)
        )
        rows = await self.session.execute(stmt)
        items = [
            {
                "status_id": row.status_id,
                "status_name": row.status_name,
                "case_count": int(row.case_count or 0),
            }
            for row in rows
        ]
        return items, total

    async def cases_by_crime_type(
        self,
        date_from: date | None,
        date_to: date | None,
        department_id: int | None,
        visible_officer_id: int | None,
        pagination: PaginationParams,
    ) -> tuple[list[dict], int]:
        conditions = self._case_scope_conditions(
            date_from=date_from,
            date_to=date_to,
            department_id=department_id,
            visible_officer_id=visible_officer_id,
        )
        base_stmt = (
            select(
                CrimeType.crime_type_id,
                CrimeType.name.label("crime_type_name"),
                func.count(Case.case_id).label("case_count"),
            )
            .select_from(Case)
            .join(CrimeType, Case.crime_type_id == CrimeType.crime_type_id)
            .where(and_(*conditions), CrimeType.deleted_at.is_(None))
            .group_by(CrimeType.crime_type_id, CrimeType.name)
        )
        count_stmt = select(func.count()).select_from(base_stmt.subquery())
        total = int((await self.session.execute(count_stmt)).scalar_one() or 0)

        stmt = (
            base_stmt.order_by(CrimeType.name.asc())
            .offset(pagination.offset)
            .limit(pagination.size)
        )
        rows = await self.session.execute(stmt)
        items = [
            {
                "crime_type_id": row.crime_type_id,
                "crime_type_name": row.crime_type_name,
                "case_count": int(row.case_count or 0),
            }
            for row in rows
        ]
        return items, total

    async def cases_by_department(
        self,
        date_from: date | None,
        date_to: date | None,
        status_id: int | None,
        department_id: int | None,
        pagination: PaginationParams,
    ) -> tuple[list[dict], int]:
        lead_officer = aliased(Officer)
        conditions = [
            Case.deleted_at.is_(None),
            lead_officer.deleted_at.is_(None),
            Department.deleted_at.is_(None),
        ]
        if date_from:
            conditions.append(Case.opened_at >= date_from)
        if date_to:
            conditions.append(Case.opened_at <= date_to)
        if status_id is not None:
            conditions.append(Case.status_id == status_id)
        if department_id is not None:
            conditions.append(Department.department_id == department_id)

        base_stmt = (
            select(
                Department.department_id,
                Department.name.label("department_name"),
                func.count(Case.case_id).label("case_count"),
            )
            .select_from(Case)
            .join(lead_officer, Case.lead_officer_id == lead_officer.officer_id)
            .join(Department, lead_officer.department_id == Department.department_id)
            .where(and_(*conditions))
            .group_by(Department.department_id, Department.name)
        )
        count_stmt = select(func.count()).select_from(base_stmt.subquery())
        total = int((await self.session.execute(count_stmt)).scalar_one() or 0)

        stmt = (
            base_stmt.order_by(Department.name.asc())
            .offset(pagination.offset)
            .limit(pagination.size)
        )
        rows = await self.session.execute(stmt)
        items = [
            {
                "department_id": row.department_id,
                "department_name": row.department_name,
                "case_count": int(row.case_count or 0),
            }
            for row in rows
        ]
        return items, total

    async def cases_monthly(
        self,
        date_from: date | None,
        date_to: date | None,
        department_id: int | None,
        visible_officer_id: int | None,
        pagination: PaginationParams,
    ) -> tuple[list[dict], int]:
        conditions = self._case_scope_conditions(
            date_from=date_from,
            date_to=date_to,
            department_id=department_id,
            visible_officer_id=visible_officer_id,
        )
        year_col = cast(func.extract("year", Case.opened_at), Integer).label("year")
        month_col = cast(func.extract("month", Case.opened_at), Integer).label("month")
        base_stmt = (
            select(
                year_col,
                month_col,
                func.count(Case.case_id).label("case_count"),
            )
            .select_from(Case)
            .where(and_(*conditions))
            .group_by(year_col, month_col)
        )
        count_stmt = select(func.count()).select_from(base_stmt.subquery())
        total = int((await self.session.execute(count_stmt)).scalar_one() or 0)

        stmt = (
            base_stmt.order_by(year_col.asc(), month_col.asc())
            .offset(pagination.offset)
            .limit(pagination.size)
        )
        rows = await self.session.execute(stmt)
        items = [
            {
                "year": int(row.year),
                "month": int(row.month),
                "case_count": int(row.case_count or 0),
            }
            for row in rows
        ]
        return items, total

    async def arrests_summary(
        self,
        date_from: date | None,
        date_to: date | None,
        department_id: int | None,
        officer_id: int | None,
    ) -> dict:
        conditions = [
            Arrest.deleted_at.is_(None),
            Arrest.officer_id.in_(select(Officer.officer_id).where(Officer.deleted_at.is_(None))),
        ]
        if date_from:
            conditions.append(Arrest.date >= date_from)
        if date_to:
            conditions.append(Arrest.date <= date_to)
        if officer_id is not None:
            conditions.append(Arrest.officer_id == officer_id)
        if department_id is not None:
            dept_officers = self._department_officer_ids_subquery(department_id)
            conditions.append(Arrest.officer_id.in_(dept_officers))

        stmt = select(
            func.coalesce(func.count(Arrest.arrest_id), 0).label("total_arrests"),
            func.coalesce(
                func.count(Arrest.arrest_id).filter(Arrest.released_at.is_(None)), 0
            ).label("active_arrests"),
            func.coalesce(
                func.count(Arrest.arrest_id).filter(Arrest.released_at.is_not(None)), 0
            ).label("released_arrests"),
            func.coalesce(
                func.count(Arrest.arrest_id).filter(Arrest.bail_amount.is_not(None)), 0
            ).label("arrests_with_bail"),
        ).where(and_(*conditions))

        result = await self.session.execute(stmt)
        row = result.one()
        return {
            "total_arrests": int(row.total_arrests or 0),
            "active_arrests": int(row.active_arrests or 0),
            "released_arrests": int(row.released_arrests or 0),
            "arrests_with_bail": int(row.arrests_with_bail or 0),
        }

    async def arrests_monthly(
        self,
        date_from: date | None,
        date_to: date | None,
        department_id: int | None,
        pagination: PaginationParams,
    ) -> tuple[list[dict], int]:
        conditions = [
            Arrest.deleted_at.is_(None),
            Arrest.officer_id.in_(select(Officer.officer_id).where(Officer.deleted_at.is_(None))),
        ]
        if date_from:
            conditions.append(Arrest.date >= date_from)
        if date_to:
            conditions.append(Arrest.date <= date_to)
        if department_id is not None:
            dept_officers = self._department_officer_ids_subquery(department_id)
            conditions.append(Arrest.officer_id.in_(dept_officers))

        year_col = cast(func.extract("year", Arrest.date), Integer).label("year")
        month_col = cast(func.extract("month", Arrest.date), Integer).label("month")
        base_stmt = (
            select(year_col, month_col, func.count(Arrest.arrest_id).label("arrest_count"))
            .select_from(Arrest)
            .where(and_(*conditions))
            .group_by(year_col, month_col)
        )
        count_stmt = select(func.count()).select_from(base_stmt.subquery())
        total = int((await self.session.execute(count_stmt)).scalar_one() or 0)

        stmt = (
            base_stmt.order_by(year_col.asc(), month_col.asc())
            .offset(pagination.offset)
            .limit(pagination.size)
        )
        rows = await self.session.execute(stmt)
        items = [
            {
                "year": int(row.year),
                "month": int(row.month),
                "arrest_count": int(row.arrest_count or 0),
            }
            for row in rows
        ]
        return items, total

    async def arrests_by_department(
        self,
        date_from: date | None,
        date_to: date | None,
        department_id: int | None,
        pagination: PaginationParams,
    ) -> tuple[list[dict], int]:
        arresting_officer = aliased(Officer)
        conditions = [
            Arrest.deleted_at.is_(None),
            arresting_officer.deleted_at.is_(None),
            Department.deleted_at.is_(None),
        ]
        if date_from:
            conditions.append(Arrest.date >= date_from)
        if date_to:
            conditions.append(Arrest.date <= date_to)
        if department_id is not None:
            conditions.append(Department.department_id == department_id)

        base_stmt = (
            select(
                Department.department_id,
                Department.name.label("department_name"),
                func.count(Arrest.arrest_id).label("arrest_count"),
            )
            .select_from(Arrest)
            .join(arresting_officer, Arrest.officer_id == arresting_officer.officer_id)
            .join(Department, arresting_officer.department_id == Department.department_id)
            .where(and_(*conditions))
            .group_by(Department.department_id, Department.name)
        )
        count_stmt = select(func.count()).select_from(base_stmt.subquery())
        total = int((await self.session.execute(count_stmt)).scalar_one() or 0)

        stmt = (
            base_stmt.order_by(Department.name.asc())
            .offset(pagination.offset)
            .limit(pagination.size)
        )
        rows = await self.session.execute(stmt)
        items = [
            {
                "department_id": row.department_id,
                "department_name": row.department_name,
                "arrest_count": int(row.arrest_count or 0),
            }
            for row in rows
        ]
        return items, total

    async def evidence_summary(
        self,
        date_from: date | None,
        date_to: date | None,
        department_id: int | None,
        case_id: int | None,
        visible_officer_id: int | None,
    ) -> dict:
        conditions = self._evidence_case_conditions(
            date_from=date_from,
            date_to=date_to,
            department_id=department_id,
            case_id=case_id,
            visible_officer_id=visible_officer_id,
        )

        total_subq = (
            select(func.count(Evidence.evidence_id))
            .select_from(Evidence)
            .join(Case, Evidence.case_id == Case.case_id)
            .where(and_(*conditions))
            .scalar_subquery()
        )
        sensitive_subq = (
            select(func.count(Evidence.evidence_id))
            .select_from(Evidence)
            .join(Case, Evidence.case_id == Case.case_id)
            .where(and_(*conditions), Evidence.is_sensitive.is_(True))
            .scalar_subquery()
        )
        submitted_subq = (
            select(func.count(func.distinct(ChainOfCustody.evidence_id)))
            .select_from(ChainOfCustody)
            .join(Evidence, ChainOfCustody.evidence_id == Evidence.evidence_id)
            .join(Case, Evidence.case_id == Case.case_id)
            .where(and_(*conditions), ChainOfCustody.action == "submitted_to_court")
            .scalar_subquery()
        )
        forensic_subq = (
            select(func.count(ForensicReport.report_id))
            .select_from(ForensicReport)
            .join(Evidence, ForensicReport.evidence_id == Evidence.evidence_id)
            .join(Case, Evidence.case_id == Case.case_id)
            .where(and_(*conditions))
            .scalar_subquery()
        )

        stmt = select(
            func.coalesce(total_subq, 0).label("total_evidence_items"),
            func.coalesce(sensitive_subq, 0).label("sensitive_items"),
            func.coalesce(submitted_subq, 0).label("items_submitted_to_court"),
            func.coalesce(forensic_subq, 0).label("items_with_forensic_reports"),
        )
        result = await self.session.execute(stmt)
        row = result.one()
        return {
            "total_evidence_items": int(row.total_evidence_items or 0),
            "sensitive_items": int(row.sensitive_items or 0),
            "items_submitted_to_court": int(row.items_submitted_to_court or 0),
            "items_with_forensic_reports": int(row.items_with_forensic_reports or 0),
        }

    async def evidence_by_status(
        self,
        date_from: date | None,
        date_to: date | None,
        department_id: int | None,
        visible_officer_id: int | None,
        pagination: PaginationParams,
    ) -> tuple[list[dict], int]:
        latest_ts = (
            select(
                ChainOfCustody.evidence_id,
                func.max(ChainOfCustody.created_at).label("latest_created_at"),
            )
            .group_by(ChainOfCustody.evidence_id)
            .subquery()
        )
        latest_action = (
            select(
                ChainOfCustody.evidence_id,
                ChainOfCustody.action.label("custody_action"),
            )
            .join(
                latest_ts,
                and_(
                    ChainOfCustody.evidence_id == latest_ts.c.evidence_id,
                    ChainOfCustody.created_at == latest_ts.c.latest_created_at,
                ),
            )
            .subquery()
        )

        conditions = self._evidence_case_conditions(
            date_from=date_from,
            date_to=date_to,
            department_id=department_id,
            case_id=None,
            visible_officer_id=visible_officer_id,
        )

        base_stmt = (
            select(
                latest_action.c.custody_action,
                func.count(Evidence.evidence_id).label("item_count"),
            )
            .select_from(latest_action)
            .join(Evidence, latest_action.c.evidence_id == Evidence.evidence_id)
            .join(Case, Evidence.case_id == Case.case_id)
            .where(and_(*conditions))
            .group_by(latest_action.c.custody_action)
        )
        count_stmt = select(func.count()).select_from(base_stmt.subquery())
        total = int((await self.session.execute(count_stmt)).scalar_one() or 0)

        stmt = (
            base_stmt.order_by(latest_action.c.custody_action.asc())
            .offset(pagination.offset)
            .limit(pagination.size)
        )
        rows = await self.session.execute(stmt)
        items = [
            {
                "custody_action": row.custody_action,
                "item_count": int(row.item_count or 0),
            }
            for row in rows
        ]
        return items, total

    async def evidence_storage_utilization(
        self,
        department_id: int | None,
        pagination: PaginationParams,
    ) -> tuple[list[dict], int]:
        conditions = self._evidence_case_conditions(
            date_from=None,
            date_to=None,
            department_id=department_id,
            case_id=None,
            visible_officer_id=None,
        )
        base_stmt = (
            select(
                func.coalesce(Location.name, "unassigned").label("storage_location"),
                func.count(Evidence.evidence_id).label("item_count"),
            )
            .select_from(Evidence)
            .join(Case, Evidence.case_id == Case.case_id)
            .outerjoin(Location, Evidence.storage_location_id == Location.location_id)
            .where(and_(*conditions))
            .group_by(func.coalesce(Location.name, "unassigned"))
        )
        count_stmt = select(func.count()).select_from(base_stmt.subquery())
        total = int((await self.session.execute(count_stmt)).scalar_one() or 0)

        stmt = (
            base_stmt.order_by(func.coalesce(Location.name, "unassigned").asc())
            .offset(pagination.offset)
            .limit(pagination.size)
        )
        rows = await self.session.execute(stmt)
        items = [
            {
                "storage_location": row.storage_location,
                "item_count": int(row.item_count or 0),
            }
            for row in rows
        ]
        return items, total

    async def officer_performance(
        self,
        date_from: date | None,
        date_to: date | None,
        department_id: int | None,
        officer_id: int | None,
        pagination: PaginationParams,
    ) -> tuple[list[dict], int]:
        officer_filters = [Officer.deleted_at.is_(None)]
        if department_id is not None:
            officer_filters.append(Officer.department_id == department_id)
        if officer_id is not None:
            officer_filters.append(Officer.officer_id == officer_id)

        cases_assigned_subq = (
            select(
                CaseOfficer.officer_id,
                func.count(func.distinct(CaseOfficer.case_id)).label("cases_assigned"),
            )
            .select_from(CaseOfficer)
            .join(Case, CaseOfficer.case_id == Case.case_id)
            .where(CaseOfficer.active.is_(True), Case.deleted_at.is_(None))
        )
        if date_from:
            cases_assigned_subq = cases_assigned_subq.where(CaseOfficer.assigned_at >= date_from)
        if date_to:
            cases_assigned_subq = cases_assigned_subq.where(CaseOfficer.assigned_at <= date_to)
        cases_assigned_subq = cases_assigned_subq.group_by(CaseOfficer.officer_id).subquery()

        cases_as_lead_subq = (
            select(
                Case.lead_officer_id.label("officer_id"),
                func.count(Case.case_id).label("cases_as_lead"),
            )
            .where(Case.deleted_at.is_(None), Case.lead_officer_id.is_not(None))
        )
        if date_from:
            cases_as_lead_subq = cases_as_lead_subq.where(Case.opened_at >= date_from)
        if date_to:
            cases_as_lead_subq = cases_as_lead_subq.where(Case.opened_at <= date_to)
        cases_as_lead_subq = cases_as_lead_subq.group_by(Case.lead_officer_id).subquery()

        arrests_subq = (
            select(
                Arrest.officer_id,
                func.count(Arrest.arrest_id).label("arrests_made"),
            )
            .where(Arrest.deleted_at.is_(None))
        )
        if date_from:
            arrests_subq = arrests_subq.where(Arrest.date >= date_from)
        if date_to:
            arrests_subq = arrests_subq.where(Arrest.date <= date_to)
        arrests_subq = arrests_subq.group_by(Arrest.officer_id).subquery()

        evidence_subq = (
            select(
                Evidence.collected_by_officer_id.label("officer_id"),
                func.count(Evidence.evidence_id).label("evidence_collected"),
            )
            .where(Evidence.deleted_at.is_(None), Evidence.collected_by_officer_id.is_not(None))
        )
        if date_from:
            evidence_subq = evidence_subq.where(Evidence.collected_at >= date_from)
        if date_to:
            evidence_subq = evidence_subq.where(Evidence.collected_at <= date_to)
        evidence_subq = evidence_subq.group_by(Evidence.collected_by_officer_id).subquery()

        reports_subq = (
            select(
                Report.officer_id,
                func.count(Report.report_id).label("reports_filed"),
            )
            .where(Report.deleted_at.is_(None))
        )
        if date_from:
            reports_subq = reports_subq.where(Report.created_at >= date_from)
        if date_to:
            reports_subq = reports_subq.where(Report.created_at <= date_to)
        reports_subq = reports_subq.group_by(Report.officer_id).subquery()

        base_stmt = (
            select(
                Officer.officer_id,
                Person.first_name,
                Person.last_name,
                func.coalesce(cases_assigned_subq.c.cases_assigned, 0).label("cases_assigned"),
                func.coalesce(cases_as_lead_subq.c.cases_as_lead, 0).label("cases_as_lead"),
                func.coalesce(arrests_subq.c.arrests_made, 0).label("arrests_made"),
                func.coalesce(evidence_subq.c.evidence_collected, 0).label(
                    "evidence_collected"
                ),
                func.coalesce(reports_subq.c.reports_filed, 0).label("reports_filed"),
            )
            .select_from(Officer)
            .join(Person, Officer.person_id == Person.person_id)
            .outerjoin(cases_assigned_subq, cases_assigned_subq.c.officer_id == Officer.officer_id)
            .outerjoin(cases_as_lead_subq, cases_as_lead_subq.c.officer_id == Officer.officer_id)
            .outerjoin(arrests_subq, arrests_subq.c.officer_id == Officer.officer_id)
            .outerjoin(evidence_subq, evidence_subq.c.officer_id == Officer.officer_id)
            .outerjoin(reports_subq, reports_subq.c.officer_id == Officer.officer_id)
            .where(and_(*officer_filters))
        )
        count_stmt = (
            select(func.count())
            .select_from(Officer)
            .where(and_(*officer_filters))
        )
        total = int((await self.session.execute(count_stmt)).scalar_one() or 0)

        stmt = (
            base_stmt.order_by(Person.last_name.asc(), Person.first_name.asc())
            .offset(pagination.offset)
            .limit(pagination.size)
        )
        rows = await self.session.execute(stmt)
        items = [
            {
                "officer_id": row.officer_id,
                "officer_name": f"{row.first_name} {row.last_name}",
                "cases_assigned": int(row.cases_assigned or 0),
                "cases_as_lead": int(row.cases_as_lead or 0),
                "arrests_made": int(row.arrests_made or 0),
                "evidence_collected": int(row.evidence_collected or 0),
                "reports_filed": int(row.reports_filed or 0),
            }
            for row in rows
        ]
        return items, total

    async def officer_case_load(
        self,
        department_id: int | None,
        pagination: PaginationParams,
    ) -> tuple[list[dict], int]:
        officer_filters = [Officer.deleted_at.is_(None)]
        if department_id is not None:
            officer_filters.append(Officer.department_id == department_id)

        active_cases_subq = (
            select(
                CaseOfficer.officer_id,
                func.count(func.distinct(CaseOfficer.case_id)).label("active_case_count"),
            )
            .select_from(CaseOfficer)
            .join(Case, CaseOfficer.case_id == Case.case_id)
            .join(CaseStatus, Case.status_id == CaseStatus.status_id)
            .where(
                CaseOfficer.active.is_(True),
                Case.deleted_at.is_(None),
                CaseStatus.is_terminal.is_(False),
            )
            .group_by(CaseOfficer.officer_id)
            .subquery()
        )

        lead_cases_subq = (
            select(
                Case.lead_officer_id.label("officer_id"),
                func.count(Case.case_id).label("lead_case_count"),
            )
            .select_from(Case)
            .join(CaseStatus, Case.status_id == CaseStatus.status_id)
            .where(
                Case.deleted_at.is_(None),
                CaseStatus.is_terminal.is_(False),
                Case.lead_officer_id.is_not(None),
            )
            .group_by(Case.lead_officer_id)
            .subquery()
        )

        base_stmt = (
            select(
                Officer.officer_id,
                Person.first_name,
                Person.last_name,
                func.coalesce(active_cases_subq.c.active_case_count, 0).label(
                    "active_case_count"
                ),
                func.coalesce(lead_cases_subq.c.lead_case_count, 0).label(
                    "lead_case_count"
                ),
            )
            .select_from(Officer)
            .join(Person, Officer.person_id == Person.person_id)
            .outerjoin(active_cases_subq, active_cases_subq.c.officer_id == Officer.officer_id)
            .outerjoin(lead_cases_subq, lead_cases_subq.c.officer_id == Officer.officer_id)
            .where(and_(*officer_filters))
        )
        count_stmt = (
            select(func.count()).select_from(Officer).where(and_(*officer_filters))
        )
        total = int((await self.session.execute(count_stmt)).scalar_one() or 0)

        stmt = (
            base_stmt.order_by(Person.last_name.asc(), Person.first_name.asc())
            .offset(pagination.offset)
            .limit(pagination.size)
        )
        rows = await self.session.execute(stmt)
        items = [
            {
                "officer_id": row.officer_id,
                "officer_name": f"{row.first_name} {row.last_name}",
                "active_case_count": int(row.active_case_count or 0),
                "lead_case_count": int(row.lead_case_count or 0),
            }
            for row in rows
        ]
        return items, total

    async def officer_activity(
        self,
        date_from: date | None,
        date_to: date | None,
        department_id: int | None,
        officer_id: int | None,
        pagination: PaginationParams,
    ) -> tuple[list[dict], int]:
        activity_date = func.date(CaseUpdate.created_at).label("activity_date")
        conditions = [
            Case.deleted_at.is_(None),
            Officer.deleted_at.is_(None),
        ]
        if date_from:
            conditions.append(CaseUpdate.created_at >= date_from)
        if date_to:
            conditions.append(CaseUpdate.created_at <= date_to)
        if department_id is not None:
            conditions.append(Officer.department_id == department_id)
        if officer_id is not None:
            conditions.append(Officer.officer_id == officer_id)

        base_stmt = (
            select(
                Officer.officer_id,
                Person.first_name,
                Person.last_name,
                activity_date,
                func.count(CaseUpdate.update_id).label("activity_count"),
            )
            .select_from(CaseUpdate)
            .join(Officer, CaseUpdate.officer_id == Officer.officer_id)
            .join(Person, Officer.person_id == Person.person_id)
            .join(Case, CaseUpdate.case_id == Case.case_id)
            .where(and_(*conditions))
            .group_by(Officer.officer_id, Person.first_name, Person.last_name, activity_date)
        )
        count_stmt = select(func.count()).select_from(base_stmt.subquery())
        total = int((await self.session.execute(count_stmt)).scalar_one() or 0)

        stmt = (
            base_stmt.order_by(activity_date.desc(), Person.last_name.asc())
            .offset(pagination.offset)
            .limit(pagination.size)
        )
        rows = await self.session.execute(stmt)
        items = [
            {
                "officer_id": row.officer_id,
                "officer_name": f"{row.first_name} {row.last_name}",
                "activity_date": row.activity_date,
                "activity_count": int(row.activity_count or 0),
            }
            for row in rows
        ]
        return items, total

    async def dashboard_summary(
        self,
        department_id: int | None,
        visible_officer_id: int | None,
    ) -> dict:
        case_conditions = self._case_scope_conditions(
            date_from=None,
            date_to=None,
            department_id=department_id,
            visible_officer_id=visible_officer_id,
        )
        total_cases_subq = (
            select(func.count(Case.case_id))
            .select_from(Case)
            .where(and_(*case_conditions))
            .scalar_subquery()
        )
        open_cases_subq = (
            select(func.count(Case.case_id))
            .select_from(Case)
            .join(CaseStatus, Case.status_id == CaseStatus.status_id)
            .where(and_(*case_conditions), CaseStatus.status_name == "open")
            .scalar_subquery()
        )
        closed_cases_subq = (
            select(func.count(Case.case_id))
            .select_from(Case)
            .join(CaseStatus, Case.status_id == CaseStatus.status_id)
            .where(and_(*case_conditions), CaseStatus.status_name == "closed")
            .scalar_subquery()
        )
        active_investigations_subq = (
            select(func.count(Case.case_id))
            .select_from(Case)
            .join(CaseStatus, Case.status_id == CaseStatus.status_id)
            .where(and_(*case_conditions), CaseStatus.status_name == "under_investigation")
            .scalar_subquery()
        )

        arrest_conditions = [
            Arrest.deleted_at.is_(None),
            Arrest.officer_id.in_(select(Officer.officer_id).where(Officer.deleted_at.is_(None))),
        ]
        if department_id is not None:
            dept_officers = self._department_officer_ids_subquery(department_id)
            arrest_conditions.append(Arrest.officer_id.in_(dept_officers))
        if visible_officer_id is not None:
            visible_cases = self._visible_case_ids_subquery(visible_officer_id)
            arrest_conditions.append(Arrest.case_id.in_(visible_cases))

        total_arrests_subq = (
            select(func.count(Arrest.arrest_id))
            .select_from(Arrest)
            .where(and_(*arrest_conditions))
            .scalar_subquery()
        )
        active_arrests_subq = (
            select(func.count(Arrest.arrest_id))
            .select_from(Arrest)
            .where(and_(*arrest_conditions), Arrest.released_at.is_(None))
            .scalar_subquery()
        )

        evidence_conditions = self._evidence_case_conditions(
            date_from=None,
            date_to=None,
            department_id=department_id,
            case_id=None,
            visible_officer_id=visible_officer_id,
        )
        total_evidence_subq = (
            select(func.count(Evidence.evidence_id))
            .select_from(Evidence)
            .join(Case, Evidence.case_id == Case.case_id)
            .where(and_(*evidence_conditions))
            .scalar_subquery()
        )
        sensitive_evidence_subq = (
            select(func.count(Evidence.evidence_id))
            .select_from(Evidence)
            .join(Case, Evidence.case_id == Case.case_id)
            .where(and_(*evidence_conditions), Evidence.is_sensitive.is_(True))
            .scalar_subquery()
        )

        stmt = select(
            func.coalesce(total_cases_subq, 0).label("total_cases"),
            func.coalesce(open_cases_subq, 0).label("open_cases"),
            func.coalesce(closed_cases_subq, 0).label("closed_cases"),
            func.coalesce(active_investigations_subq, 0).label("active_investigations"),
            func.coalesce(total_arrests_subq, 0).label("total_arrests"),
            func.coalesce(active_arrests_subq, 0).label("active_arrests"),
            func.coalesce(total_evidence_subq, 0).label("total_evidence_items"),
            func.coalesce(sensitive_evidence_subq, 0).label("sensitive_evidence_items"),
        )
        result = await self.session.execute(stmt)
        row = result.one()
        return {
            "total_cases": int(row.total_cases or 0),
            "open_cases": int(row.open_cases or 0),
            "closed_cases": int(row.closed_cases or 0),
            "active_investigations": int(row.active_investigations or 0),
            "total_arrests": int(row.total_arrests or 0),
            "active_arrests": int(row.active_arrests or 0),
            "total_evidence_items": int(row.total_evidence_items or 0),
            "sensitive_evidence_items": int(row.sensitive_evidence_items or 0),
        }

    async def recent_case_updates(
        self,
        department_id: int | None,
        visible_officer_id: int | None,
        limit: int = 10,
    ) -> list[dict]:
        conditions = [Case.deleted_at.is_(None), Officer.deleted_at.is_(None)]
        if department_id is not None:
            conditions.append(self._department_case_condition(department_id))
        if visible_officer_id is not None:
            conditions.append(self._visible_case_condition(visible_officer_id))

        stmt = (
            select(
                CaseUpdate.update_id,
                CaseUpdate.case_id,
                CaseUpdate.update_type,
                CaseUpdate.description,
                CaseUpdate.created_at,
                Officer.officer_id,
                Person.first_name,
                Person.last_name,
            )
            .select_from(CaseUpdate)
            .join(Officer, CaseUpdate.officer_id == Officer.officer_id)
            .join(Person, Officer.person_id == Person.person_id)
            .join(Case, CaseUpdate.case_id == Case.case_id)
            .where(and_(*conditions))
            .order_by(CaseUpdate.created_at.desc())
            .limit(limit)
        )
        rows = await self.session.execute(stmt)
        return [
            {
                "update_id": row.update_id,
                "case_id": row.case_id,
                "update_type": row.update_type,
                "description": row.description,
                "created_at": row.created_at,
                "officer_id": row.officer_id,
                "officer_name": f"{row.first_name} {row.last_name}",
            }
            for row in rows
        ]

    async def department_statistics(self, department_id: int | None) -> list[dict]:
        dept_officer = aliased(Officer)
        case_counts = (
            select(
                Department.department_id.label("department_id"),
                func.count(Case.case_id).label("case_count"),
            )
            .select_from(Case)
            .join(dept_officer, Case.lead_officer_id == dept_officer.officer_id)
            .join(Department, dept_officer.department_id == Department.department_id)
            .where(
                Case.deleted_at.is_(None),
                dept_officer.deleted_at.is_(None),
                Department.deleted_at.is_(None),
            )
            .group_by(Department.department_id)
            .subquery()
        )
        open_case_counts = (
            select(
                Department.department_id.label("department_id"),
                func.count(Case.case_id).label("open_case_count"),
            )
            .select_from(Case)
            .join(CaseStatus, Case.status_id == CaseStatus.status_id)
            .join(dept_officer, Case.lead_officer_id == dept_officer.officer_id)
            .join(Department, dept_officer.department_id == Department.department_id)
            .where(
                Case.deleted_at.is_(None),
                CaseStatus.is_terminal.is_(False),
                dept_officer.deleted_at.is_(None),
                Department.deleted_at.is_(None),
            )
            .group_by(Department.department_id)
            .subquery()
        )
        officer_counts = (
            select(
                Department.department_id.label("department_id"),
                func.count(Officer.officer_id).label("officer_count"),
            )
            .select_from(Department)
            .join(Officer, Officer.department_id == Department.department_id)
            .where(
                Officer.deleted_at.is_(None),
                Officer.is_active.is_(True),
                Department.deleted_at.is_(None),
            )
            .group_by(Department.department_id)
            .subquery()
        )

        stmt = (
            select(
                Department.department_id,
                Department.name.label("department_name"),
                func.coalesce(case_counts.c.case_count, 0).label("case_count"),
                func.coalesce(open_case_counts.c.open_case_count, 0).label(
                    "open_case_count"
                ),
                func.coalesce(officer_counts.c.officer_count, 0).label("officer_count"),
            )
            .select_from(Department)
            .outerjoin(case_counts, case_counts.c.department_id == Department.department_id)
            .outerjoin(
                open_case_counts, open_case_counts.c.department_id == Department.department_id
            )
            .outerjoin(officer_counts, officer_counts.c.department_id == Department.department_id)
            .where(Department.deleted_at.is_(None))
        )
        if department_id is not None:
            stmt = stmt.where(Department.department_id == department_id)

        rows = await self.session.execute(stmt)
        return [
            {
                "department_id": row.department_id,
                "department_name": row.department_name,
                "case_count": int(row.case_count or 0),
                "open_case_count": int(row.open_case_count or 0),
                "officer_count": int(row.officer_count or 0),
            }
            for row in rows
        ]
