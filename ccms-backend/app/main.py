from __future__ import annotations

from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator
from datetime import datetime, timezone

from fastapi import FastAPI, Request, Response, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.config.settings import settings
from app.core.database import check_database_health, engine
from app.core.exceptions import CCMSBaseException
from app.core.logging import configure_logging, get_logger
from app.core.middleware import register_middleware
from app.core.rate_limiter import limiter
from app.core.redis_client import check_redis_health, close_redis
from app.core.startup_checks import build_readiness_checks, run_startup_checks
from app.modules.auth.router import router as auth_router
from app.modules.arrest.router import arrests_router, case_arrests_router
from app.modules.case_management.router import router as cases_router
from app.modules.departments.router import router as departments_router
from app.modules.evidence.router import router as evidence_router
from app.modules.interrogation.router import router as interrogation_router
from app.modules.personnel.router import router as personnel_router
from app.modules.reporting.router import router as reporting_router
from app.modules.legal.router import (
    court_cases_router,
    charges_router,
    court_case_patch_router,
    standalone_charges_router,
)
from app.shared.response_schemas import HealthResponse, ReadinessResponse

configure_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    try:
        from scripts.seed_core_data import seed
        await seed()
        logger.info("database_seeding_completed")
    except Exception as e:
        logger.error("database_seeding_failed", error=str(e))

    await run_startup_checks()

    yield

    await close_redis()
    await engine.dispose()
    logger.info("ccms_shutdown")


app = FastAPI(
    title="Centralized Crime Management System",
    version=settings.APP_VERSION,
    description="CCMS Backend API - Internal Use Only",
    docs_url="/api/docs" if settings.APP_ENV != "production" else None,
    redoc_url="/api/redoc" if settings.APP_ENV != "production" else None,
    openapi_url="/api/openapi.json" if settings.APP_ENV != "production" else None,
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

register_middleware(app)


@app.exception_handler(CCMSBaseException)
async def ccms_exception_handler(request: Request, exc: CCMSBaseException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": [
                {"loc": list(err["loc"]), "msg": err["msg"]}
                for err in exc.errors()
            ]
        },
    )


# Health Endpoints

@app.get("/api/v1/health", response_model=HealthResponse, include_in_schema=False)
async def health_check() -> HealthResponse:
    from app.shared.response_schemas import HealthComponent

    db = await check_database_health()
    rd = await check_redis_health()

    db_status = db["status"]
    redis_status = rd["status"]
    overall = "healthy" if db_status == "healthy" and redis_status == "healthy" else "degraded"

    return HealthResponse(
        status=overall,
        timestamp=datetime.now(tz=timezone.utc).isoformat(),
        components={
            "database": HealthComponent(
                status=db_status,
                latency_ms=db.get("latency_ms"),
            ),
            "redis": HealthComponent(
                status=redis_status,
                latency_ms=rd.get("latency_ms"),
            ),
        },
        version=settings.APP_VERSION,
    )


@app.get("/api/v1/readiness", response_model=ReadinessResponse, include_in_schema=False)
async def readiness_check() -> ReadinessResponse | Response:
    checks = await build_readiness_checks()
    all_ready = all(checks.values())
    payload = ReadinessResponse(
        ready=all_ready,
        checks=checks,
    )
    if not all_ready:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content=payload.model_dump(),
        )
    return payload


# API Router Registration

app.include_router(auth_router, prefix="/api/v1")
app.include_router(arrests_router, prefix="/api/v1")
app.include_router(case_arrests_router, prefix="/api/v1")
app.include_router(personnel_router, prefix="/api/v1")
app.include_router(departments_router, prefix="/api/v1")
app.include_router(cases_router, prefix="/api/v1")
app.include_router(evidence_router, prefix="/api/v1")
app.include_router(interrogation_router, prefix="/api/v1")
app.include_router(reporting_router, prefix="/api/v1")
app.include_router(court_cases_router, prefix="/api/v1")
app.include_router(charges_router, prefix="/api/v1")
app.include_router(court_case_patch_router, prefix="/api/v1")
app.include_router(standalone_charges_router, prefix="/api/v1")
