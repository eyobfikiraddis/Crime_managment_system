from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.shared.enums import RoleInCaseEnum, SeverityEnum


class CaseStatusBriefResponse(BaseModel):
    status_id: int
    status_name: str

    model_config = ConfigDict(from_attributes=True)


class CrimeTypeBriefResponse(BaseModel):
    crime_type_id: int
    name: str
    severity: SeverityEnum | None

    model_config = ConfigDict(from_attributes=True)


class OfficerTinyResponse(BaseModel):
    officer_id: int
    first_name: str
    last_name: str
    badge_number: str | None

    model_config = ConfigDict(from_attributes=True)


class CaseOfficerTinyResponse(BaseModel):
    assignment_id: int
    officer_id: int
    role_in_case: RoleInCaseEnum
    active: bool
    officer: OfficerTinyResponse

    model_config = ConfigDict(from_attributes=True)


class CaseListItemResponse(BaseModel):
    case_id: int
    case_number: str
    title: str
    opened_at: datetime | None
    closed_at: datetime | None
    status: CaseStatusBriefResponse
    crime_type: CrimeTypeBriefResponse

    model_config = ConfigDict(from_attributes=True)


class CaseDetailResponse(CaseListItemResponse):
    description: str | None
    lead_officer: OfficerTinyResponse | None
    case_officers: list[CaseOfficerTinyResponse]

    model_config = ConfigDict(from_attributes=True)


from decimal import Decimal
from app.shared.enums import ChargeStatusEnum, VerdictEnum, RiskLevelEnum

class SuspectDetailResponse(BaseModel):
    suspect_id: int
    first_name: str | None = None
    last_name: str | None = None
    risk_level: RiskLevelEnum | None = None
    criminal_record: str | None = None

    model_config = ConfigDict(from_attributes=True)

class CaseSuspectResponse(BaseModel):
    id: int
    case_id: int
    suspect_id: int
    notes: str | None = None
    added_at: datetime
    added_by: int
    suspect: SuspectDetailResponse | None = None

    model_config = ConfigDict(from_attributes=True)

class VictimDetailResponse(BaseModel):
    victim_id: int
    first_name: str | None = None
    last_name: str | None = None

    model_config = ConfigDict(from_attributes=True)

class CaseVictimResponse(BaseModel):
    id: int
    case_id: int
    victim_id: int
    notes: str | None = None
    added_at: datetime
    added_by: int
    victim: VictimDetailResponse | None = None

    model_config = ConfigDict(from_attributes=True)

class WitnessDetailResponse(BaseModel):
    witness_id: int
    first_name: str | None = None
    last_name: str | None = None
    credibility_notes: str | None = None
    is_protected: bool

    model_config = ConfigDict(from_attributes=True)

class CaseWitnessResponse(BaseModel):
    id: int
    case_id: int
    witness_id: int
    notes: str | None = None
    added_at: datetime
    added_by: int
    witness: WitnessDetailResponse | None = None

    model_config = ConfigDict(from_attributes=True)

class ChargeResponse(BaseModel):
    charge_id: int
    case_id: int
    court_case_id: int | None = None
    suspect_id: int | None = None
    crime_type_id: int
    charge_status: ChargeStatusEnum
    description: str | None = None
    filed_at: datetime | None = None
    verdict: VerdictEnum | None = None
    created_at: datetime
    updated_at: datetime | None = None
    suspect: SuspectDetailResponse | None = None
    crime_type: CrimeTypeBriefResponse | None = None

    model_config = ConfigDict(from_attributes=True)

class LocationBriefResponse(BaseModel):
    location_id: int
    name: str

    model_config = ConfigDict(from_attributes=True)

class ArrestResponse(BaseModel):
    arrest_id: int
    suspect_id: int
    officer_id: int
    case_id: int | None = None
    booking_number: str | None = None
    location_id: int | None = None
    bail_amount: Decimal | None = None
    bail_set_at: datetime | None = None
    date: datetime
    released_at: datetime | None = None
    notes: str | None = None
    created_at: datetime
    updated_at: datetime | None = None
    suspect: SuspectDetailResponse | None = None
    arresting_officer: OfficerTinyResponse | None = None
    location: LocationBriefResponse | None = None

    model_config = ConfigDict(from_attributes=True)

class EvidenceTypeBriefResponse(BaseModel):
    evidence_type_id: int
    name: str

    model_config = ConfigDict(from_attributes=True)

class EvidenceResponse(BaseModel):
    evidence_id: int
    case_id: int
    evidence_tag: str
    name: str
    description: str | None = None
    evidence_type_id: int | None = None
    is_sensitive: bool
    storage_location_id: int | None = None
    collected_by_officer_id: int | None = None
    collected_at: datetime | None = None
    created_at: datetime
    updated_at: datetime | None = None
    evidence_type: EvidenceTypeBriefResponse | None = None
    collected_by_officer: OfficerTinyResponse | None = None

    model_config = ConfigDict(from_attributes=True)

class ChainOfCustodyResponse(BaseModel):
    chain_id: int
    evidence_id: int
    officer_id: int
    action: str
    transferred_to: int | None = None
    location_id: int | None = None
    notes: str | None = None
    created_at: datetime
    officer: OfficerTinyResponse | None = None
    # Assuming transferred_to_officer is handled in service
    transferred_to_officer: OfficerTinyResponse | None = None
    location: LocationBriefResponse | None = None

    model_config = ConfigDict(from_attributes=True)

class CaseNoteResponse(BaseModel):
    note_id: int
    case_id: int
    officer_id: int
    note_text: str
    is_internal: bool
    created_at: datetime
    updated_at: datetime | None = None
    officer: OfficerTinyResponse | None = None

    model_config = ConfigDict(from_attributes=True)

class CaseTimelineResponse(BaseModel):
    update_id: int
    update_type: str
    description: str
    created_at: datetime
    officer: OfficerTinyResponse | None = None

    model_config = ConfigDict(from_attributes=True)

class FullCaseDetailResponse(BaseModel):
    case: CaseDetailResponse
    status: CaseStatusBriefResponse
    crime_type: CrimeTypeBriefResponse
    primary_location: LocationBriefResponse | None = None
    lead_officer: OfficerTinyResponse | None = None
    officers: list[CaseOfficerTinyResponse] = []
    suspects: list[CaseSuspectResponse] = []
    victims: list[CaseVictimResponse] = []
    witnesses: list[CaseWitnessResponse] = []
    charges: list[ChargeResponse] = []
    arrests: list[ArrestResponse] = []
    evidence: list[EvidenceResponse] = []
    notes: list[CaseNoteResponse] = []
    recent_updates: list[CaseTimelineResponse] = []

    model_config = ConfigDict(from_attributes=True)
