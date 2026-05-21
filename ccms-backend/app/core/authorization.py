from __future__ import annotations

from dataclasses import dataclass

from app.core.permissions_registry import ROLE_PERMISSIONS


@dataclass(frozen=True)
class PermissionSet:
    permissions: set[str]
    wildcard: bool


def resolve_role_permissions(role_name: str) -> PermissionSet:
    permissions = set(ROLE_PERMISSIONS.get(role_name, set()))
    wildcard = "*" in permissions
    if wildcard:
        return PermissionSet(permissions={"*"}, wildcard=True)
    return PermissionSet(permissions=permissions, wildcard=False)


def role_has_permission(role_name: str, permission: str) -> bool:
    perm_set = resolve_role_permissions(role_name)
    if perm_set.wildcard:
        return True
    return permission in perm_set.permissions


def role_has_any_permission(role_name: str, permissions: list[str]) -> bool:
    perm_set = resolve_role_permissions(role_name)
    if perm_set.wildcard:
        return True
    return any(permission in perm_set.permissions for permission in permissions)
