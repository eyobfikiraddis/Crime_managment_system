from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import text

from app.config.settings import settings
from app.core.database import async_session_factory, check_database_health
from app.core.logging import get_logger
from app.core.permissions_registry import validate_permissions_registry
from app.core.redis_client import check_redis_health
from app.shared.enums import RoleNameEnum

logger = get_logger(__name__)

REQUIRED_CASE_STATUSES = {
    "open",
    "under_investigation",
    "referred_to_court",
    "closed",
    "archived",
}

REQUIRED_ROLES = {role.value for role in RoleNameEnum}


async def run_startup_checks() -> None:
    logger.info("ccms_starting", version=settings.APP_VERSION, env=settings.APP_ENV)

    db_health = await check_database_health()
    if db_health.get("status") != "healthy":
        logger.error("startup_db_failed", detail=db_health)
        raise RuntimeError(f"Database connection failed: {db_health}")

    redis_health = await check_redis_health()
    if redis_health.get("status") != "healthy":
        logger.error("startup_redis_failed", detail=redis_health)
        raise RuntimeError(f"Redis connection failed: {redis_health}")

    seed_status = await check_seed_data()
    if not seed_status["seed_case_status"]:
        missing = seed_status.get("missing_case_statuses", [])
        logger.error("startup_seed_missing", table="case_status", missing=missing)
        raise RuntimeError(f"Missing case_status rows: {sorted(missing)}")

    if not seed_status["seed_roles"]:
        missing = seed_status.get("missing_roles", [])
        logger.error("startup_seed_missing", table="role", missing=missing)
        raise RuntimeError(f"Missing role rows: {sorted(missing)}")

    permissions_ok, permission_errors = validate_permissions_registry()
    if not permissions_ok:
        logger.error("startup_permission_registry_invalid", errors=permission_errors)
        raise RuntimeError(f"Permission registry invalid: {permission_errors}")

    migrations_ok = await check_migrations()
    if not migrations_ok:
        logger.error("startup_migrations_failed")
        raise RuntimeError("Database migrations are not applied")

    logger.info(
        "ccms_ready",
        db_latency_ms=db_health.get("latency_ms"),
        redis_latency_ms=redis_health.get("latency_ms"),
    )


async def build_readiness_checks() -> dict[str, bool]:
    db_health = await check_database_health()
    redis_health = await check_redis_health()
    seed_status = await check_seed_data()
    permissions_ok, _permission_errors = validate_permissions_registry()
    migrations_ok = await check_migrations()

    return {
        "database": db_health.get("status") == "healthy",
        "redis": redis_health.get("status") == "healthy",
        "seed_case_status": seed_status["seed_case_status"],
        "seed_roles": seed_status["seed_roles"],
        "migrations": migrations_ok,
        "permissions": permissions_ok,
    }


async def check_seed_data() -> dict[str, object]:
    missing_statuses: list[str] = []
    missing_roles: list[str] = []

    try:
        async with async_session_factory() as session:
            status_result = await session.execute(text("SELECT status_name FROM case_status"))
            status_values = {row[0] for row in status_result.fetchall()}
            missing_statuses = sorted(REQUIRED_CASE_STATUSES - status_values)

            role_result = await session.execute(text("SELECT role_name FROM role"))
            role_values = {row[0] for row in role_result.fetchall()}
            missing_roles = sorted(REQUIRED_ROLES - role_values)
    except Exception as exc:
        logger.error("startup_seed_check_failed", error=str(exc))
        return {
            "seed_case_status": False,
            "seed_roles": False,
            "missing_case_statuses": sorted(REQUIRED_CASE_STATUSES),
            "missing_roles": sorted(REQUIRED_ROLES),
        }

    return {
        "seed_case_status": len(missing_statuses) == 0,
        "seed_roles": len(missing_roles) == 0,
        "missing_case_statuses": missing_statuses,
        "missing_roles": missing_roles,
    }


async def check_migrations() -> bool:
    try:
        async with async_session_factory() as session:
            await session.execute(text("SELECT version_num FROM alembic_version"))
        return True
    except Exception:
        return False


async def check_live_dependencies() -> dict[str, object]:
    timestamp = datetime.now(tz=timezone.utc).isoformat()
    db = await check_database_health()
    rd = await check_redis_health()

    return {
        "timestamp": timestamp,
        "database": db,
        "redis": rd,
        "version": settings.APP_VERSION,
    }
