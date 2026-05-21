from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from app.shared.enums import ChargeStatusEnum


# Court Case

class CourtCaseCreateRequest(BaseModel):
    court_name: str = Field(..., min_length=1, max_length=255)
    court_reference: str | None = Field(default=None, max_length=100)
    judge_name: str | None = Field(default=None, max_length=255)
    prosecutor_name: str | None = Field(default=None, max_length=255)
    hearing_date: date | None = None


class CourtCasePatchRequest(BaseModel):
    court_name: str | None = Field(default=None, max_length=255)
    court_reference: str | None = Field(default=None, max_length=100)
    judge_name: str | None = Field(default=None, max_length=255)
    prosecutor_name: str | None = Field(default=None, max_length=255)
    hearing_date: date | None = None
    verdict: str | None = None
    verdict_notes: str | None = None


class SentenceResponse(BaseModel):
    sentence_id: int
    charge_id: int
    court_case_id: int
    description: str
    duration: str | None
    duration_days: int | None
    start_date: date | None
    end_date: date | None
    sentence_type: str | None
    is_suspended: bool
    sentenced_at: datetime
    created_at: datetime
    updated_at: datetime | None

    model_config = ConfigDict(from_attributes=True)


class ChargeResponse(BaseModel):
    charge_id: int
    case_id: int
    court_case_id: int | None
    suspect_id: int | None
    crime_type_id: int
    description: str | None
    filed_at: datetime | None
    charge_status: ChargeStatusEnum
    created_at: datetime
    updated_at: datetime | None
    sentence: SentenceResponse | None = None

    model_config = ConfigDict(from_attributes=True)


class CourtCaseResponse(BaseModel):
    court_case_id: int
    case_id: int
    court_name: str
    court_reference: str | None
    judge_name: str | None
    prosecutor_name: str | None
    hearing_date: date | None
    verdict: str | None
    verdict_notes: str | None
    closed_at: datetime | None
    created_at: datetime
    updated_at: datetime | None
    charges: list[ChargeResponse] = []

    model_config = ConfigDict(from_attributes=True)


# Charges

class ChargeCreateRequest(BaseModel):
    suspect_id: int
    crime_type_id: int
    description: str = Field(..., min_length=1)
    court_case_id: int | None = None


class ChargePatchRequest(BaseModel):
    status: str


# Sentences

class SentenceCreateRequest(BaseModel):
    court_case_id: int
    description: str = Field(..., min_length=1)
    duration: str = Field(..., min_length=1)
    duration_days: int | None = Field(default=None, ge=0)
    start_date: date | None = None
    end_date: date | None = None
    sentence_type: str | None = None
    is_suspended: bool | None = False
    sentenced_at: datetime | None = None
