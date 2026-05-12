from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.modules.arrest.schemas.requests import ArrestCreateRequest, ArrestUpdateRequest
from app.modules.arrest.schemas.responses import ArrestResponse
from app.modules.arrest.service import ArrestService
from app.modules.auth.dependencies import get_current_officer
from app.modules.auth.schemas.responses import CurrentOfficerContext
from app.shared.pagination import PaginatedResponse

arrests_router = APIRouter(prefix="/arrests", tags=["Investigation"])
case_arrests_router = APIRouter(prefix="/cases/{case_id}/arrests", tags=["Investigation"])


@arrests_router.post("", response_model=ArrestResponse, status_code=201, summary="Record a new arrest")
async def create_arrest(
    body: ArrestCreateRequest,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> ArrestResponse:
    service = ArrestService(session)
    return await service.create_arrest(current_officer, body)


@arrests_router.get(
    "/{arrest_id}",
    response_model=ArrestResponse,
    status_code=200,
    summary="Get a single arrest by ID",
)
async def get_arrest(
    arrest_id: int,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> ArrestResponse:
    service = ArrestService(session)
    return await service.get_arrest(arrest_id, current_officer)


@arrests_router.patch(
    "/{arrest_id}",
    response_model=ArrestResponse,
    status_code=200,
    summary="Update mutable arrest fields",
)
async def update_arrest(
    arrest_id: int,
    body: ArrestUpdateRequest,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> ArrestResponse:
    service = ArrestService(session)
    return await service.update_arrest(arrest_id, current_officer, body)


@arrests_router.delete(
    "/{arrest_id}",
    status_code=204,
    summary="Soft-delete an arrest",
)
async def delete_arrest(
    arrest_id: int,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> None:
    service = ArrestService(session)
    await service.delete_arrest(arrest_id, current_officer)


@case_arrests_router.get(
    "",
    response_model=PaginatedResponse[ArrestResponse],
    status_code=200,
    summary="List arrests for a case",
)
async def list_case_arrests(
    case_id: int,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> PaginatedResponse[ArrestResponse]:
    service = ArrestService(session)
    return await service.list_arrests_for_case(case_id, current_officer, page, size)
