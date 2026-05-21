from __future__ import annotations

from app.modules.auth.schemas.responses import CurrentOfficerContext
from app.shared.enums import RoleNameEnum

ADMIN_ROLES = {RoleNameEnum.admin.value, RoleNameEnum.superadmin.value}
MANAGEMENT_ROLES = {
    RoleNameEnum.department_head.value,
    RoleNameEnum.admin.value,
    RoleNameEnum.superadmin.value,
}
OPERATIONAL_ROLES = {
    RoleNameEnum.investigator.value,
    RoleNameEnum.department_head.value,
    RoleNameEnum.admin.value,
    RoleNameEnum.superadmin.value,
}


def is_admin_or_superadmin(officer: CurrentOfficerContext) -> bool:
    return officer.role_name in ADMIN_ROLES


def is_superadmin(officer: CurrentOfficerContext) -> bool:
    return officer.role_name == RoleNameEnum.superadmin.value


def is_department_head_of(officer: CurrentOfficerContext, department_id: int) -> bool:
    return (
        officer.role_name == RoleNameEnum.department_head.value
        and officer.department_id == department_id
    )


def can_manage_officers(officer: CurrentOfficerContext, target_department_id: int) -> bool:
    if is_admin_or_superadmin(officer):
        return True
    if is_department_head_of(officer, target_department_id):
        return True
    return False
