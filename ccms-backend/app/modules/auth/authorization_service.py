from __future__ import annotations

from app.core.authorization import resolve_role_permissions, role_has_any_permission, role_has_permission
from app.core.exceptions import ForbiddenError
from app.modules.auth.schemas.responses import CurrentOfficerContext
from app.shared.enums import RoleNameEnum


class AuthorizationService:
    def __init__(self, officer: CurrentOfficerContext) -> None:
        self.officer = officer

    @staticmethod
    def resolve_permissions_for_role(role_name: str) -> set[str]:
        perm_set = resolve_role_permissions(role_name)
        if perm_set.wildcard:
            return {"*"}
        return set(perm_set.permissions)

    def has_permission(
        self,
        permission: str,
        resource_department_id: int | None = None,
    ) -> bool:
        if not role_has_permission(self.officer.role_name, permission):
            return False
        return self._department_scope_ok(resource_department_id)

    def has_any_permission(
        self,
        permissions: list[str],
        resource_department_id: int | None = None,
    ) -> bool:
        if not role_has_any_permission(self.officer.role_name, permissions):
            return False
        return self._department_scope_ok(resource_department_id)

    def require_permission(
        self,
        permission: str,
        resource_department_id: int | None = None,
    ) -> None:
        if not self.has_permission(permission, resource_department_id):
            raise ForbiddenError()

    def require_any_permission(
        self,
        permissions: list[str],
        resource_department_id: int | None = None,
    ) -> None:
        if not self.has_any_permission(permissions, resource_department_id):
            raise ForbiddenError()

    def require_role(self, role_name: str) -> None:
        if self.officer.role_name != role_name:
            raise ForbiddenError()

    def require_superadmin(self) -> None:
        if self.officer.role_name != RoleNameEnum.superadmin.value:
            raise ForbiddenError()

    def check_object_access(
        self,
        permission: str,
        resource_department_id: int | None = None,
        resource_owner_officer_id: int | None = None,
    ) -> bool:
        if not self.has_permission(permission, resource_department_id):
            return False
        if resource_owner_officer_id is not None:
            return resource_owner_officer_id == self.officer.officer_id
        return True

    def _department_scope_ok(self, resource_department_id: int | None) -> bool:
        if resource_department_id is None:
            return True
        if self.officer.role_name in {
            RoleNameEnum.admin.value,
            RoleNameEnum.superadmin.value,
        }:
            return True
        return self.officer.department_id == resource_department_id
