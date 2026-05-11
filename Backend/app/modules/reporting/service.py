from __future__ import annotations

from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.schemas.responses import CurrentOfficerContext
from app.modules.reporting.exceptions import InvalidDateRangeError, ReportAccessDeniedError
from app.modules.reporting.repository import ReportingRepository
from app.modules.reporting.schemas.requests import (
    ArrestDepartmentFilters,
    ArrestMonthlyFilters,
    ArrestSummaryFilters,
    CaseCrimeTypeFilters,
    CaseDepartmentFilters,
    CaseMonthlyFilters,
    CaseStatusFilters,
    CaseSummaryFilters,
    EvidenceStatusFilters,
    EvidenceStorageFilters,
    EvidenceSummaryFilters,
    OfficerActivityFilters,
    OfficerCaseLoadFilters,
    OfficerPerformanceFilters,
)
from app.modules.reporting.schemas.responses import (
    ArrestDepartmentCountResponse,
    ArrestMonthlyCountResponse,
    ArrestSummaryResponse,
    CaseCrimeTypeCountResponse,
    CaseDepartmentCountResponse,
    CaseMonthlyCountResponse,
    CaseStatusCountResponse,
    CaseSummaryResponse,
    DashboardResponse,
    DepartmentStatisticsResponse,
    EvidenceStatusCountResponse,
    EvidenceStorageUtilizationResponse,
    EvidenceSummaryResponse,
    OfficerActivityResponse,
    OfficerCaseLoadResponse,
    OfficerPerformanceResponse,
    RecentActivityResponse,
)
from app.shared.enums import RoleNameEnum
from app.shared.pagination import PaginatedResponse, PaginationParams


