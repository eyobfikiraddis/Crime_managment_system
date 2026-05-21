from __future__ import annotations

from pydantic import BaseModel


class PermissionCheckResponse(BaseModel):
    permission: str
    allowed: bool


class RolePermissionsResponse(BaseModel):
    role_name: str
    permissions: list[str]
    wildcard: bool
