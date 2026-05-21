from __future__ import annotations

from datetime import datetime, timezone

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
import structlog
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import redis_client as redis_ops
from app.core.database import get_db_session
from app.core.token_enforcement import (
    decode_and_validate_access_token,
    ensure_token_not_revoked,
    normalize_exp,
)
from app.core.session_manager import validate_session_activity
from app.modules.auth.authorization_service import AuthorizationService
from app.modules.auth.exceptions import AccountInactiveError, InvalidTokenError, SessionExpiredError
from app.modules.auth.repository import AuthRepository
from app.modules.auth.schemas.responses import CurrentOfficerContext

security_scheme = HTTPBearer(auto_error=False)
logger = structlog.get_logger(__name__)


async def get_current_officer(
    credentials: HTTPAuthorizationCredentials | None = Depends(security_scheme),
    session: AsyncSession = Depends(get_db_session),
) -> CurrentOfficerContext:
    if not credentials or not credentials.credentials:
        raise InvalidTokenError("Not authenticated")

    token = credentials.credentials

    try:
        payload = decode_and_validate_access_token(token)
    except JWTError:
        raise InvalidTokenError("Not authenticated")

    jti = payload.get("jti", "")
    if not jti:
        raise InvalidTokenError("Not authenticated")

    await ensure_token_not_revoked(jti)

    officer_id_str = payload.get("sub", "")
    session_id = payload.get("session_id", "")
    token_role = payload.get("role", "")
    if not officer_id_str or not session_id or not token_role:
        raise InvalidTokenError("Not authenticated")

    officer_id = int(officer_id_str)

    if await redis_ops.is_officer_blocked(officer_id):
        raise AccountInactiveError()

    now = datetime.now(tz=timezone.utc)
    try:
        await validate_session_activity(
            session_id=session_id,
            current_jti=jti,
            current_exp=normalize_exp(payload),
            now=now,
        )
    except SessionExpiredError:
        raise

    cached_profile = await redis_ops.get_cached_officer_profile(officer_id)
    if cached_profile:
        if not cached_profile.get("is_active", True):
            raise AccountInactiveError()
        return CurrentOfficerContext(
            officer_id=cached_profile["officer_id"],
            role_name=cached_profile["role_name"],
            department_id=cached_profile.get("department_id"),
            permissions=cached_profile.get("permissions", []),
        )

    repo = AuthRepository(session)
    officer = await repo.get_officer_by_id(officer_id)
    if not officer:
        raise InvalidTokenError("Not authenticated")

    if not officer.is_active:
        raise AccountInactiveError()

    if officer.role.role_name != token_role:
        await redis_ops.delete_session(session_id)
        raise InvalidTokenError("Not authenticated")

    permissions = AuthorizationService.resolve_permissions_for_role(officer.role.role_name)

    profile_data = {
        "officer_id": officer.officer_id,
        "role_name": officer.role.role_name,
        "department_id": officer.department_id,
        "permissions": sorted(permissions),
        "is_active": officer.is_active,
    }
    await redis_ops.cache_officer_profile(officer_id, profile_data)

    return CurrentOfficerContext(**profile_data)


def require_permission(permission: str):
    async def _dependency(
        current_officer: CurrentOfficerContext = Depends(get_current_officer),
    ) -> CurrentOfficerContext:
        AuthorizationService(current_officer).require_permission(permission)
        return current_officer

    return _dependency


def require_any_permission(permissions: list[str]):
    async def _dependency(
        current_officer: CurrentOfficerContext = Depends(get_current_officer),
    ) -> CurrentOfficerContext:
        AuthorizationService(current_officer).require_any_permission(permissions)
        return current_officer

    return _dependency


def require_role(role_name: str):
    async def _dependency(
        current_officer: CurrentOfficerContext = Depends(get_current_officer),
    ) -> CurrentOfficerContext:
        AuthorizationService(current_officer).require_role(role_name)
        return current_officer

    return _dependency


def require_superadmin():
    async def _dependency(
        current_officer: CurrentOfficerContext = Depends(get_current_officer),
    ) -> CurrentOfficerContext:
        AuthorizationService(current_officer).require_superadmin()
        return current_officer

    return _dependency