class ReportingService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = ReportingRepository(session)

    def _validate_date_range(self, date_from: date | None, date_to: date | None) -> None:
        if date_from and date_to and date_from > date_to:
            raise InvalidDateRangeError()

    def _is_admin(self, requester: CurrentOfficerContext) -> bool:
        return requester.role_name in {
            RoleNameEnum.admin.value,
            RoleNameEnum.superadmin.value,
        }

    def _is_department_head(self, requester: CurrentOfficerContext) -> bool:
        return requester.role_name == RoleNameEnum.department_head.value

    def _is_investigator(self, requester: CurrentOfficerContext) -> bool:
        return requester.role_name == RoleNameEnum.investigator.value

    def _is_forensic(self, requester: CurrentOfficerContext) -> bool:
        return requester.role_name == RoleNameEnum.forensic.value

    def _deny_readonly_or_legal(self, requester: CurrentOfficerContext) -> None:
        if requester.role_name in {
            RoleNameEnum.readonly.value,
            RoleNameEnum.legal_officer.value,
        }:
            raise ReportAccessDeniedError()

    async def _enforce_officer_scope(
        self, requester: CurrentOfficerContext, officer_id: int | None
    ) -> int | None:
        if officer_id is None:
            return None
        if self._is_investigator(requester):
            if officer_id != requester.officer_id:
                raise ReportAccessDeniedError()
            return officer_id
        if self._is_department_head(requester):
            if requester.department_id is None:
                raise ReportAccessDeniedError()
            if not await self.repo.officer_in_department(officer_id, requester.department_id):
                raise ReportAccessDeniedError()
        return officer_id

    def _department_scope(
        self, requester: CurrentOfficerContext, department_id: int | None
    ) -> int | None:
        if self._is_department_head(requester):
            return requester.department_id
        return department_id

    async def get_case_summary(
        self, requester: CurrentOfficerContext, filters: CaseSummaryFilters
    ) -> CaseSummaryResponse:
        self._deny_readonly_or_legal(requester)
        if self._is_forensic(requester) or self._is_investigator(requester):
            raise ReportAccessDeniedError()
        self._validate_date_range(filters.date_from, filters.date_to)

        department_id = self._department_scope(requester, filters.department_id)
        data = await self.repo.case_summary(
            date_from=filters.date_from,
            date_to=filters.date_to,
            department_id=department_id,
            visible_officer_id=None,
        )
        return CaseSummaryResponse(**data)

    async def get_cases_by_status(
        self,
        requester: CurrentOfficerContext,
        filters: CaseStatusFilters,
        page: int,
        size: int,
    ) -> PaginatedResponse[CaseStatusCountResponse]:
        self._deny_readonly_or_legal(requester)
        if self._is_forensic(requester) or self._is_investigator(requester):
            raise ReportAccessDeniedError()
        self._validate_date_range(filters.date_from, filters.date_to)

        department_id = self._department_scope(requester, filters.department_id)
        pagination = PaginationParams(page=page, size=size)
        items, total = await self.repo.cases_by_status(
            date_from=filters.date_from,
            date_to=filters.date_to,
            department_id=department_id,
            visible_officer_id=None,
            pagination=pagination,
        )
        responses = [CaseStatusCountResponse(**item) for item in items]
        return PaginatedResponse(items=responses, total=total, page=page, size=size)

    async def get_cases_by_crime_type(
        self,
        requester: CurrentOfficerContext,
        filters: CaseCrimeTypeFilters,
        page: int,
        size: int,
    ) -> PaginatedResponse[CaseCrimeTypeCountResponse]:
        self._deny_readonly_or_legal(requester)
        if self._is_forensic(requester) or self._is_investigator(requester):
            raise ReportAccessDeniedError()
        self._validate_date_range(filters.date_from, filters.date_to)

        department_id = self._department_scope(requester, filters.department_id)
        pagination = PaginationParams(page=page, size=size)
        items, total = await self.repo.cases_by_crime_type(
            date_from=filters.date_from,
            date_to=filters.date_to,
            department_id=department_id,
            visible_officer_id=None,
            pagination=pagination,
        )
        responses = [CaseCrimeTypeCountResponse(**item) for item in items]
        return PaginatedResponse(items=responses, total=total, page=page, size=size)

    async def get_cases_by_department(
        self,
        requester: CurrentOfficerContext,
        filters: CaseDepartmentFilters,
        page: int,
        size: int,
    ) -> PaginatedResponse[CaseDepartmentCountResponse]:
        self._deny_readonly_or_legal(requester)
        if self._is_forensic(requester) or self._is_investigator(requester):
            raise ReportAccessDeniedError()
        self._validate_date_range(filters.date_from, filters.date_to)

        department_id = self._department_scope(requester, None)
        pagination = PaginationParams(page=page, size=size)
        items, total = await self.repo.cases_by_department(
            date_from=filters.date_from,
            date_to=filters.date_to,
            status_id=filters.status_id,
            department_id=department_id,
            pagination=pagination,
        )
        responses = [CaseDepartmentCountResponse(**item) for item in items]
        return PaginatedResponse(items=responses, total=total, page=page, size=size)

    async def get_cases_monthly(
        self,
        requester: CurrentOfficerContext,
        filters: CaseMonthlyFilters,
        page: int,
        size: int,
    ) -> PaginatedResponse[CaseMonthlyCountResponse]:
        self._deny_readonly_or_legal(requester)
        if self._is_forensic(requester) or self._is_investigator(requester):
            raise ReportAccessDeniedError()
        self._validate_date_range(filters.date_from, filters.date_to)

        department_id = self._department_scope(requester, filters.department_id)
        pagination = PaginationParams(page=page, size=size)
        items, total = await self.repo.cases_monthly(
            date_from=filters.date_from,
            date_to=filters.date_to,
            department_id=department_id,
            visible_officer_id=None,
            pagination=pagination,
        )
        responses = [CaseMonthlyCountResponse(**item) for item in items]
        return PaginatedResponse(items=responses, total=total, page=page, size=size)

    async def get_arrests_summary(
        self, requester: CurrentOfficerContext, filters: ArrestSummaryFilters
    ) -> ArrestSummaryResponse:
        self._deny_readonly_or_legal(requester)
        if self._is_forensic(requester) or self._is_investigator(requester):
            raise ReportAccessDeniedError()
        self._validate_date_range(filters.date_from, filters.date_to)

        department_id = self._department_scope(requester, filters.department_id)
        officer_id = await self._enforce_officer_scope(requester, filters.officer_id)
        data = await self.repo.arrests_summary(
            date_from=filters.date_from,
            date_to=filters.date_to,
            department_id=department_id,
            officer_id=officer_id,
        )
        return ArrestSummaryResponse(**data)

    async def get_arrests_monthly(
        self,
        requester: CurrentOfficerContext,
        filters: ArrestMonthlyFilters,
        page: int,
        size: int,
    ) -> PaginatedResponse[ArrestMonthlyCountResponse]:
        self._deny_readonly_or_legal(requester)
        if self._is_forensic(requester) or self._is_investigator(requester):
            raise ReportAccessDeniedError()
        self._validate_date_range(filters.date_from, filters.date_to)

        department_id = self._department_scope(requester, filters.department_id)
        pagination = PaginationParams(page=page, size=size)
        items, total = await self.repo.arrests_monthly(
            date_from=filters.date_from,
            date_to=filters.date_to,
            department_id=department_id,
            pagination=pagination,
        )
        responses = [ArrestMonthlyCountResponse(**item) for item in items]
        return PaginatedResponse(items=responses, total=total, page=page, size=size)

    async def get_arrests_by_department(
        self,
        requester: CurrentOfficerContext,
        filters: ArrestDepartmentFilters,
        page: int,
        size: int,
    ) -> PaginatedResponse[ArrestDepartmentCountResponse]:
        self._deny_readonly_or_legal(requester)
        if self._is_forensic(requester) or self._is_investigator(requester):
            raise ReportAccessDeniedError()
        self._validate_date_range(filters.date_from, filters.date_to)

        department_id = self._department_scope(requester, None)
        pagination = PaginationParams(page=page, size=size)
        items, total = await self.repo.arrests_by_department(
            date_from=filters.date_from,
            date_to=filters.date_to,
            department_id=department_id,
            pagination=pagination,
        )
        responses = [ArrestDepartmentCountResponse(**item) for item in items]
        return PaginatedResponse(items=responses, total=total, page=page, size=size)

    async def get_evidence_summary(
        self, requester: CurrentOfficerContext, filters: EvidenceSummaryFilters
    ) -> EvidenceSummaryResponse:
        self._deny_readonly_or_legal(requester)
        self._validate_date_range(filters.date_from, filters.date_to)

        if self._is_investigator(requester):
            raise ReportAccessDeniedError()
        visible_officer_id = requester.officer_id if self._is_forensic(requester) else None
        department_id = None
        if self._is_department_head(requester) or self._is_admin(requester):
            department_id = self._department_scope(requester, filters.department_id)

        data = await self.repo.evidence_summary(
            date_from=filters.date_from,
            date_to=filters.date_to,
            department_id=department_id,
            case_id=filters.case_id,
            visible_officer_id=visible_officer_id,
        )
        return EvidenceSummaryResponse(**data)

    async def get_evidence_by_status(
        self,
        requester: CurrentOfficerContext,
        filters: EvidenceStatusFilters,
        page: int,
        size: int,
    ) -> PaginatedResponse[EvidenceStatusCountResponse]:
        self._deny_readonly_or_legal(requester)
        self._validate_date_range(filters.date_from, filters.date_to)

        if self._is_investigator(requester):
            raise ReportAccessDeniedError()
        visible_officer_id = requester.officer_id if self._is_forensic(requester) else None
        department_id = None
        if self._is_department_head(requester) or self._is_admin(requester):
            department_id = self._department_scope(requester, filters.department_id)

        pagination = PaginationParams(page=page, size=size)
        items, total = await self.repo.evidence_by_status(
            date_from=filters.date_from,
            date_to=filters.date_to,
            department_id=department_id,
            visible_officer_id=visible_officer_id,
            pagination=pagination,
        )
        responses = [EvidenceStatusCountResponse(**item) for item in items]
        return PaginatedResponse(items=responses, total=total, page=page, size=size)

    async def get_evidence_storage_utilization(
        self,
        requester: CurrentOfficerContext,
        filters: EvidenceStorageFilters,
        page: int,
        size: int,
    ) -> PaginatedResponse[EvidenceStorageUtilizationResponse]:
        self._deny_readonly_or_legal(requester)
        if self._is_forensic(requester) or self._is_investigator(requester):
            raise ReportAccessDeniedError()

        department_id = self._department_scope(requester, filters.department_id)
        pagination = PaginationParams(page=page, size=size)
        items, total = await self.repo.evidence_storage_utilization(
            department_id=department_id,
            pagination=pagination,
        )
        responses = [EvidenceStorageUtilizationResponse(**item) for item in items]
        return PaginatedResponse(items=responses, total=total, page=page, size=size)

    async def get_officer_performance(
        self,
        requester: CurrentOfficerContext,
        filters: OfficerPerformanceFilters,
        page: int,
        size: int,
    ) -> PaginatedResponse[OfficerPerformanceResponse]:
        self._deny_readonly_or_legal(requester)
        self._validate_date_range(filters.date_from, filters.date_to)

        if self._is_forensic(requester):
            raise ReportAccessDeniedError()

        department_id = None
        officer_id = filters.officer_id

        if self._is_investigator(requester):
            if officer_id is not None and officer_id != requester.officer_id:
                raise ReportAccessDeniedError()
            officer_id = requester.officer_id
        elif self._is_department_head(requester):
            department_id = requester.department_id
            officer_id = await self._enforce_officer_scope(requester, officer_id)
        elif self._is_admin(requester):
            department_id = filters.department_id
            officer_id = await self._enforce_officer_scope(requester, officer_id)
        else:
            raise ReportAccessDeniedError()

        pagination = PaginationParams(page=page, size=size)
        items, total = await self.repo.officer_performance(
            date_from=filters.date_from,
            date_to=filters.date_to,
            department_id=department_id,
            officer_id=officer_id,
            pagination=pagination,
        )
        responses = [OfficerPerformanceResponse(**item) for item in items]
        return PaginatedResponse(items=responses, total=total, page=page, size=size)

    async def get_officer_case_load(
        self,
        requester: CurrentOfficerContext,
        filters: OfficerCaseLoadFilters,
        page: int,
        size: int,
    ) -> PaginatedResponse[OfficerCaseLoadResponse]:
        self._deny_readonly_or_legal(requester)
        if self._is_forensic(requester) or self._is_investigator(requester):
            raise ReportAccessDeniedError()

        department_id = self._department_scope(requester, filters.department_id)
        pagination = PaginationParams(page=page, size=size)
        items, total = await self.repo.officer_case_load(
            department_id=department_id,
            pagination=pagination,
        )
        responses = [OfficerCaseLoadResponse(**item) for item in items]
        return PaginatedResponse(items=responses, total=total, page=page, size=size)

    async def get_officer_activity(
        self,
        requester: CurrentOfficerContext,
        filters: OfficerActivityFilters,
        page: int,
        size: int,
    ) -> PaginatedResponse[OfficerActivityResponse]:
        self._deny_readonly_or_legal(requester)
        if self._is_forensic(requester) or self._is_investigator(requester):
            raise ReportAccessDeniedError()
        self._validate_date_range(filters.date_from, filters.date_to)

        department_id = self._department_scope(requester, filters.department_id)
        officer_id = await self._enforce_officer_scope(requester, filters.officer_id)
        pagination = PaginationParams(page=page, size=size)
        items, total = await self.repo.officer_activity(
            date_from=filters.date_from,
            date_to=filters.date_to,
            department_id=department_id,
            officer_id=officer_id,
            pagination=pagination,
        )
        responses = [OfficerActivityResponse(**item) for item in items]
        return PaginatedResponse(items=responses, total=total, page=page, size=size)

    async def get_dashboard(self, requester: CurrentOfficerContext) -> DashboardResponse:
        self._deny_readonly_or_legal(requester)
        if self._is_forensic(requester):
            raise ReportAccessDeniedError()

        department_id = None
        visible_officer_id = None
        if self._is_investigator(requester):
            visible_officer_id = requester.officer_id
        elif self._is_department_head(requester):
            department_id = requester.department_id
        elif self._is_admin(requester):
            department_id = None
        else:
            raise ReportAccessDeniedError()

        summary = await self.repo.dashboard_summary(
            department_id=department_id,
            visible_officer_id=visible_officer_id,
        )
        recent_updates = await self.repo.recent_case_updates(
            department_id=department_id,
            visible_officer_id=visible_officer_id,
            limit=10,
        )
        department_stats: list[DepartmentStatisticsResponse] = []
        if not self._is_investigator(requester):
            dept_rows = await self.repo.department_statistics(department_id)
            department_stats = [DepartmentStatisticsResponse(**row) for row in dept_rows]

        recent = [RecentActivityResponse(**row) for row in recent_updates]
        return DashboardResponse(
            **summary,
            recent_activities=recent,
            department_statistics=department_stats,
        )
