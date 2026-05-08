from __future__ import annotations

from app.shared.enums import RoleNameEnum

CREATE_CASE = "create_case"
VIEW_CASE = "view_case"
UPDATE_CASE = "update_case"
DELETE_CASE = "delete_case"
MANAGE_EVIDENCE = "manage_evidence"
MANAGE_USERS = "manage_users"
MANAGE_ROLES = "manage_roles"
MANAGE_SESSIONS = "manage_sessions"
VIEW_AUDIT_LOGS = "view_audit_logs"

AUTH_ACTIVITY_PING = "auth_activity_ping"
AUTH_LOGOUT = "auth_logout"
AUTH_PASSWORD_CHANGE = "auth_password_change"

ALL_PERMISSIONS: set[str] = {
    CREATE_CASE,
    VIEW_CASE,
    UPDATE_CASE,
    DELETE_CASE,
    MANAGE_EVIDENCE,
    MANAGE_USERS,
    MANAGE_ROLES,
    MANAGE_SESSIONS,
    VIEW_AUDIT_LOGS,
    AUTH_ACTIVITY_PING,
    AUTH_LOGOUT,
    AUTH_PASSWORD_CHANGE,
}

BASE_AUTH_PERMISSIONS = {
    AUTH_ACTIVITY_PING,
    AUTH_LOGOUT,
    AUTH_PASSWORD_CHANGE,
}

ROLE_PERMISSIONS: dict[str, set[str]] = {
    RoleNameEnum.readonly.value: BASE_AUTH_PERMISSIONS | {VIEW_CASE},
    RoleNameEnum.forensic.value: BASE_AUTH_PERMISSIONS | {VIEW_CASE, MANAGE_EVIDENCE},
    RoleNameEnum.legal_officer.value: BASE_AUTH_PERMISSIONS | {VIEW_CASE, UPDATE_CASE},
    RoleNameEnum.investigator.value: BASE_AUTH_PERMISSIONS
    | {CREATE_CASE, VIEW_CASE, UPDATE_CASE, MANAGE_EVIDENCE},
    RoleNameEnum.department_head.value: BASE_AUTH_PERMISSIONS
    | {CREATE_CASE, VIEW_CASE, UPDATE_CASE, DELETE_CASE, MANAGE_EVIDENCE, MANAGE_USERS},
    RoleNameEnum.admin.value: BASE_AUTH_PERMISSIONS
    | {
        CREATE_CASE,
        VIEW_CASE,
        UPDATE_CASE,
        DELETE_CASE,
        MANAGE_EVIDENCE,
        MANAGE_USERS,
        MANAGE_ROLES,
        MANAGE_SESSIONS,
        VIEW_AUDIT_LOGS,
    },
    RoleNameEnum.superadmin.value: {"*"},
}


def validate_permissions_registry() -> tuple[bool, list[str]]:
    errors: list[str] = []
    role_names = {role.value for role in RoleNameEnum}
    mapped_roles = set(ROLE_PERMISSIONS.keys())

    missing_roles = role_names - mapped_roles
    extra_roles = mapped_roles - role_names

    if missing_roles:
        errors.append(f"Missing role mappings: {sorted(missing_roles)}")
    if extra_roles:
        errors.append(f"Unknown role mappings: {sorted(extra_roles)}")

    for role, permissions in ROLE_PERMISSIONS.items():
        if "*" in permissions:
            continue
        unknown = set(permissions) - ALL_PERMISSIONS
        if unknown:
            errors.append(
                f"Role '{role}' references unknown permissions: {sorted(unknown)}"
            )

    return (len(errors) == 0), errors
