from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.modules.auth.dependencies import get_current_officer
from app.modules.auth.schemas.responses import CurrentOfficerContext
from app.modules.legal.schemas.schemas import (
    CourtCaseCreateRequest,
    CourtCasePatchRequest,
    CourtCaseResponse,
    ChargePatchRequest,
    ChargeResponse,
    SentenceCreateRequest,
    SentenceResponse,
)
from app.modules.legal.service import LegalService
from app.shared.pagination import PaginatedResponse

court_cases_router = APIRouter(prefix="/cases/{case_id}", tags=["Legal"])
court_case_list_router = APIRouter(prefix="/court-case", tags=["Legal"])
court_case_patch_router = APIRouter(prefix="/court-cases", tags=["Legal"])
standalone_charges_router = APIRouter(prefix="/charges", tags=["Legal"])


@court_cases_router.post(
    "/court-case",
    response_model=CourtCaseResponse,
    status_code=201,
    summary="Open a formal court proceeding for a case",
)
async def create_court_case(
    case_id: int,
    data: CourtCaseCreateRequest,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> CourtCaseResponse:
    service = LegalService(session)
    return await service.create_court_case(case_id, current_officer, data)


@court_cases_router.get(
    "/court-case",
    response_model=CourtCaseResponse,
    status_code=200,
    summary="Get the court case for a case including all charges",
)
async def get_court_case(
    case_id: int,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> CourtCaseResponse:
    service = LegalService(session)
    return await service.get_court_case(case_id, current_officer)


@court_case_patch_router.patch(
    "/{court_case_id}",
    response_model=CourtCaseResponse,
    status_code=200,
    summary="Update court case - record verdict, update hearing date",
)
async def patch_court_case(
    court_case_id: int,
    data: CourtCasePatchRequest,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> CourtCaseResponse:
    service = LegalService(session)
    return await service.patch_court_case(court_case_id, current_officer, data)


@standalone_charges_router.patch(
    "/{charge_id}",
    response_model=ChargeResponse,
    status_code=200,
    summary="Update the status of a charge",
)
async def patch_charge(
    charge_id: int,
    data: ChargePatchRequest,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> ChargeResponse:
    service = LegalService(session)
    return await service.patch_charge(charge_id, current_officer, data)


@standalone_charges_router.delete(
    "/{charge_id}",
    response_model=ChargeResponse,
    status_code=200,
    summary="Drop a charge in 'filed' status",
)
async def drop_charge(
    charge_id: int,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> ChargeResponse:
    service = LegalService(session)
    return await service.drop_charge(charge_id, current_officer)


@standalone_charges_router.post(
    "/{charge_id}/sentence",
    response_model=SentenceResponse,
    status_code=201,
    summary="Record a sentence for a convicted charge",
)
async def create_sentence(
    charge_id: int,
    data: SentenceCreateRequest,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> SentenceResponse:
    service = LegalService(session)
    return await service.create_sentence(charge_id, current_officer, data)


@standalone_charges_router.get(
    "/{charge_id}/sentence",
    response_model=SentenceResponse,
    status_code=200,
    summary="Get the sentence for a specific charge",
)
async def get_sentence(
    charge_id: int,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> SentenceResponse:
    service = LegalService(session)
    return await service.get_sentence(charge_id, current_officer)


@court_case_list_router.get(
    "",
    response_model=PaginatedResponse[CourtCaseResponse],
    status_code=200,
    summary="List and search court cases with pagination",
)
async def list_court_cases(
    search: str | None = Query(default=None),
    status: str | None = Query(default=None),
    dateFrom: str | None = Query(default=None),
    dateTo: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    pageSize: int = Query(default=20, ge=1, le=100),
    sortField: str = Query(default="filedAt"),
    sortDirection: str = Query(default="desc"),
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> PaginatedResponse[CourtCaseResponse]:
    from datetime import datetime
    date_from_val = None
    date_to_val = None
    if dateFrom:
        try:
            date_from_val = datetime.strptime(dateFrom, "%Y-%m-%d").date()
        except ValueError:
            pass
    if dateTo:
        try:
            date_to_val = datetime.strptime(dateTo, "%Y-%m-%d").date()
        except ValueError:
            pass

    status_list = None
    if status:
        status_list = [s.strip() for s in status.split(",") if s.strip()]

    service = LegalService(session)
    court_cases, total = await service.list_court_cases(
        requester=current_officer,
        search=search,
        status=status_list,
        date_from=date_from_val,
        date_to=date_to_val,
        page=page,
        size=pageSize,
        sort_field=sortField,
        sort_direction=sortDirection,
    )
    return PaginatedResponse(
        items=court_cases,
        total=total,
        page=page,
        size=pageSize,
    )


@court_case_list_router.get(
    "/{court_case_id}/charges",
    response_model=PaginatedResponse[ChargeResponse],
    status_code=200,
    summary="List charges associated with a specific court case",
)
async def list_court_case_charges(
    court_case_id: int,
    search: str | None = Query(default=None),
    status: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    pageSize: int = Query(default=20, ge=1, le=100),
    sortField: str = Query(default="filedAt"),
    sortDirection: str = Query(default="desc"),
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> PaginatedResponse[ChargeResponse]:
    status_list = None
    if status:
        status_list = [s.strip() for s in status.split(",") if s.strip()]

    service = LegalService(session)
    charges, total = await service.list_court_case_charges(
        requester=current_officer,
        court_case_id=court_case_id,
        search=search,
        status=status_list,
        page=page,
        size=pageSize,
        sort_field=sortField,
        sort_direction=sortDirection,
    )
    return PaginatedResponse(
        items=charges,
        total=total,
        page=page,
        size=pageSize,
    )
