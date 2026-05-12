from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.modules.auth.dependencies import get_current_officer
from app.modules.auth.schemas.responses import CurrentOfficerContext
from app.modules.interrogation.schemas.requests import InterrogationCreateRequest
from app.modules.interrogation.schemas.responses import InterrogationResponse
from app.modules.interrogation.service import InterrogationService
from app.shared.pagination import PaginatedResponse

router = APIRouter(prefix="/cases/{case_id}/interrogations", tags=["Investigation"])


@router.post(
    "",
    response_model=InterrogationResponse,
    status_code=201,
    summary="Record a formal interrogation",
)
async def create_interrogation(
    case_id: int,
    body: InterrogationCreateRequest,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> InterrogationResponse:
    service = InterrogationService(session)
    return await service.create_interrogation(
        case_id=case_id,
        requester=current_officer,
        body=body,
    )


@router.get(
    "",
    response_model=PaginatedResponse[InterrogationResponse],
    status_code=200,
    summary="List interrogations for a case",
)
async def list_interrogations(
    case_id: int,
    suspect_id: int | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> PaginatedResponse[InterrogationResponse]:
    service = InterrogationService(session)
    return await service.list_interrogations(
        case_id=case_id,
        requester=current_officer,
        suspect_id_filter=suspect_id,
        page=page,
        size=size,
    )
