from __future__ import annotations

from datetime import date

from pydantic import BaseModel, Field, field_validator, model_validator

from app.modules.personnel.validators import (
    validate_past_date,
    validate_password_complexity,
    validate_phone_format,
)
from app.shared.enums import GenderEnum, RiskLevelEnum


class CreatePersonRequest(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100, strip_whitespace=True)
    last_name: str = Field(..., min_length=1, max_length=100, strip_whitespace=True)
    national_id: str = Field(..., min_length=1, max_length=100, strip_whitespace=True)
    gender: GenderEnum | None = Field(default=None)
    dob: date | None = Field(default=None)
    phone: str | None = Field(default=None)
    address: str | None = Field(default=None, max_length=255)

    @field_validator("dob")
    @classmethod
    def dob_must_be_past(cls, v: date | None) -> date | None:
        return validate_past_date(v)

    @field_validator("phone")
    @classmethod
    def phone_must_be_e164(cls, v: str | None) -> str | None:
        return validate_phone_format(v)


class UpdatePersonRequest(BaseModel):
    first_name: str | None = Field(
        default=None, min_length=1, max_length=100, strip_whitespace=True
    )
    last_name: str | None = Field(
        default=None, min_length=1, max_length=100, strip_whitespace=True
    )
    national_id: str | None = Field(default=None)
    gender: GenderEnum | None = Field(default=None)
    dob: date | None = Field(default=None)
    phone: str | None = Field(default=None)
    address: str | None = Field(default=None, max_length=255)

    @model_validator(mode="after")
    def reject_national_id_update(self) -> "UpdatePersonRequest":
        if self.national_id is not None:
            raise ValueError("national_id cannot be modified after creation")
        return self

    @field_validator("dob")
    @classmethod
    def dob_must_be_past(cls, v: date | None) -> date | None:
        return validate_past_date(v)

    @field_validator("phone")
    @classmethod
    def phone_must_be_e164(cls, v: str | None) -> str | None:
        return validate_phone_format(v)


class CreateOfficerRequest(BaseModel):
    person_id: int = Field(...)
    department_id: int = Field(...)
    role_id: int = Field(...)
    password: str = Field(..., min_length=8)
    rank: str | None = Field(default=None, max_length=50)
    badge_number: str | None = Field(default=None, max_length=50)

    @field_validator("password")
    @classmethod
    def password_complexity(cls, v: str) -> str:
        return validate_password_complexity(v)


class UpdateOfficerRequest(BaseModel):
    rank: str | None = Field(default=None, max_length=50)
    badge_number: str | None = Field(default=None, max_length=50)
    role_id: int | None = Field(default=None)
    department_id: int | None = Field(default=None)


class OfficerStatusRequest(BaseModel):
    action: str = Field(..., pattern="^(deactivate)$")


class CreateSuspectRequest(BaseModel):
    risk_level: RiskLevelEnum | None = Field(default=None)
    criminal_record: str | None = Field(default=None)


class CreateVictimRequest(BaseModel):
    notes: str | None = Field(default=None)


class CreateWitnessRequest(BaseModel):
    credibility_notes: str | None = Field(default=None)
    is_protected: bool = Field(default=False)


class PersonnelSearchRequest(BaseModel):
    search: str | None = Field(default=None, max_length=200)
    department_id: int | None = Field(default=None)
    role_id: int | None = Field(default=None)
    page: int = Field(default=1, ge=1)
    size: int = Field(default=20, ge=1, le=100)
