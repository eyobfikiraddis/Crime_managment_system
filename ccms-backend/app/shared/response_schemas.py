from __future__ import annotations

from pydantic import BaseModel


class MessageResponse(BaseModel):
    message: str


class ErrorDetail(BaseModel):
    loc: list[str] | None = None
    msg: str


class ErrorResponse(BaseModel):
    detail: str | list[ErrorDetail]


class HealthComponent(BaseModel):
    status: str
    latency_ms: float | None = None


class HealthResponse(BaseModel):
    status: str
    timestamp: str
    components: dict[str, HealthComponent]
    version: str


class ReadinessResponse(BaseModel):
    ready: bool
    checks: dict[str, bool]
