from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.modules.auth.dependencies import get_current_officer
from app.modules.auth.schemas.responses import CurrentOfficerContext
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
    EvidenceStatusCountResponse,
    EvidenceStorageUtilizationResponse,
    EvidenceSummaryResponse,
    OfficerActivityResponse,
    OfficerCaseLoadResponse,
    OfficerPerformanceResponse,
)
from app.modules.reporting.service import ReportingService
from app.shared.pagination import PaginatedResponse

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/cases/summary", response_model=CaseSummaryResponse, status_code=200)
async def case_summary(
    filters: CaseSummaryFilters = Depends(),
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> CaseSummaryResponse:
    service = ReportingService(session)
    return await service.get_case_summary(requester=current_officer, filters=filters)


@router.get(
    "/cases/by-status",
    response_model=PaginatedResponse[CaseStatusCountResponse],
    status_code=200,
)
async def cases_by_status(
    filters: CaseStatusFilters = Depends(),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> PaginatedResponse[CaseStatusCountResponse]:
    service = ReportingService(session)
    return await service.get_cases_by_status(
        requester=current_officer,
        filters=filters,
        page=page,
        size=size,
    )


@router.get(
    "/cases/by-crime-type",
    response_model=PaginatedResponse[CaseCrimeTypeCountResponse],
    status_code=200,
)
async def cases_by_crime_type(
    filters: CaseCrimeTypeFilters = Depends(),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> PaginatedResponse[CaseCrimeTypeCountResponse]:
    service = ReportingService(session)
    return await service.get_cases_by_crime_type(
        requester=current_officer,
        filters=filters,
        page=page,
        size=size,
    )


@router.get(
    "/cases/by-department",
    response_model=PaginatedResponse[CaseDepartmentCountResponse],
    status_code=200,
)
async def cases_by_department(
    filters: CaseDepartmentFilters = Depends(),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> PaginatedResponse[CaseDepartmentCountResponse]:
    service = ReportingService(session)
    return await service.get_cases_by_department(
        requester=current_officer,
        filters=filters,
        page=page,
        size=size,
    )


@router.get(
    "/cases/monthly",
    response_model=PaginatedResponse[CaseMonthlyCountResponse],
    status_code=200,
)
async def cases_monthly(
    filters: CaseMonthlyFilters = Depends(),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=24, ge=1, le=100),
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> PaginatedResponse[CaseMonthlyCountResponse]:
    service = ReportingService(session)
    return await service.get_cases_monthly(
        requester=current_officer,
        filters=filters,
        page=page,
        size=size,
    )


@router.get("/arrests/summary", response_model=ArrestSummaryResponse, status_code=200)
async def arrests_summary(
    filters: ArrestSummaryFilters = Depends(),
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> ArrestSummaryResponse:
    service = ReportingService(session)
    return await service.get_arrests_summary(requester=current_officer, filters=filters)


@router.get(
    "/arrests/monthly",
    response_model=PaginatedResponse[ArrestMonthlyCountResponse],
    status_code=200,
)
async def arrests_monthly(
    filters: ArrestMonthlyFilters = Depends(),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> PaginatedResponse[ArrestMonthlyCountResponse]:
    service = ReportingService(session)
    return await service.get_arrests_monthly(
        requester=current_officer,
        filters=filters,
        page=page,
        size=size,
    )


@router.get(
    "/arrests/by-department",
    response_model=PaginatedResponse[ArrestDepartmentCountResponse],
    status_code=200,
)
async def arrests_by_department(
    filters: ArrestDepartmentFilters = Depends(),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> PaginatedResponse[ArrestDepartmentCountResponse]:
    service = ReportingService(session)
    return await service.get_arrests_by_department(
        requester=current_officer,
        filters=filters,
        page=page,
        size=size,
    )


@router.get(
    "/evidence/summary",
    response_model=EvidenceSummaryResponse,
    status_code=200,
)
async def evidence_summary(
    filters: EvidenceSummaryFilters = Depends(),
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> EvidenceSummaryResponse:
    service = ReportingService(session)
    return await service.get_evidence_summary(requester=current_officer, filters=filters)


@router.get(
    "/evidence/by-status",
    response_model=PaginatedResponse[EvidenceStatusCountResponse],
    status_code=200,
)
async def evidence_by_status(
    filters: EvidenceStatusFilters = Depends(),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> PaginatedResponse[EvidenceStatusCountResponse]:
    service = ReportingService(session)
    return await service.get_evidence_by_status(
        requester=current_officer,
        filters=filters,
        page=page,
        size=size,
    )


@router.get(
    "/evidence/storage-utilization",
    response_model=PaginatedResponse[EvidenceStorageUtilizationResponse],
    status_code=200,
)
async def evidence_storage_utilization(
    filters: EvidenceStorageFilters = Depends(),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> PaginatedResponse[EvidenceStorageUtilizationResponse]:
    service = ReportingService(session)
    return await service.get_evidence_storage_utilization(
        requester=current_officer,
        filters=filters,
        page=page,
        size=size,
    )


@router.get(
    "/officers/performance",
    response_model=PaginatedResponse[OfficerPerformanceResponse],
    status_code=200,
)
async def officer_performance(
    filters: OfficerPerformanceFilters = Depends(),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> PaginatedResponse[OfficerPerformanceResponse]:
    service = ReportingService(session)
    return await service.get_officer_performance(
        requester=current_officer,
        filters=filters,
        page=page,
        size=size,
    )


@router.get(
    "/officers/case-load",
    response_model=PaginatedResponse[OfficerCaseLoadResponse],
    status_code=200,
)
async def officer_case_load(
    filters: OfficerCaseLoadFilters = Depends(),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> PaginatedResponse[OfficerCaseLoadResponse]:
    service = ReportingService(session)
    return await service.get_officer_case_load(
        requester=current_officer,
        filters=filters,
        page=page,
        size=size,
    )


@router.get(
    "/officers/activity",
    response_model=PaginatedResponse[OfficerActivityResponse],
    status_code=200,
)
async def officer_activity(
    filters: OfficerActivityFilters = Depends(),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> PaginatedResponse[OfficerActivityResponse]:
    service = ReportingService(session)
    return await service.get_officer_activity(
        requester=current_officer,
        filters=filters,
        page=page,
        size=size,
    )


@router.get("/dashboard", response_model=DashboardResponse, status_code=200)
async def dashboard(
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> DashboardResponse:
    service = ReportingService(session)
    return await service.get_dashboard(requester=current_officer)
