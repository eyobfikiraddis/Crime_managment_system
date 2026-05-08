from __future__ import annotations

from pydantic import BaseModel


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    session_id: str


class AccessTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class CurrentOfficerContext(BaseModel):
    officer_id: int
    role_name: str
    department_id: int | None
    permissions: list[str] = []


class ActivityPingResponse(BaseModel):
    active: bool
    last_activity: str
