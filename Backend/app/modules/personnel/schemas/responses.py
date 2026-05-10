from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from app.shared.enums import GenderEnum, RiskLevelEnum


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
