from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.modules.auth.dependencies import get_current_officer
from app.modules.auth.schemas.responses import CurrentOfficerContext
from app.modules.departments.schemas.requests import AssignDepartmentHeadRequest, CreateDepartmentRequest, UpdateDepartmentRequest
from app.modules.departments.schemas.responses import DepartmentListItemResponse, DepartmentResponse
from app.modules.departments.service import DepartmentService
from app.shared.pagination import PaginatedResponse
from app.shared.response_schemas import MessageResponse

router = APIRouter(prefix="/departments", tags=["Departments"])


@router.post("/", response_model=DepartmentResponse, status_code=201)
async def create_department(
    body: CreateDepartmentRequest,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> DepartmentResponse:
    service = DepartmentService(session)
    return await service.create_department(requester=current_officer, body=body)


@router.get(
    "/",
    response_model=PaginatedResponse[DepartmentListItemResponse],
    status_code=200,
)
async def list_departments(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> PaginatedResponse[DepartmentListItemResponse]:
    service = DepartmentService(session)
    return await service.list_departments(page=page, size=size)


@router.get("/{department_id}", response_model=DepartmentResponse, status_code=200)
async def get_department(
    department_id: int,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> DepartmentResponse:
    service = DepartmentService(session)
    return await service.get_department(department_id=department_id)


@router.patch("/{department_id}", response_model=DepartmentResponse, status_code=200)
async def update_department(
    department_id: int,
    body: UpdateDepartmentRequest,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> DepartmentResponse:
    service = DepartmentService(session)
    return await service.update_department(
        requester=current_officer, department_id=department_id, body=body
    )


@router.delete("/{department_id}", response_model=MessageResponse, status_code=200)
async def delete_department(
    department_id: int,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> MessageResponse:
    service = DepartmentService(session)
    return await service.delete_department(
        requester=current_officer, department_id=department_id
    )


@router.post(
    "/{department_id}/assign-head",
    response_model=DepartmentResponse,
    status_code=200,
)
async def assign_department_head(
    department_id: int,
    body: AssignDepartmentHeadRequest,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> DepartmentResponse:
    service = DepartmentService(session)
    return await service.assign_department_head(
        requester=current_officer, department_id=department_id, body=body
    )
