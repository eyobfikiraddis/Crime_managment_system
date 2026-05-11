from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.modules.personnel.schemas.responses import PersonSummaryResponse


class DepartmentHeadSummary(BaseModel):
    officer_id: int
    first_name: str
    last_name: str
    rank: str | None
    badge_number: str | None

    model_config = ConfigDict(from_attributes=True)


class DepartmentResponse(BaseModel):
    department_id: int
    name: str
    location_id: int | None
    department_head_officer_id: int | None
    officer_count: int
    created_at: datetime
    updated_at: datetime | None
    deleted_at: datetime | None
    department_head: DepartmentHeadSummary | None

    model_config = ConfigDict(from_attributes=True)


class RemoveDepartmentHeadResponse(BaseModel):
    message: str
    demoted_to_role: str


class DepartmentOfficerResponse(BaseModel):
    officer_id: int
    badge_number: str | None
    rank: str | None
    role_name: str
    is_active: bool
    person: PersonSummaryResponse

    model_config = ConfigDict(from_attributes=True)


class DepartmentListItemResponse(BaseModel):
    department_id: int
    name: str
    location_id: int | None
    department_head_officer_id: int | None
    officer_count: int
    created_at: datetime
    updated_at: datetime | None
    department_head: DepartmentHeadSummary | None

    model_config = ConfigDict(from_attributes=True)
