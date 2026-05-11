from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from app.modules.case_management.schemas.responses import LocationBriefResponse, OfficerTinyResponse


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
    storage_location: LocationBriefResponse | None = None

    model_config = ConfigDict(from_attributes=True)


class CustodyEntryResponse(BaseModel):
    chain_id: int
    evidence_id: int
    officer_id: int
    action: str
    transferred_to: int | None = None
    location_id: int | None = None
    notes: str | None = None
    created_at: datetime
    officer: OfficerTinyResponse | None = None
    transferred_to_officer: OfficerTinyResponse | None = None
    location: LocationBriefResponse | None = None

    model_config = ConfigDict(from_attributes=True)


class CustodyChainResponse(BaseModel):
    evidence_id: int
    items: list[CustodyEntryResponse]

    model_config = ConfigDict(from_attributes=True)


class ForensicReportResponse(BaseModel):
    report_id: int
    evidence_id: int
    officer_id: int
    findings: str
    methodology: str | None = None
    report_date: date
    lab_reference: str | None = None
    created_at: datetime
    updated_at: datetime | None = None
    officer: OfficerTinyResponse | None = None

    model_config = ConfigDict(from_attributes=True)


class VehicleDetailResponse(BaseModel):
    vehicle_id: int
    evidence_id: int
    plate_number: str | None = None
    type: str | None = None
    make: str | None = None
    model: str | None = None
    color: str | None = None
    year: int | None = None
    vin: str | None = None
    description: str | None = None

    model_config = ConfigDict(from_attributes=True)


class WeaponDetailResponse(BaseModel):
    weapon_id: int
    evidence_id: int
    type: str | None = None
    make: str | None = None
    serial_number: str | None = None
    caliber: str | None = None
    description: str | None = None

    model_config = ConfigDict(from_attributes=True)


class CrimeScenePhotoResponse(BaseModel):
    photo_id: int
    case_id: int
    evidence_id: int | None = None
    image_url: str
    description: str | None = None
    captured_at: datetime | None = None
    captured_by: int
    created_at: datetime
    captured_by_officer: OfficerTinyResponse | None = None

    model_config = ConfigDict(from_attributes=True)


class EvidenceDetailResponse(EvidenceResponse):
    custody_chain: list[CustodyEntryResponse] = []
    forensic_report: ForensicReportResponse | None = None
    vehicle: VehicleDetailResponse | None = None
    weapon: WeaponDetailResponse | None = None

    model_config = ConfigDict(from_attributes=True)
