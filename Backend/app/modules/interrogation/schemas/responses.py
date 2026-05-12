from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class InterrogationResponse(BaseModel):
    interrogation_id: int
    case_id: int
    suspect_id: int
    officer_id: int
    location_id: int | None
    notes: str | None
    recording_url: str | None
    date: datetime
    created_at: datetime
    suspect_name: str | None = None
    officer_name: str | None = None
    location_name: str | None = None

    model_config = ConfigDict(from_attributes=True)
