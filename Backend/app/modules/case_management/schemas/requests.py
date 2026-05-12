from __future__ import annotations

from pydantic import BaseModel, Field


class CreateCaseRequest(BaseModel):
    case_number: str = Field(..., min_length=1, max_length=100)
    title: str = Field(..., min_length=1, max_length=255)
    description: str | None = Field(default=None)
    crime_type_id: int = Field(...)
    status_id: int = Field(...)
    lead_officer_id: int | None = Field(default=None)


class CaseUpdateRequest(BaseModel):
    title: str | None = Field(default=None, max_length=255)
    description: str | None = Field(default=None)
    crime_type_id: int | None = Field(default=None)
    primary_location_id: int | None = Field(default=None)


class CaseStatusUpdateRequest(BaseModel):
    status_id: int = Field(...)


class CaseUpdateCreateRequest(BaseModel):
    update_type: str = Field(...)
    description: str = Field(..., min_length=1, max_length=2000)


from app.shared.enums import RoleInCaseEnum, ChargeStatusEnum

class CaseAssignmentCreate(BaseModel):
    officer_id: int = Field(...)
    role_in_case: RoleInCaseEnum = Field(...)


class CasePersonLinkRequest(BaseModel):
    notes: str | None = Field(default=None)


class ChargeCreateRequest(BaseModel):
    suspect_id: int = Field(...)
    crime_type_id: int = Field(...)
    description: str = Field(...)
    court_case_id: int | None = Field(default=None)


class ChargeUpdateRequest(BaseModel):
    description: str | None = Field(default=None)
    crime_type_id: int | None = Field(default=None)
    court_case_id: int | None = Field(default=None)


class ChargeStatusUpdateRequest(BaseModel):
    status: ChargeStatusEnum = Field(...)


from decimal import Decimal
from datetime import datetime

class ArrestCreateRequest(BaseModel):
    suspect_id: int = Field(...)
    arrested_by_officer_id: int = Field(...)
    arrest_location_id: int | None = Field(default=None)
    arrest_datetime: datetime = Field(...)
    arrest_reason: str | None = Field(default=None)
    booking_number: str | None = Field(default=None)
    bail_amount: Decimal | None = Field(default=None, ge=0)
    notes: str | None = Field(default=None)


class ArrestUpdateRequest(BaseModel):
    bail_amount: Decimal | None = Field(default=None, ge=0)
    notes: str | None = Field(default=None)
    released_at: datetime | None = Field(default=None)


class EvidenceCreateRequest(BaseModel):
    evidence_tag: str = Field(..., max_length=100)
    name: str = Field(..., max_length=255)
    evidence_type_id: int = Field(...)
    description: str | None = Field(default=None)
    collected_at: datetime = Field(...)
    storage_location_id: int | None = Field(default=None)
    is_sensitive: bool = Field(default=False)


class EvidenceUpdateRequest(BaseModel):
    description: str | None = Field(default=None)
    storage_location_id: int | None = Field(default=None)
    is_sensitive: bool | None = Field(default=None)


class ChainOfCustodyCreateRequest(BaseModel):
    action: str = Field(...)
    transferred_to: int | None = Field(default=None)
    location_id: int | None = Field(default=None)
    notes: str | None = Field(default=None)


class CaseNoteCreateRequest(BaseModel):
    note_text: str = Field(..., min_length=1)
    is_internal: bool = Field(default=False)


class CaseNoteUpdateRequest(BaseModel):
    note_text: str | None = Field(default=None, min_length=1)
    is_internal: bool | None = Field(default=None)


class ReportCreateRequest(BaseModel):
    report_type: str = Field(...)
    content: str = Field(..., min_length=1)


class CasePermissionGrantRequest(BaseModel):
    officer_id: int = Field(...)
    access_level: str = Field(...)
