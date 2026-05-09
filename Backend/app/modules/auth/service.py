from __future__ import annotations

import hashlib
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.config.settings import settings
from app.core import redis_client as redis_ops
from app.core.logging import get_security_logger
from app.core.security import (
    create_access_token,
    decode_token,
    generate_secure_token,
    hash_password,
    needs_rehash,
    verify_password,
)
from app.core.session_manager import invalidate_session, validate_session_activity
from app.core.token_enforcement import (
    decode_and_validate_refresh_token,
    ensure_token_not_revoked,
    normalize_exp,
    revoke_token_jti,
)
from app.modules.auth.exceptions import (
    AccountInactiveError,
    IncorrectCurrentPasswordError,
    InvalidCredentialsError,
    InvalidResetTokenError,
    InvalidTokenError,
    SamePasswordError,
    SessionExpiredError,
)
from app.modules.auth.repository import AuthRepository
from app.modules.auth.schemas.responses import AccessTokenResponse, TokenResponse
from app.modules.auth.session_service import SessionService
from app.shared.enums import AuthEventEnum
from app.shared.response_schemas import MessageResponse

security_logger = get_security_logger()


class AuthService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = AuthRepository(session)

    async def login(
        self,
        national_id: str,
        password: str,
        ip_address: str,
        user_agent: str,
    ) -> TokenResponse:
        national_id_hash = hashlib.sha256(national_id.encode()).hexdigest()

        try:
            person = await self.repo.get_person_by_national_id(national_id)
            if not person:
                await self.repo.write_auth_audit_log(
                    officer_id=None,
                    event_type=AuthEventEnum.login_failure,
                    ip_address=ip_address,
                    user_agent=user_agent,
                    success=False,
                    failure_reason="person_not_found",
                    metadata={"national_id_hash": national_id_hash},
                )
                raise InvalidCredentialsError()

            officer = await self.repo.get_officer_by_person_id(person.person_id)
            if not officer:
                await self.repo.write_auth_audit_log(
                    officer_id=None,
                    event_type=AuthEventEnum.login_failure,
                    ip_address=ip_address,
                    user_agent=user_agent,
                    success=False,
                    failure_reason="officer_not_found",
                    metadata={"national_id_hash": national_id_hash},
                )
                raise InvalidCredentialsError()

            if not verify_password(password, officer.password_hash):
                await self.repo.write_auth_audit_log(
                    officer_id=officer.officer_id,
                    event_type=AuthEventEnum.login_failure,
                    ip_address=ip_address,
                    user_agent=user_agent,
                    success=False,
                    failure_reason="invalid_password",
                    metadata={"national_id_hash": national_id_hash},
                )
                raise InvalidCredentialsError()

            if not officer.is_active or await redis_ops.is_officer_blocked(officer.officer_id):
                await self.repo.write_auth_audit_log(
                    officer_id=officer.officer_id,
                    event_type=AuthEventEnum.login_failure,
                    ip_address=ip_address,
                    user_agent=user_agent,
                    success=False,
                    failure_reason="account_inactive",
                    metadata={"national_id_hash": national_id_hash},
                )
                raise AccountInactiveError()

            if needs_rehash(officer.password_hash):
                new_hash = hash_password(password)
                await self.repo.update_officer_password_hash(officer, new_hash)

            session_service = SessionService()
            tokens = await session_service.start_session(
                officer_id=officer.officer_id,
                role_name=officer.role.role_name,
                department_id=officer.department_id,
                ip_address=ip_address,
                user_agent=user_agent,
            )

            await self.repo.update_officer_last_login(officer)
            await self.repo.write_auth_audit_log(
                officer_id=officer.officer_id,
                event_type=AuthEventEnum.login_success,
                ip_address=ip_address,
                user_agent=user_agent,
                success=True,
                metadata={"session_id": tokens.session_id},
            )

            security_logger.info(
                "login_success",
                officer_id=officer.officer_id,
                ip_address=ip_address,
                session_id=tokens.session_id,
            )

            return TokenResponse(
                access_token=tokens.access_token,
                refresh_token=tokens.refresh_token,
                token_type="bearer",
                expires_in=settings.ACCESS_TOKEN_TTL_SECONDS,
                session_id=tokens.session_id,
            )

        except (InvalidCredentialsError, AccountInactiveError):
            raise
        except Exception:
            raise

    async def refresh_access_token(self, refresh_token: str) -> AccessTokenResponse:
        from jose import JWTError

        try:
            payload = decode_and_validate_refresh_token(refresh_token)
        except JWTError:
            raise InvalidTokenError("Invalid or expired refresh token")

        jti: str = payload.get("jti", "")
        try:
            await ensure_token_not_revoked(jti)
        except InvalidTokenError:
            raise InvalidTokenError("Invalid or expired refresh token")

        session_id: str = payload.get("session_id", "")
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

        officer_id = int(payload.get("sub", 0))
        if await redis_ops.is_officer_blocked(officer_id):
            raise AccountInactiveError()

        officer = await self.repo.get_officer_by_id(officer_id)
        if not officer:
            raise InvalidTokenError("Account not found")
        if not officer.is_active:
            raise AccountInactiveError()

        new_access_token, new_jti, new_exp = create_access_token(
            officer_id=officer.officer_id,
            role_name=officer.role.role_name,
            department_id=officer.department_id,
            session_id=session_id,
        )

        refresh_exp = normalize_exp(payload) or new_exp
        await redis_ops.update_session_tokens(
            session_id=session_id,
            access_jti=new_jti,
            access_exp=new_exp,
            refresh_jti=jti,
            refresh_exp=refresh_exp,
        )

        security_logger.info(
            "token_refresh",
            officer_id=officer_id,
            session_id=session_id,
        )

        return AccessTokenResponse(
            access_token=new_access_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_TTL_SECONDS,
        )

    async def logout(
        self,
        access_token_payload: dict,
        refresh_token: str | None,
        officer_id: int,
    ) -> MessageResponse:
        jti: str = access_token_payload.get("jti", "")
        exp: int | None = normalize_exp(access_token_payload)
        session_id: str = access_token_payload.get("session_id", "")
        refresh_jti: str | None = None
        refresh_exp: int | None = None
        if refresh_token:
            from jose import JWTError

            try:
                rt_payload = decode_token(refresh_token, verify_expiry=False)
                refresh_jti = rt_payload.get("jti", "")
                refresh_exp = normalize_exp(rt_payload)
            except JWTError:
                pass

        if session_id:
            await invalidate_session(
                session_id=session_id,
                officer_id=officer_id,
                access_jti=jti,
                access_exp=exp,
                refresh_jti=refresh_jti,
                refresh_exp=refresh_exp,
            )
        else:
            await revoke_token_jti(jti, exp)
            await revoke_token_jti(refresh_jti, refresh_exp)
            await redis_ops.invalidate_officer_profile_cache(officer_id)

        security_logger.info(
            "logout",
            officer_id=officer_id,
            session_id=session_id,
            logout_type="voluntary",
        )

        return MessageResponse(message="Logged out successfully")

    async def request_password_reset(
        self, national_id: str, ip_address: str
    ) -> MessageResponse:
        national_id_hash = hashlib.sha256(national_id.encode()).hexdigest()
        person = await self.repo.get_person_by_national_id(national_id)
        if person:
            officer = await self.repo.get_officer_by_person_id(person.person_id)
            if officer:
                token = generate_secure_token()
                token_hash = hashlib.sha256(token.encode()).hexdigest()
                await redis_ops.store_password_reset_token(token, officer.officer_id)
                await self.repo.write_password_reset_audit(
                    officer_id=officer.officer_id,
                    ip_address=ip_address,
                    reset_token_hash=token_hash,
                )

        security_logger.info(
            "password_reset_requested",
            national_id_hash=national_id_hash,
            ip_address=ip_address,
        )

        return MessageResponse(
            message="If an account exists with that national ID, a reset link has been sent"
        )

    async def confirm_password_reset(
        self,
        token: str,
        new_password: str,
        ip_address: str,
    ) -> MessageResponse:
        officer_id = await redis_ops.get_password_reset_token(token)
        if not officer_id:
            raise InvalidResetTokenError()

        officer = await self.repo.get_officer_by_id(officer_id)
        if not officer:
            raise InvalidResetTokenError()

        if verify_password(new_password, officer.password_hash):
            raise SamePasswordError()

        new_hash = hash_password(new_password)
        await self.repo.update_officer_password_hash(officer, new_hash)

        await redis_ops.delete_password_reset_token(token)
        # await redis_ops.block_officer(officer_id=officer_id, ttl=604800)
        await redis_ops.remove_officer_sessions(officer_id=officer_id)
        await redis_ops.invalidate_officer_profile_cache(officer_id=officer_id)

        token_hash = hashlib.sha256(token.encode()).hexdigest()
        await self.repo.complete_password_reset_audit(officer_id, token_hash)

        await self.repo.write_auth_audit_log(
            officer_id=officer_id,
            event_type=AuthEventEnum.password_reset_complete,
            ip_address=ip_address,
            user_agent="",
            success=True,
        )

        security_logger.info(
            "password_reset_completed",
            officer_id=officer_id,
            ip_address=ip_address,
        )

        return MessageResponse(
            message="Password reset successful. Please log in with your new password."
        )

    async def change_password(
        self,
        officer_id: int,
        current_password: str,
        new_password: str,
        current_session_id: str,
        current_access_payload: dict,
        ip_address: str,
        user_agent: str,
    ) -> TokenResponse:
        officer = await self.repo.get_officer_by_id(officer_id)
        if not officer:
            raise InvalidCredentialsError()

        if not verify_password(current_password, officer.password_hash):
            raise IncorrectCurrentPasswordError()

        if verify_password(new_password, officer.password_hash):
            raise SamePasswordError()

        new_hash = hash_password(new_password)
        await self.repo.update_officer_password_hash(officer, new_hash)

        await revoke_token_jti(
            current_access_payload.get("jti"),
            normalize_exp(current_access_payload),
        )
        # await redis_ops.block_officer(officer_id=officer_id, ttl=604800) Why do we want to block the officer here? This would prevent them from logging in again until the block expires, which might not be desirable after a password change. Instead, we should just invalidate existing sessions and tokens.
        await redis_ops.remove_officer_sessions(officer_id=officer_id)
        await redis_ops.invalidate_officer_profile_cache(officer_id=officer_id)

        session_service = SessionService()
        tokens = await session_service.start_session(
            officer_id=officer.officer_id,
            role_name=officer.role.role_name,
            department_id=officer.department_id,
            ip_address=ip_address,
            user_agent=user_agent,
        )

        await self.repo.write_auth_audit_log(
            officer_id=officer_id,
            event_type=AuthEventEnum.password_change,
            ip_address=ip_address,
            user_agent=user_agent,
            success=True,
        )

        security_logger.info(
            "password_changed",
            officer_id=officer_id,
            ip_address=ip_address,
        )

        return TokenResponse(
            access_token=tokens.access_token,
            refresh_token=tokens.refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_TTL_SECONDS,
            session_id=tokens.session_id,
        )
