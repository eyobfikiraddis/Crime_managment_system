from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class InterrogationCreateRequest(BaseModel):
    suspect_id: int
    date: datetime
    notes: str | None = None
    location_id: int | None = None
    recording_url: str | None = Field(default=None, max_length=500)
