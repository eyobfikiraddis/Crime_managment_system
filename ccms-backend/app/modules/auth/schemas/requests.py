from __future__ import annotations

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    national_id: str = Field(..., min_length=1, max_length=100, strip_whitespace=True)
    password: str = Field(..., min_length=8)


class RefreshTokenRequest(BaseModel):
    refresh_token: str = Field(..., min_length=1)


class LogoutRequest(BaseModel):
    refresh_token: str | None = Field(default=None)


class PasswordResetRequestPayload(BaseModel):
    national_id: str = Field(..., min_length=1, max_length=100, strip_whitespace=True)


class PasswordResetConfirmPayload(BaseModel):
    token: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8)


class PasswordChangeRequest(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8)
