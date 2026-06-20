from __future__ import annotations

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.modules.auth.dependencies import get_current_officer, require_permission
from app.core.permissions_registry import AUTH_ACTIVITY_PING, AUTH_LOGOUT, AUTH_PASSWORD_CHANGE
from app.core.rate_limiter import RATE_LIMITS, limiter
from app.core.token_enforcement import decode_and_validate_access_token
from app.modules.auth.exceptions import InvalidTokenError
from app.modules.auth.schemas.requests import (
    LoginRequest,
    LogoutRequest,
    PasswordChangeRequest,
    PasswordResetConfirmPayload,
    PasswordResetRequestPayload,
    RefreshTokenRequest,
)
from app.modules.auth.schemas.responses import (
    AccessTokenResponse,
    ActivityPingResponse,
    CurrentOfficerContext,
    TokenResponse,
)
from app.modules.auth.service import AuthService
from app.shared.response_schemas import MessageResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse, status_code=200)
@limiter.limit(RATE_LIMITS["login_ip"])
async def login(
    request: Request,
    body: LoginRequest,
    session: AsyncSession = Depends(get_db_session),
) -> TokenResponse:
    ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "")
    service = AuthService(session)
    return await service.login(
        national_id=body.national_id,
        password=body.password,
        ip_address=ip,
        user_agent=user_agent,
    )


@router.get("/session", response_model=dict, status_code=200)
async def get_session_info(
    request: Request,
    current_officer: CurrentOfficerContext = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db_session),
) -> dict:
    from app.modules.auth.repository import AuthRepository
    from app.modules.auth.authorization_service import AuthorizationService
    from datetime import datetime, timezone

    repo = AuthRepository(session)
    officer = await repo.get_officer_by_id(current_officer.officer_id)
    if not officer:
        raise InvalidTokenError("Not authenticated")

    permissions = AuthorizationService.resolve_permissions_for_role(officer.role.role_name)

    auth_header = request.headers.get("authorization", "")
    token = auth_header.replace("Bearer ", "").replace("bearer ", "").strip()
    try:
        payload = decode_and_validate_access_token(token)
    except Exception:
        raise InvalidTokenError("Not authenticated")

    session_id = payload.get("session_id", "")
    exp = payload.get("exp")
    expires_at = datetime.fromtimestamp(exp, tz=timezone.utc).isoformat()

    first_name = officer.person.first_name
    last_name = officer.person.last_name
    mock_email = f"{first_name.lower()}.{last_name.lower()}@ccms.gov"

    return {
        "officer": {
            "id": str(officer.officer_id),
            "badgeNumber": officer.badge_number or "",
            "firstName": first_name,
            "lastName": last_name,
            "email": mock_email,
            "role": officer.role.role_name.upper(),
            "departmentId": str(officer.department_id) if officer.department_id else None,
            "permissions": sorted(list(permissions)),
            "isActive": officer.is_active,
            "lastLoginAt": officer.last_login_at.isoformat() if officer.last_login_at else None,
        },
        "sessionId": session_id,
        "expiresAt": expires_at,
    }


@router.post("/refresh", response_model=AccessTokenResponse, status_code=200)
async def refresh_token(
    body: RefreshTokenRequest,
    session: AsyncSession = Depends(get_db_session),
) -> AccessTokenResponse:
    service = AuthService(session)
    return await service.refresh_access_token(body.refresh_token)


@router.post("/logout", response_model=MessageResponse, status_code=200)
async def logout(
    request: Request,
    body: LogoutRequest,
    current_officer: CurrentOfficerContext = Depends(require_permission(AUTH_LOGOUT)),
    session: AsyncSession = Depends(get_db_session),
) -> MessageResponse:
    auth_header = request.headers.get("authorization", "")
    token = auth_header.replace("Bearer ", "").replace("bearer ", "").strip()
    try:
        payload = decode_and_validate_access_token(token)
    except Exception:
        raise InvalidTokenError("Not authenticated")

    service = AuthService(session)
    return await service.logout(
        access_token_payload=payload,
        refresh_token=body.refresh_token,
        officer_id=current_officer.officer_id,
    )


@router.post("/activity-ping", response_model=ActivityPingResponse, status_code=200)
async def activity_ping(
    current_officer: CurrentOfficerContext = Depends(require_permission(AUTH_ACTIVITY_PING)),
) -> ActivityPingResponse:
    from datetime import datetime, timezone

    return ActivityPingResponse(
        active=True,
        last_activity=datetime.now(tz=timezone.utc).isoformat(),
    )


@router.post("/password-reset-request", response_model=MessageResponse, status_code=200)
@limiter.limit(RATE_LIMITS["password_reset_request"])
async def password_reset_request(
    request: Request,
    body: PasswordResetRequestPayload,
    session: AsyncSession = Depends(get_db_session),
) -> MessageResponse:
    ip = request.client.host if request.client else "unknown"
    service = AuthService(session)
    return await service.request_password_reset(
        national_id=body.national_id,
        ip_address=ip,
    )


@router.post("/password-reset-confirm", response_model=MessageResponse, status_code=200)
@limiter.limit(RATE_LIMITS["password_reset_confirm"])
async def password_reset_confirm(
    request: Request,
    body: PasswordResetConfirmPayload,
    session: AsyncSession = Depends(get_db_session),
) -> MessageResponse:
    ip = request.client.host if request.client else "unknown"
    service = AuthService(session)
    return await service.confirm_password_reset(
        token=body.token,
        new_password=body.new_password,
        ip_address=ip,
    )


@router.patch("/password", response_model=TokenResponse, status_code=200)
async def change_password(
    request: Request,
    body: PasswordChangeRequest,
    current_officer: CurrentOfficerContext = Depends(require_permission(AUTH_PASSWORD_CHANGE)),
    session: AsyncSession = Depends(get_db_session),
) -> TokenResponse:
    auth_header = request.headers.get("authorization", "")
    token = auth_header.replace("Bearer ", "").replace("bearer ", "").strip()
    try:
        payload = decode_and_validate_access_token(token)
    except Exception:
        raise InvalidTokenError("Not authenticated")

    session_id: str = payload.get("session_id", "")
    ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "")

    service = AuthService(session)
    return await service.change_password(
        officer_id=current_officer.officer_id,
        current_password=body.current_password,
        new_password=body.new_password,
        current_session_id=session_id,
        current_access_payload=payload,
        ip_address=ip,
        user_agent=user_agent,
    )
