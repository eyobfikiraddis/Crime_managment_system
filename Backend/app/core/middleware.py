from __future__ import annotations

import time
from collections.abc import Callable

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

import structlog

from app.config.settings import settings
from app.core.logging import generate_request_id, get_logger
from app.core.security_middleware import SecurityMiddleware, SessionEnforcementMiddleware

logger = get_logger(__name__)


class RequestContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        request_id = generate_request_id()
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(
            request_id=request_id,
            method=request.method,
            path=request.url.path,
            client_ip=request.client.host if request.client else "unknown",
        )

        start_time = time.monotonic()
        response = await call_next(request)
        duration_ms = round((time.monotonic() - start_time) * 1000, 2)

        skip_log_paths = {
            "/api/v1/health",
            "/api/v1/readiness",
            "/api/v1/auth/activity-ping",
        }
        if request.url.path not in skip_log_paths:
            logger.info(
                "request_completed",
                status_code=response.status_code,
                duration_ms=duration_ms,
            )

        response.headers["X-Request-ID"] = request_id
        return response


def register_middleware(app: FastAPI) -> None:
    public_paths = {
        "/api/v1/health",
        "/api/v1/readiness",
        "/api/v1/auth/login",
        "/api/v1/auth/refresh",
        "/api/v1/auth/password-reset-request",
        "/api/v1/auth/password-reset-confirm",
    }

    if settings.APP_ENV != "production":
        public_paths.update({"/api/docs", "/api/redoc", "/api/openapi.json"})

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
        expose_headers=["X-Request-ID"],
    )

    if settings.APP_ENV == "production":
        app.add_middleware(
            TrustedHostMiddleware,
            allowed_hosts=["ccms.internal", "admin.ccms.internal"],
        )

    app.add_middleware(RequestContextMiddleware)

    app.add_middleware(SessionEnforcementMiddleware, public_paths=public_paths)

    app.add_middleware(
        SecurityMiddleware,
        max_body_size=settings.REQUEST_SIZE_LIMIT_BYTES,
        allow_body_token_paths={
            "/api/v1/auth/refresh",
            "/api/v1/auth/logout",
        },
    )
