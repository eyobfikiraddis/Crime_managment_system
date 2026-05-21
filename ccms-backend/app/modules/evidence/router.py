from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.modules.auth.dependencies import get_current_officer
from app.modules.auth.schemas.responses import CurrentOfficerContext
from app.modules.evidence.schemas.requests import (
    CrimeScenePhotoCreateRequest,
    CustodyEntryCreateRequest,
    EvidenceCreateRequest,
    EvidenceUpdateRequest,
    ForensicReportCreateRequest,
    VehicleDetailCreateRequest,
    WeaponDetailCreateRequest,
)
from app.modules.evidence.schemas.responses import (
    CrimeScenePhotoResponse,
    CustodyChainResponse,
    CustodyEntryResponse,
    EvidenceDetailResponse,
    EvidenceResponse,
    ForensicReportResponse,
    VehicleDetailResponse,
    WeaponDetailResponse,
)
from app.modules.evidence.service import EvidenceService
from app.shared.pagination import PaginatedResponse

router = APIRouter(tags=["Evidence"])


@router.post("/cases/{case_id}/evidence", response_model=EvidenceResponse, status_code=201)
async def create_evidence(
    case_id: int,
    body: EvidenceCreateRequest,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> EvidenceResponse:
    service = EvidenceService(session)
    return await service.create_evidence(
        case_id=case_id,
        request_data=body,
        requesting_officer=current_officer,
    )


@router.get("/cases/{case_id}/evidence", response_model=list[EvidenceResponse], status_code=200)
async def list_case_evidence(
    case_id: int,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> list[EvidenceResponse]:
    service = EvidenceService(session)
    return await service.list_case_evidence_flat(
        case_id=case_id,
        requesting_officer=current_officer,
    )


@router.put(
    "/cases/{case_id}/evidence/{evidence_id}",
    response_model=EvidenceResponse,
    status_code=200,
)
async def update_case_evidence(
    case_id: int,
    evidence_id: int,
    body: EvidenceUpdateRequest,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> EvidenceResponse:
    service = EvidenceService(session)
    return await service.update_case_evidence(
        case_id=case_id,
        evidence_id=evidence_id,
        request_data=body,
        requesting_officer=current_officer,
    )


@router.post(
    "/cases/{case_id}/evidence/{evidence_id}/chain",
    response_model=CustodyEntryResponse,
    status_code=201,
)
async def append_custody_event(
    case_id: int,
    evidence_id: int,
    body: CustodyEntryCreateRequest,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> CustodyEntryResponse:
    service = EvidenceService(session)
    return await service.add_custody_event(
        evidence_id=evidence_id,
        request_data=body,
        requesting_officer=current_officer,
        case_id=case_id,
    )


@router.get(
    "/cases/{case_id}/evidence/{evidence_id}/chain",
    response_model=list[CustodyEntryResponse],
    status_code=200,
)
async def get_full_chain(
    case_id: int,
    evidence_id: int,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> list[CustodyEntryResponse]:
    service = EvidenceService(session)
    return await service.get_full_custody_chain(
        evidence_id=evidence_id,
        requesting_officer=current_officer,
        case_id=case_id,
    )


@router.get("/evidence/{evidence_id}", response_model=EvidenceDetailResponse, status_code=200)
async def get_evidence_detail(
    evidence_id: int,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> EvidenceDetailResponse:
    service = EvidenceService(session)
    return await service.get_evidence_detail(
        evidence_id=evidence_id,
        requesting_officer=current_officer,
    )


@router.patch("/evidence/{evidence_id}", response_model=EvidenceResponse, status_code=200)
async def update_evidence(
    evidence_id: int,
    body: EvidenceUpdateRequest,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> EvidenceResponse:
    service = EvidenceService(session)
    return await service.update_evidence(
        evidence_id=evidence_id,
        request_data=body,
        requesting_officer=current_officer,
    )


@router.delete("/evidence/{evidence_id}", status_code=204)
async def delete_evidence(
    evidence_id: int,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> None:
    service = EvidenceService(session)
    await service.delete_evidence(
        evidence_id=evidence_id,
        requesting_officer=current_officer,
    )


@router.post(
    "/evidence/{evidence_id}/vehicle",
    response_model=VehicleDetailResponse,
    status_code=201,
)
async def create_vehicle_detail(
    evidence_id: int,
    body: VehicleDetailCreateRequest,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> VehicleDetailResponse:
    service = EvidenceService(session)
    return await service.create_vehicle_detail(
        evidence_id=evidence_id,
        request_data=body,
        requesting_officer=current_officer,
    )


@router.post(
    "/evidence/{evidence_id}/weapon",
    response_model=WeaponDetailResponse,
    status_code=201,
)
async def create_weapon_detail(
    evidence_id: int,
    body: WeaponDetailCreateRequest,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> WeaponDetailResponse:
    service = EvidenceService(session)
    return await service.create_weapon_detail(
        evidence_id=evidence_id,
        request_data=body,
        requesting_officer=current_officer,
    )


@router.get(
    "/evidence/{evidence_id}/custody",
    response_model=CustodyChainResponse,
    status_code=200,
)
async def get_evidence_custody_chain(
    evidence_id: int,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> CustodyChainResponse:
    service = EvidenceService(session)
    return await service.get_custody_chain_response(
        evidence_id=evidence_id,
        requesting_officer=current_officer,
    )


@router.post(
    "/evidence/{evidence_id}/custody",
    response_model=CustodyEntryResponse,
    status_code=201,
)
async def add_evidence_custody_event(
    evidence_id: int,
    body: CustodyEntryCreateRequest,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> CustodyEntryResponse:
    service = EvidenceService(session)
    return await service.add_custody_event(
        evidence_id=evidence_id,
        request_data=body,
        requesting_officer=current_officer,
    )


@router.post(
    "/evidence/{evidence_id}/forensic-report",
    response_model=ForensicReportResponse,
    status_code=201,
)
async def create_forensic_report(
    evidence_id: int,
    body: ForensicReportCreateRequest,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> ForensicReportResponse:
    service = EvidenceService(session)
    return await service.create_forensic_report(
        evidence_id=evidence_id,
        request_data=body,
        requesting_officer=current_officer,
    )


@router.get(
    "/evidence/{evidence_id}/forensic-report",
    response_model=ForensicReportResponse,
    status_code=200,
)
async def get_forensic_report(
    evidence_id: int,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> ForensicReportResponse:
    service = EvidenceService(session)
    return await service.get_forensic_report(
        evidence_id=evidence_id,
        requesting_officer=current_officer,
    )


@router.get(
    "/cases/{case_id}/photos",
    response_model=PaginatedResponse[CrimeScenePhotoResponse],
    status_code=200,
)
async def list_case_photos(
    case_id: int,
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> PaginatedResponse[CrimeScenePhotoResponse]:
    service = EvidenceService(session)
    return await service.list_case_photos(
        case_id=case_id,
        requesting_officer=current_officer,
        page=page,
        size=size,
    )


@router.post(
    "/cases/{case_id}/photos",
    response_model=CrimeScenePhotoResponse,
    status_code=201,
)
async def create_case_photo(
    case_id: int,
    body: CrimeScenePhotoCreateRequest,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> CrimeScenePhotoResponse:
    service = EvidenceService(session)
    return await service.create_case_photo(
        case_id=case_id,
        request_data=body,
        requesting_officer=current_officer,
    )
