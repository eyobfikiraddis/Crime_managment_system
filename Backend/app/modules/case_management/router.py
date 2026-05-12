from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

from app.core.database import get_db_session
from app.modules.auth.dependencies import get_current_officer
from app.modules.auth.schemas.responses import CurrentOfficerContext
from app.modules.case_management.schemas.requests import CreateCaseRequest, CaseUpdateRequest, CaseStatusUpdateRequest, CaseAssignmentCreate, CasePersonLinkRequest, ChargeCreateRequest, ChargeUpdateRequest, ChargeStatusUpdateRequest, ArrestCreateRequest, ArrestUpdateRequest, CaseNoteCreateRequest, CaseNoteUpdateRequest
from app.modules.case_management.schemas.responses import CaseDetailResponse, CaseListItemResponse, CaseOfficerTinyResponse, CaseSuspectResponse, CaseVictimResponse, CaseWitnessResponse, ChargeResponse, ArrestResponse, CaseNoteResponse, CaseTimelineResponse, FullCaseDetailResponse
from app.modules.case_management.service import CaseService
from app.shared.pagination import PaginatedResponse

router = APIRouter(prefix="/cases", tags=["Cases"])


@router.get("/", response_model=PaginatedResponse[CaseListItemResponse], status_code=200)
async def list_cases(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> PaginatedResponse[CaseListItemResponse]:
    service = CaseService(session)
    return await service.list_cases(requester=current_officer, page=page, size=size)


@router.get("/search", response_model=PaginatedResponse[CaseListItemResponse], status_code=200)
async def search_cases(
    q: str | None = Query(default=None),
    case_number: str | None = Query(default=None),
    suspect_name: str | None = Query(default=None),
    officer_id: int | None = Query(default=None),
    department_id: int | None = Query(default=None),
    crime_type_id: int | None = Query(default=None),
    status_id: int | None = Query(default=None),
    severity: str | None = Query(default=None),
    date_from: datetime | None = Query(default=None),
    date_to: datetime | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    sort_by: str = Query(default="created_at"),
    sort_order: str = Query(default="desc"),
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> PaginatedResponse[CaseListItemResponse]:
    service = CaseService(session)
    filters = {
        "q": q,
        "case_number": case_number,
        "suspect_name": suspect_name,
        "officer_id": officer_id,
        "department_id": department_id,
        "crime_type_id": crime_type_id,
        "status_id": status_id,
        "severity": severity,
        "date_from": date_from,
        "date_to": date_to,
    }
    return await service.search_cases(
        requester=current_officer, 
        filters=filters, 
        page=page, 
        size=size, 
        sort_by=sort_by, 
        sort_order=sort_order
    )



@router.get("/{case_id}", response_model=CaseDetailResponse, status_code=200)
async def get_case(
    case_id: int,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> CaseDetailResponse:
    service = CaseService(session)
    return await service.get_case(requester=current_officer, case_id=case_id)


@router.post("/", response_model=CaseDetailResponse, status_code=201)
async def create_case(
    body: CreateCaseRequest,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> CaseDetailResponse:
    service = CaseService(session)
    return await service.create_case(requester=current_officer, body=body)


@router.put("/{case_id}", response_model=CaseDetailResponse, status_code=200)
async def update_case(
    case_id: int,
    body: CaseUpdateRequest,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> CaseDetailResponse:
    service = CaseService(session)
    return await service.update_case(requester=current_officer, case_id=case_id, body=body)


@router.patch("/{case_id}/status", response_model=CaseDetailResponse, status_code=200)
async def update_case_status(
    case_id: int,
    body: CaseStatusUpdateRequest,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> CaseDetailResponse:
    service = CaseService(session)
    return await service.update_case_status(requester=current_officer, case_id=case_id, body=body)


@router.delete("/{case_id}", status_code=204)
async def soft_delete_case(
    case_id: int,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> None:
    service = CaseService(session)
    await service.soft_delete_case(requester=current_officer, case_id=case_id)


@router.post("/{case_id}/officers", response_model=list[CaseOfficerTinyResponse], status_code=201)
async def assign_officer(
    case_id: int,
    body: CaseAssignmentCreate,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> list[CaseOfficerTinyResponse]:
    service = CaseService(session)
    return await service.assign_officer(requester=current_officer, case_id=case_id, body=body)


@router.get("/{case_id}/officers", response_model=list[CaseOfficerTinyResponse], status_code=200)
async def list_assignments(
    case_id: int,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> list[CaseOfficerTinyResponse]:
    service = CaseService(session)
    return await service.list_assignments(requester=current_officer, case_id=case_id)


@router.delete("/{case_id}/officers/{officer_id}", status_code=204)
async def remove_assignment(
    case_id: int,
    officer_id: int,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> None:
    service = CaseService(session)
    await service.remove_assignment(requester=current_officer, case_id=case_id, officer_id=officer_id)


# --- Suspects ---
@router.post("/{case_id}/suspects/{suspect_id}", response_model=CaseSuspectResponse, status_code=201)
async def add_case_suspect(
    case_id: int,
    suspect_id: int,
    body: CasePersonLinkRequest,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> CaseSuspectResponse:
    service = CaseService(session)
    return await service.add_case_suspect(requester=current_officer, case_id=case_id, suspect_id=suspect_id, body=body)

@router.get("/{case_id}/suspects", response_model=list[CaseSuspectResponse], status_code=200)
async def list_case_suspects(
    case_id: int,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> list[CaseSuspectResponse]:
    service = CaseService(session)
    return await service.list_case_suspects(requester=current_officer, case_id=case_id)

@router.delete("/{case_id}/suspects/{suspect_id}", status_code=204)
async def remove_case_suspect(
    case_id: int,
    suspect_id: int,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> None:
    service = CaseService(session)
    await service.remove_case_suspect(requester=current_officer, case_id=case_id, suspect_id=suspect_id)

# --- Victims ---
@router.post("/{case_id}/victims/{victim_id}", response_model=CaseVictimResponse, status_code=201)
async def add_case_victim(
    case_id: int,
    victim_id: int,
    body: CasePersonLinkRequest,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> CaseVictimResponse:
    service = CaseService(session)
    return await service.add_case_victim(requester=current_officer, case_id=case_id, victim_id=victim_id, body=body)

@router.get("/{case_id}/victims", response_model=list[CaseVictimResponse], status_code=200)
async def list_case_victims(
    case_id: int,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> list[CaseVictimResponse]:
    service = CaseService(session)
    return await service.list_case_victims(requester=current_officer, case_id=case_id)

@router.delete("/{case_id}/victims/{victim_id}", status_code=204)
async def remove_case_victim(
    case_id: int,
    victim_id: int,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> None:
    service = CaseService(session)
    await service.remove_case_victim(requester=current_officer, case_id=case_id, victim_id=victim_id)

# --- Witnesses ---
@router.post("/{case_id}/witnesses/{witness_id}", response_model=CaseWitnessResponse, status_code=201)
async def add_case_witness(
    case_id: int,
    witness_id: int,
    body: CasePersonLinkRequest,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> CaseWitnessResponse:
    service = CaseService(session)
    return await service.add_case_witness(requester=current_officer, case_id=case_id, witness_id=witness_id, body=body)

@router.get("/{case_id}/witnesses", response_model=list[CaseWitnessResponse], status_code=200)
async def list_case_witnesses(
    case_id: int,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> list[CaseWitnessResponse]:
    service = CaseService(session)
    return await service.list_case_witnesses(requester=current_officer, case_id=case_id)

@router.delete("/{case_id}/witnesses/{witness_id}", status_code=204)
async def remove_case_witness(
    case_id: int,
    witness_id: int,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> None:
    service = CaseService(session)
    await service.remove_case_witness(requester=current_officer, case_id=case_id, witness_id=witness_id)


# --- Charges ---
@router.post("/{case_id}/charges", response_model=ChargeResponse, status_code=201)
async def create_charge(
    case_id: int,
    body: ChargeCreateRequest,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> ChargeResponse:
    service = CaseService(session)
    return await service.create_charge(requester=current_officer, case_id=case_id, body=body)

@router.get("/{case_id}/charges", response_model=list[ChargeResponse], status_code=200)
async def list_case_charges(
    case_id: int,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> list[ChargeResponse]:
    service = CaseService(session)
    return await service.list_case_charges(requester=current_officer, case_id=case_id)

@router.put("/{case_id}/charges/{charge_id}", response_model=ChargeResponse, status_code=200)
async def update_charge(
    case_id: int,
    charge_id: int,
    body: ChargeUpdateRequest,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> ChargeResponse:
    service = CaseService(session)
    return await service.update_charge(requester=current_officer, case_id=case_id, charge_id=charge_id, body=body)

@router.patch("/{case_id}/charges/{charge_id}/status", response_model=ChargeResponse, status_code=200)
async def update_charge_status(
    case_id: int,
    charge_id: int,
    body: ChargeStatusUpdateRequest,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> ChargeResponse:
    service = CaseService(session)
    return await service.update_charge_status(requester=current_officer, case_id=case_id, charge_id=charge_id, body=body)


# --- Arrests ---
@router.post("/{case_id}/arrests", response_model=ArrestResponse, status_code=201)
async def create_arrest(
    case_id: int,
    body: ArrestCreateRequest,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> ArrestResponse:
    service = CaseService(session)
    return await service.create_arrest(requester=current_officer, case_id=case_id, body=body)

@router.get("/{case_id}/arrests", response_model=list[ArrestResponse], status_code=200)
async def list_case_arrests(
    case_id: int,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> list[ArrestResponse]:
    service = CaseService(session)
    return await service.list_case_arrests(requester=current_officer, case_id=case_id)

@router.put("/{case_id}/arrests/{arrest_id}", response_model=ArrestResponse, status_code=200)
async def update_arrest(
    case_id: int,
    arrest_id: int,
    body: ArrestUpdateRequest,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> ArrestResponse:
    service = CaseService(session)
    return await service.update_arrest(requester=current_officer, case_id=case_id, arrest_id=arrest_id, body=body)


# --- Case Notes ---
@router.post("/{case_id}/notes", response_model=CaseNoteResponse, status_code=201)
async def create_note(
    case_id: int,
    body: CaseNoteCreateRequest,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> CaseNoteResponse:
    service = CaseService(session)
    return await service.create_note(requester=current_officer, case_id=case_id, body=body)

@router.get("/{case_id}/notes", response_model=list[CaseNoteResponse], status_code=200)
async def list_case_notes(
    case_id: int,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> list[CaseNoteResponse]:
    service = CaseService(session)
    return await service.list_case_notes(requester=current_officer, case_id=case_id)

@router.put("/notes/{note_id}", response_model=CaseNoteResponse, status_code=200)
async def update_note(
    note_id: int,
    body: CaseNoteUpdateRequest,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> CaseNoteResponse:
    service = CaseService(session)
    return await service.update_note(requester=current_officer, note_id=note_id, body=body)

@router.delete("/notes/{note_id}", status_code=204)
async def soft_delete_note(
    note_id: int,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
):
    service = CaseService(session)
    await service.soft_delete_note(requester=current_officer, note_id=note_id)


@router.get("/{case_id}/timeline", response_model=PaginatedResponse[CaseTimelineResponse], status_code=200)
async def get_case_timeline(
    case_id: int,
    update_type: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> PaginatedResponse[CaseTimelineResponse]:
    service = CaseService(session)
    return await service.get_case_timeline(
        requester=current_officer, 
        case_id=case_id, 
        update_type=update_type, 
        page=page, 
        size=size
    )

@router.get("/{case_id}/full-details", response_model=FullCaseDetailResponse, status_code=200)
async def get_full_case_details(
    case_id: int,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> FullCaseDetailResponse:
    service = CaseService(session)
    return await service.get_full_case_details(requester=current_officer, case_id=case_id)



