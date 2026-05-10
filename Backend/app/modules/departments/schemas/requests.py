from __future__ import annotations

from pydantic import BaseModel, Field


class CreateDepartmentRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, strip_whitespace=True)
    location_id: int | None = Field(default=None)


class UpdateDepartmentRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100, strip_whitespace=True)
    location_id: int | None = Field(default=None)


class AssignDepartmentHeadRequest(BaseModel):
    officer_id: int
