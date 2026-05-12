from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class ArrestResponse(BaseModel):
    arrest_id: int
    suspect_id: int
    officer_id: int
    case_id: int | None
    booking_number: str | None
    location_id: int | None
    bail_amount: Decimal | None
    bail_set_at: datetime | None
    date: datetime
    released_at: datetime | None
    notes: str | None
    created_at: datetime
    suspect_name: str | None = None
    officer_name: str | None = None
    location_name: str | None = None

    model_config = ConfigDict(from_attributes=True)
