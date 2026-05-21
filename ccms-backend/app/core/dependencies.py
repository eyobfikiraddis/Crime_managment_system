from __future__ import annotations

from fastapi import Depends

from app.core.exceptions import ForbiddenError
from app.modules.auth.dependencies import (
    get_current_officer,
    require_any_permission,
    require_permission,
    require_role,
    require_superadmin,
)
from app.modules.auth.schemas.responses import CurrentOfficerContext
from app.shared.enums import RoleNameEnum


def require_roles(*allowed_roles: RoleNameEnum):
    async def _dependency(
        current_officer: CurrentOfficerContext = Depends(get_current_officer),
    ) -> CurrentOfficerContext:
        if current_officer.role_name not in [r.value for r in allowed_roles]:
            raise ForbiddenError()
        return current_officer

    return _dependency


def require_admin_or_superadmin():
    return require_roles(RoleNameEnum.admin, RoleNameEnum.superadmin)


def require_investigator_or_above():
    return require_roles(
        RoleNameEnum.investigator,
        RoleNameEnum.department_head,
        RoleNameEnum.admin,
        RoleNameEnum.superadmin,
    )
