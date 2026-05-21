from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.modules.auth.dependencies import get_current_officer
from app.modules.auth.schemas.responses import CurrentOfficerContext
from app.schemas.legal_schemas import (
    CourtCaseCreateRequest,
    CourtCasePatchRequest,
    CourtCaseResponse,
    ChargePatchRequest,
    ChargeResponse,
    SentenceCreateRequest,
    SentenceResponse,
)
from Crime_managment_system.Backend.app.modules.legal.service import LegalService

court_cases_router = APIRouter(prefix="/cases/{case_id}", tags=["Legal"])
charges_router = APIRouter(prefix="/cases/{case_id}", tags=["Legal"])
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
