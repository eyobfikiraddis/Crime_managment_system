from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.modules.auth.dependencies import get_current_officer
from app.modules.auth.schemas.responses import CurrentOfficerContext
from app.modules.personnel.schemas.requests import (
    CreateOfficerRequest,
    CreatePersonRequest,
    CreateSuspectRequest,
    CreateVictimRequest,
    CreateWitnessRequest,
    UpdateOfficerRequest,
    UpdatePersonRequest,
)
from app.modules.personnel.schemas.responses import (
    ArrestSummaryResponse,
    CaseSummaryResponse,
    ChargeSummaryResponse,
    OfficerHistoryEntryResponse,
    OfficerResponse,
    PersonResponse,
    SuspectDetailResponse,
    SuspectListItemResponse,
    SuspectResponse,
    VictimResponse,
    WitnessResponse,
)
from app.modules.personnel.service import CiviliansService, OfficerService, PersonService
from app.shared.enums import RiskLevelEnum
from app.shared.pagination import PaginatedResponse
from app.shared.response_schemas import MessageResponse

router = APIRouter(prefix="/personnel", tags=["Personnel"])


@router.post("/persons", response_model=PersonResponse, status_code=201)
async def create_person(
    body: CreatePersonRequest,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> PersonResponse:
    service = PersonService(session)
    return await service.create_person(requester=current_officer, body=body)


@router.get("/persons", response_model=PaginatedResponse[PersonResponse], status_code=200)
async def list_persons(
    search: str | None = Query(default=None, max_length=200),
    active_only: bool = Query(default=True),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> PaginatedResponse[PersonResponse]:
    service = PersonService(session)
    return await service.list_persons(
        requester=current_officer,
        search=search,
        active_only=active_only,
        page=page,
        size=size,
    )


@router.get("/persons/{person_id}", response_model=PersonResponse, status_code=200)
async def get_person(
    person_id: int,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> PersonResponse:
    service = PersonService(session)
    return await service.get_person(requester=current_officer, person_id=person_id)


@router.patch("/persons/{person_id}", response_model=PersonResponse, status_code=200)
async def update_person(
    person_id: int,
    body: UpdatePersonRequest,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> PersonResponse:
    service = PersonService(session)
    return await service.update_person(
        requester=current_officer, person_id=person_id, body=body
    )


@router.delete("/persons/{person_id}", response_model=MessageResponse, status_code=200)
async def delete_person(
    person_id: int,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> MessageResponse:
    service = PersonService(session)
    return await service.delete_person(requester=current_officer, person_id=person_id)


@router.post("/officers", response_model=OfficerResponse, status_code=201)
async def create_officer(
    body: CreateOfficerRequest,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> OfficerResponse:
    service = OfficerService(session)
    return await service.create_officer(requester=current_officer, body=body)


@router.get("/officers", response_model=PaginatedResponse[OfficerResponse], status_code=200)
async def list_officers(
    department_id: int | None = Query(default=None),
    role_id: int | None = Query(default=None),
    search: str | None = Query(default=None, max_length=200),
    active_only: bool = Query(default=True),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> PaginatedResponse[OfficerResponse]:
    service = OfficerService(session)
    return await service.list_officers(
        requester=current_officer,
        department_id=department_id,
        role_id=role_id,
        search=search,
        active_only=active_only,
        page=page,
        size=size,
    )


@router.get("/officers/{officer_id}", response_model=OfficerResponse, status_code=200)
async def get_officer(
    officer_id: int,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> OfficerResponse:
    service = OfficerService(session)
    return await service.get_officer(requester=current_officer, officer_id=officer_id)


@router.patch("/officers/{officer_id}", response_model=OfficerResponse, status_code=200)
async def update_officer(
    officer_id: int,
    body: UpdateOfficerRequest,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> OfficerResponse:
    service = OfficerService(session)
    return await service.update_officer(
        requester=current_officer, officer_id=officer_id, body=body
    )


@router.delete("/officers/{officer_id}", response_model=MessageResponse, status_code=200)
async def delete_officer(
    officer_id: int,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> MessageResponse:
    service = OfficerService(session)
    return await service.delete_officer(requester=current_officer, officer_id=officer_id)


@router.get(
    "/officers/{officer_id}/history",
    response_model=PaginatedResponse[OfficerHistoryEntryResponse],
    status_code=200,
)
async def get_officer_history(
    officer_id: int,
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> PaginatedResponse[OfficerHistoryEntryResponse]:
    service = CiviliansService(session)
    return await service.get_officer_history(
        requester=current_officer, officer_id=officer_id, page=page, size=size
    )


@router.post("/persons/{person_id}/suspect", response_model=SuspectResponse, status_code=201)
async def promote_person_to_suspect(
    person_id: int,
    body: CreateSuspectRequest,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> SuspectResponse:
    service = CiviliansService(session)
    return await service.promote_to_suspect(
        requester=current_officer, person_id=person_id, body=body
    )


@router.delete("/persons/{person_id}/suspect", response_model=MessageResponse, status_code=200)
async def deactivate_person_as_suspect(
    person_id: int,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> MessageResponse:
    service = CiviliansService(session)
    return await service.deactivate_suspect(requester=current_officer, person_id=person_id)


@router.get("/suspects", response_model=PaginatedResponse[SuspectListItemResponse], status_code=200)
async def list_suspects(
    risk_level: RiskLevelEnum | None = Query(default=None),
    include_deleted: bool = Query(default=False),
    involved_in_case_id: int | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> PaginatedResponse[SuspectListItemResponse]:
    service = CiviliansService(session)
    return await service.list_suspects(
        requester=current_officer,
        risk_level=risk_level,
        include_deleted=include_deleted,
        involved_in_case_id=involved_in_case_id,
        page=page,
        size=size,
    )


@router.get("/suspects/{suspect_id}", response_model=SuspectDetailResponse, status_code=200)
async def get_suspect_detail(
    suspect_id: int,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> SuspectDetailResponse:
    service = CiviliansService(session)
    return await service.get_suspect_detail(
        requester=current_officer, suspect_id=suspect_id
    )


@router.get(
    "/suspects/{suspect_id}/cases",
    response_model=PaginatedResponse[CaseSummaryResponse],
    status_code=200,
)
async def get_suspect_cases(
    suspect_id: int,
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> PaginatedResponse[CaseSummaryResponse]:
    service = CiviliansService(session)
    return await service.get_suspect_cases(
        requester=current_officer, suspect_id=suspect_id, page=page, size=size
    )


@router.get(
    "/suspects/{suspect_id}/arrests",
    response_model=PaginatedResponse[ArrestSummaryResponse],
    status_code=200,
)
async def get_suspect_arrests(
    suspect_id: int,
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> PaginatedResponse[ArrestSummaryResponse]:
    service = CiviliansService(session)
    return await service.get_suspect_arrests(
        requester=current_officer, suspect_id=suspect_id, page=page, size=size
    )


@router.get(
    "/suspects/{suspect_id}/charges",
    response_model=PaginatedResponse[ChargeSummaryResponse],
    status_code=200,
)
async def get_suspect_charges(
    suspect_id: int,
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> PaginatedResponse[ChargeSummaryResponse]:
    service = CiviliansService(session)
    return await service.get_suspect_charges(
        requester=current_officer, suspect_id=suspect_id, page=page, size=size
    )


@router.post("/persons/{person_id}/victim", response_model=VictimResponse, status_code=201)
async def promote_person_to_victim(
    person_id: int,
    body: CreateVictimRequest,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> VictimResponse:
    service = CiviliansService(session)
    return await service.promote_to_victim(
        requester=current_officer, person_id=person_id, body=body
    )


@router.delete("/persons/{person_id}/victim", response_model=MessageResponse, status_code=200)
async def deactivate_person_as_victim(
    person_id: int,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> MessageResponse:
    service = CiviliansService(session)
    return await service.deactivate_victim(requester=current_officer, person_id=person_id)


@router.post("/persons/{person_id}/witness", response_model=WitnessResponse, status_code=201)
async def promote_person_to_witness(
    person_id: int,
    body: CreateWitnessRequest,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> WitnessResponse:
    service = CiviliansService(session)
    return await service.promote_to_witness(
        requester=current_officer, person_id=person_id, body=body
    )


@router.delete("/persons/{person_id}/witness", response_model=MessageResponse, status_code=200)
async def deactivate_person_as_witness(
    person_id: int,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> MessageResponse:
    service = CiviliansService(session)
    return await service.deactivate_witness(requester=current_officer, person_id=person_id)
