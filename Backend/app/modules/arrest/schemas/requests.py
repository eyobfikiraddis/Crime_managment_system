from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class ArrestCreateRequest(BaseModel):
    suspect_id: int
    arrested_by_officer_id: int
    arrest_datetime: datetime
    case_id: int | None = None
    booking_number: str | None = Field(default=None, max_length=100)
    arrest_location_id: int | None = None
    bail_amount: Decimal | None = Field(default=None, ge=0)
    notes: str | None = None

    model_config = ConfigDict(extra="forbid")


class ArrestUpdateRequest(BaseModel):
    bail_amount: Decimal | None = Field(default=None, ge=0)
    notes: str | None = None
    released_at: datetime | None = None

    model_config = ConfigDict(extra="forbid")
