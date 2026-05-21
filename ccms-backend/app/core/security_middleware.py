from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from collections.abc import Callable
from typing import Any

import structlog
from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from app.config.settings import settings
from app.core.session_manager import validate_session_activity
from app.core.token_enforcement import decode_and_validate_access_token, ensure_token_not_revoked, normalize_exp

security_logger = structlog.get_logger("security")

JWT_PATTERN = re.compile(r"^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$")


class SecurityMiddleware(BaseHTTPMiddleware):
    def __init__(
        self,
        app: Any,
        max_body_size: int,
        allow_body_token_paths: set[str],
    ) -> None:
        super().__init__(app)
        self.max_body_size = max_body_size
        self.allow_body_token_paths = allow_body_token_paths

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if not self._check_query_token_leak(request):
            return self._with_headers(
                JSONResponse(status_code=400, content={"detail": "Token leakage detected"})
            )

        if request.method in {"POST", "PUT", "PATCH"}:
            if not await self._check_body_size(request):
                return self._with_headers(
                    JSONResponse(status_code=413, content={"detail": "Request too large"})
                )
            if not await self._check_body_token_leak(request):
                return self._with_headers(
                    JSONResponse(status_code=400, content={"detail": "Token leakage detected"})
                )

        if self._is_suspicious_path(request.url.path):
            security_logger.warning("suspicious_path", path=request.url.path)
            return self._with_headers(
                JSONResponse(status_code=400, content={"detail": "Suspicious request"})
            )

        response = await call_next(request)
        return self._with_headers(response)

    async def _check_body_size(self, request: Request) -> bool:
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                if int(content_length) > self.max_body_size:
                    return False
            except ValueError:
                return False

        body = await request.body()
        return len(body) <= self.max_body_size

    def _check_query_token_leak(self, request: Request) -> bool:
        query_params = request.query_params
        for key, value in query_params.multi_items():
            if key in {"access_token", "refresh_token"}:
                security_logger.warning("token_in_query", path=request.url.path)
                return False
            if JWT_PATTERN.match(value or ""):
                security_logger.warning("token_like_query", path=request.url.path)
                return False

        return True

    async def _check_body_token_leak(self, request: Request) -> bool:
        if request.url.path in self.allow_body_token_paths:
            return True

        content_type = request.headers.get("content-type", "")
        if "application/json" not in content_type:
            return True

        body = await request.body()
        if not body:
            return True

        try:
            payload = json.loads(body)
        except json.JSONDecodeError:
            return True

        if isinstance(payload, dict):
            if "access_token" in payload or "refresh_token" in payload:
                security_logger.warning("token_in_body", path=request.url.path)
                return False

        return True

    def _is_suspicious_path(self, path: str) -> bool:
        return ".." in path or "\\" in path

    def _with_headers(self, response: Response) -> Response:
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["Permissions-Policy"] = "geolocation=(), camera=(), microphone=()"
        response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'; base-uri 'none'"
        return response


class SessionEnforcementMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: Any, public_paths: set[str]) -> None:
        super().__init__(app)
        self.public_paths = public_paths

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if request.method == "OPTIONS":
            return await call_next(request)

        if request.url.path in self.public_paths:
            return await call_next(request)

        auth_header = request.headers.get("authorization", "")
        if not auth_header.lower().startswith("bearer "):
            return JSONResponse(status_code=401, content={"detail": "Not authenticated"})

        token = auth_header.split(" ", 1)[1].strip()
        try:
            payload = decode_and_validate_access_token(token)
        except Exception:
            return JSONResponse(status_code=401, content={"detail": "Not authenticated"})

        jti = payload.get("jti")
        if not jti:
            return JSONResponse(status_code=401, content={"detail": "Not authenticated"})

        try:
            await ensure_token_not_revoked(jti)
        except Exception:
            return JSONResponse(status_code=401, content={"detail": "Not authenticated"})

        exp = normalize_exp(payload)
        now = datetime.now(tz=timezone.utc)
        try:
            await validate_session_activity(
                session_id=payload.get("session_id", ""),
                current_jti=jti,
                current_exp=exp,
                now=now,
            )
        except Exception:
            return JSONResponse(status_code=401, content={"detail": "Not authenticated"})

        return await call_next(request)
