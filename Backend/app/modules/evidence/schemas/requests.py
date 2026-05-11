from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, Field


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
    evidence_type_id: int | None = Field(default=None)
    case_id: int | None = Field(default=None)
    collected_at: datetime | None = Field(default=None)
    collected_by_officer_id: int | None = Field(default=None)


class CustodyEntryCreateRequest(BaseModel):
    action: str = Field(...)
    transferred_to: int | None = Field(default=None)
    location_id: int | None = Field(default=None)
    notes: str | None = Field(default=None)


class ForensicReportCreateRequest(BaseModel):
    findings: str = Field(..., min_length=1)
    methodology: str | None = Field(default=None)
    report_date: date = Field(...)
    lab_reference: str | None = Field(default=None)


class VehicleDetailCreateRequest(BaseModel):
    plate_number: str | None = Field(default=None, max_length=30)
    type: str | None = Field(default=None, max_length=50)
    make: str | None = Field(default=None, max_length=100)
    model: str | None = Field(default=None, max_length=100)
    color: str | None = Field(default=None, max_length=50)
    year: int | None = Field(default=None)
    vin: str | None = Field(default=None, max_length=50)
    description: str | None = Field(default=None)


class WeaponDetailCreateRequest(BaseModel):
    type: str | None = Field(default=None, max_length=50)
    make: str | None = Field(default=None, max_length=100)
    serial_number: str | None = Field(default=None, max_length=100)
    caliber: str | None = Field(default=None, max_length=50)
    description: str | None = Field(default=None)


class CrimeScenePhotoCreateRequest(BaseModel):
    image_url: str = Field(..., max_length=500)
    description: str | None = Field(default=None)
    captured_at: datetime | None = Field(default=None)
    evidence_id: int | None = Field(default=None)
