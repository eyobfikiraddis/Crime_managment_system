from __future__ import annotations

from dataclasses import dataclass
import uuid

from app.core.security import create_access_token, create_refresh_token
from app.core.session_manager import create_session, enforce_concurrent_sessions


@dataclass(frozen=True)
class SessionTokens:
    access_token: str
    refresh_token: str
    session_id: str
    access_jti: str
    refresh_jti: str
    access_exp: int
    refresh_exp: int


class SessionService:
    async def start_session(
        self,
        officer_id: int,
        role_name: str,
        department_id: int | None,
        ip_address: str,
        user_agent: str,
    ) -> SessionTokens:
        await enforce_concurrent_sessions(officer_id)

        session_id = str(uuid.uuid4())
        access_token, access_jti, access_exp = create_access_token(
            officer_id=officer_id,
            role_name=role_name,
            department_id=department_id,
            session_id=session_id,
        )
        refresh_token, refresh_jti, refresh_exp = create_refresh_token(
            officer_id=officer_id,
            session_id=session_id,
        )

        await create_session(
            session_id=session_id,
            officer_id=officer_id,
            ip_address=ip_address,
            user_agent=user_agent,
            access_jti=access_jti,
            access_exp=access_exp,
            refresh_jti=refresh_jti,
            refresh_exp=refresh_exp,
        )

        return SessionTokens(
            access_token=access_token,
            refresh_token=refresh_token,
            session_id=session_id,
            access_jti=access_jti,
            refresh_jti=refresh_jti,
            access_exp=access_exp,
            refresh_exp=refresh_exp,
        )
