from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from app.shared.enums import ChargeStatusEnum, GenderEnum, RiskLevelEnum, RoleInCaseEnum, VerdictEnum


class PersonResponse(BaseModel):
    person_id: int
    first_name: str
    last_name: str
    national_id: str
    gender: GenderEnum | None
    dob: date | None
    phone: str | None
    address: str | None
    created_at: datetime
    updated_at: datetime | None
    deleted_at: datetime | None

    model_config = ConfigDict(from_attributes=True)


class RoleResponse(BaseModel):
    role_id: int
    role_name: str
    description: str | None

    model_config = ConfigDict(from_attributes=True)


class DepartmentBriefResponse(BaseModel):
    department_id: int
    name: str

    model_config = ConfigDict(from_attributes=True)


class OfficerResponse(BaseModel):
    officer_id: int
    person_id: int
    department_id: int | None
    role_id: int
    rank: str | None
    badge_number: str | None
    is_active: bool
    last_login_at: datetime | None
    created_at: datetime
    updated_at: datetime | None
    deleted_at: datetime | None
    person: PersonResponse
    role: RoleResponse
    department: DepartmentBriefResponse | None

    model_config = ConfigDict(from_attributes=True)


class OfficerListResponse(BaseModel):
    officer_id: int
    person_id: int
    department_id: int | None
    role_id: int
    rank: str | None
    badge_number: str | None
    is_active: bool
    last_login_at: datetime | None
    created_at: datetime
    person: PersonResponse
    role: RoleResponse
    department: DepartmentBriefResponse | None

    model_config = ConfigDict(from_attributes=True)


class OfficerHistoryEntryResponse(BaseModel):
    history_id: int
    officer_id: int
    changed_by: int
    changed_by_name: str
    field_name: str
    old_value: str | None
    new_value: str | None
    changed_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PersonHistoryEntryResponse(BaseModel):
    history_id: int
    person_id: int
    changed_by: int
    changed_by_name: str
    field_name: str
    old_value: str | None
    new_value: str | None
    changed_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PersonDetailResponse(BaseModel):
    person_id: int
    first_name: str
    last_name: str
    national_id: str
    gender: GenderEnum | None
    dob: date | None
    phone: str | None
    address: str | None
    created_at: datetime
    updated_at: datetime | None
    roles: list[str]
    officer: OfficerResponse | None
    is_suspect: bool
    is_victim: bool
    is_witness: bool

    model_config = ConfigDict(from_attributes=True)


class PersonSummaryResponse(BaseModel):
    person_id: int
    first_name: str
    last_name: str

    model_config = ConfigDict(from_attributes=True)


class OfficerBriefResponse(BaseModel):
    officer_id: int
    badge_number: str | None
    first_name: str
    last_name: str
    rank: str | None

    model_config = ConfigDict(from_attributes=True)


class CaseOfficerAssignmentResponse(BaseModel):
    officer_id: int
    badge_number: str | None
    first_name: str
    last_name: str
    rank: str | None
    role_in_case: RoleInCaseEnum

    model_config = ConfigDict(from_attributes=True)


class CaseSummaryResponse(BaseModel):
    case_id: int
    case_number: str
    title: str
    status_name: str
    crime_type_name: str
    opened_at: datetime | None
    assigned_officers: list[CaseOfficerAssignmentResponse]

    model_config = ConfigDict(from_attributes=True)


class ArrestSummaryResponse(BaseModel):
    arrest_id: int
    booking_number: str | None
    date: datetime
    released_at: datetime | None
    bail_amount: str | None
    case_id: int | None
    case_title: str | None
    arresting_officer: OfficerBriefResponse

    model_config = ConfigDict(from_attributes=True)


class ChargeSummaryResponse(BaseModel):
    charge_id: int
    crime_type_name: str
    charge_status: ChargeStatusEnum
    description: str | None
    verdict: VerdictEnum | None
    filed_at: datetime | None
    case_id: int
    case_number: str
    court_case_id: int | None = None

    model_config = ConfigDict(from_attributes=True)


class SuspectResponse(BaseModel):
    suspect_id: int
    person_id: int
    risk_level: RiskLevelEnum | None
    criminal_record: str | None
    created_at: datetime
    updated_at: datetime | None
    deleted_at: datetime | None
    person: PersonResponse

    model_config = ConfigDict(from_attributes=True)


class SuspectDetailResponse(SuspectResponse):
    arrest_count: int
    charge_count: int
    case_count: int


class SuspectListItemResponse(BaseModel):
    suspect_id: int
    person: PersonSummaryResponse
    risk_level: RiskLevelEnum | None
    active_case_count: int
    active_charge_count: int
    deleted_at: datetime | None

    model_config = ConfigDict(from_attributes=True)


class VictimResponse(BaseModel):
    victim_id: int
    person_id: int
    notes: str | None
    created_at: datetime
    updated_at: datetime | None
    deleted_at: datetime | None
    person: PersonResponse

    model_config = ConfigDict(from_attributes=True)


class WitnessResponse(BaseModel):
    witness_id: int
    person_id: int
    credibility_notes: str | None
    is_protected: bool
    created_at: datetime
    updated_at: datetime | None
    deleted_at: datetime | None
    person: PersonResponse

    model_config = ConfigDict(from_attributes=True)


class OfficerDeactivateResponse(BaseModel):
    message: str
