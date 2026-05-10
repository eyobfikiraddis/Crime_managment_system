from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.modules.auth.dependencies import get_current_officer
from app.modules.auth.schemas.responses import CurrentOfficerContext
from app.modules.personnel.schemas.requests import CreateOfficerRequest, CreatePersonRequest, UpdateOfficerRequest, UpdatePersonRequest
from app.modules.personnel.schemas.responses import OfficerResponse, PersonResponse
from app.modules.personnel.service import OfficerService, PersonService
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
