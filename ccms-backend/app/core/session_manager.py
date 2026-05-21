from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

import structlog

from app.config.settings import settings
from app.core import redis_client as redis_ops
from app.core.token_enforcement import revoke_token_jti
from app.modules.auth.exceptions import SessionExpiredError

security_logger = structlog.get_logger("security")


async def create_session(
    session_id: str,
    officer_id: int,
    ip_address: str,
    user_agent: str,
    access_jti: str,
    access_exp: int,
    refresh_jti: str,
    refresh_exp: int,
) -> None:
    await redis_ops.write_session_metadata(
        session_id=session_id,
        officer_id=officer_id,
        ip_address=ip_address,
        user_agent=user_agent,
        ttl=settings.MAX_SESSION_SECONDS,
    )
    await redis_ops.add_officer_session(
        officer_id=officer_id,
        session_id=session_id,
        ttl=settings.MAX_SESSION_SECONDS,
    )
    await redis_ops.update_session_tokens(
        session_id=session_id,
        access_jti=access_jti,
        access_exp=access_exp,
        refresh_jti=refresh_jti,
        refresh_exp=refresh_exp,
    )


async def validate_session_activity(
    session_id: str,
    current_jti: str,
    now: datetime,
    current_exp: int | None = None,
) -> dict[str, Any]:
    session_meta = await redis_ops.get_session_metadata(session_id)
    if not session_meta:
        raise SessionExpiredError()

    last_activity_str = session_meta.get("last_activity", "")
    created_at_str = session_meta.get("created_at", "")

    try:
        last_activity = datetime.fromisoformat(last_activity_str)
        if last_activity.tzinfo is None:
            last_activity = last_activity.replace(tzinfo=timezone.utc)
    except ValueError:
        await _invalidate_session(session_meta, session_id, current_jti, current_exp)
        raise SessionExpiredError()

    try:
        created_at = datetime.fromisoformat(created_at_str)
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)
    except ValueError:
        await _invalidate_session(session_meta, session_id, current_jti, current_exp)
        raise SessionExpiredError()

    idle_seconds = (now - last_activity).total_seconds()
    lifetime_seconds = (now - created_at).total_seconds()

    if idle_seconds > settings.IDLE_TIMEOUT_SECONDS:
        await _invalidate_session(session_meta, session_id, current_jti, current_exp)
        raise SessionExpiredError()

    if lifetime_seconds > settings.MAX_SESSION_SECONDS:
        await _invalidate_session(session_meta, session_id, current_jti, current_exp)
        raise SessionExpiredError()

    await touch_session(session_id, session_meta.get("officer_id"), now)
    return session_meta


async def touch_session(session_id: str, officer_id_value: str | int | None, now: datetime) -> None:
    now_iso = now.isoformat()
    await redis_ops.update_session_last_activity(session_id, now_iso)
    await redis_ops.extend_session_ttl(session_id, settings.MAX_SESSION_SECONDS)

    if officer_id_value is not None:
        try:
            officer_id = int(officer_id_value)
        except ValueError:
            return
        await redis_ops.extend_officer_sessions_ttl(officer_id, settings.MAX_SESSION_SECONDS)


async def enforce_concurrent_sessions(officer_id: int) -> None:
    max_sessions = settings.MAX_CONCURRENT_SESSIONS_PER_OFFICER
    if max_sessions <= 0:
        return

    session_ids = await redis_ops.get_officer_sessions(officer_id)
    if len(session_ids) >= max_sessions:
        await redis_ops.remove_officer_sessions(officer_id)
        await redis_ops.invalidate_officer_profile_cache(officer_id)
        security_logger.info(
            "session_concurrency_enforced",
            officer_id=officer_id,
            revoked_sessions=len(session_ids),
        )


async def invalidate_session(
    session_id: str,
    officer_id: int | None = None,
    access_jti: str | None = None,
    access_exp: int | None = None,
    refresh_jti: str | None = None,
    refresh_exp: int | None = None,
) -> None:
    await revoke_token_jti(access_jti, access_exp)
    await revoke_token_jti(refresh_jti, refresh_exp)

    await redis_ops.delete_session(session_id)

    if officer_id is not None:
        await redis_ops.remove_officer_session(officer_id, session_id)
        await redis_ops.invalidate_officer_profile_cache(officer_id)


async def _invalidate_session(
    session_meta: dict[str, Any],
    session_id: str,
    current_jti: str,
    current_exp: int | None,
) -> None:
    officer_id_value = session_meta.get("officer_id")
    access_jti = session_meta.get("access_jti") or current_jti
    refresh_jti = session_meta.get("refresh_jti")

    access_exp = _safe_int(session_meta.get("access_exp")) or current_exp
    refresh_exp = _safe_int(session_meta.get("refresh_exp"))

    officer_id: int | None = None
    if officer_id_value is not None:
        try:
            officer_id = int(officer_id_value)
        except ValueError:
            officer_id = None

    await invalidate_session(
        session_id=session_id,
        officer_id=officer_id,
        access_jti=access_jti,
        access_exp=access_exp,
        refresh_jti=refresh_jti,
        refresh_exp=refresh_exp,
    )


def _safe_int(value: Any) -> int | None:
    if value is None:
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None
