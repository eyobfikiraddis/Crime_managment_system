from __future__ import annotations

import pytest

from app.core.permissions_registry import validate_permissions_registry
from app.modules.auth.authorization_service import AuthorizationService
from app.shared.enums import RoleNameEnum


def test_permission_registry_is_valid() -> None:
    ok, errors = validate_permissions_registry()
    assert ok, f"Permission registry invalid: {errors}"


def test_superadmin_has_wildcard_permission() -> None:
    permissions = AuthorizationService.resolve_permissions_for_role(
        RoleNameEnum.superadmin.value
    )
    assert "*" in permissions


@pytest.mark.asyncio
async def test_logout_requires_auth(async_client) -> None:
    response = await async_client.post(
        "/api/v1/auth/logout",
        json={"refresh_token": "invalid"},
    )
    assert response.status_code == 401
