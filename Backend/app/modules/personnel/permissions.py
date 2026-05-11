from __future__ import annotations

from app.core.permissions_registry import MANAGE_USERS
from app.modules.auth.schemas.responses import CurrentOfficerContext
from app.shared.enums import RoleNameEnum

ADMIN_ROLES = {RoleNameEnum.admin.value, RoleNameEnum.superadmin.value}
MANAGE_USERS_ROLES = {
    RoleNameEnum.department_head.value,
    RoleNameEnum.admin.value,
    RoleNameEnum.superadmin.value,
}


def is_admin_or_superadmin(officer: CurrentOfficerContext) -> bool:
    return officer.role_name in ADMIN_ROLES


def has_manage_users_access(officer: CurrentOfficerContext) -> bool:
    if MANAGE_USERS in officer.permissions:
        return True
    return officer.role_name in MANAGE_USERS_ROLES


INVESTIGATOR_PLUS_ROLES = {
    RoleNameEnum.investigator.value,
    RoleNameEnum.department_head.value,
    RoleNameEnum.legal_officer.value,
    RoleNameEnum.admin.value,
    RoleNameEnum.superadmin.value,
}


def is_investigator_or_above(officer: CurrentOfficerContext) -> bool:
    return officer.role_name in INVESTIGATOR_PLUS_ROLES


PROMOTE_VICTIM_WITNESS_ROLES = {
    RoleNameEnum.investigator.value,
    RoleNameEnum.department_head.value,
    RoleNameEnum.admin.value,
    RoleNameEnum.superadmin.value,
}


def can_promote_victim_or_witness(officer: CurrentOfficerContext) -> bool:
    return officer.role_name in PROMOTE_VICTIM_WITNESS_ROLES
