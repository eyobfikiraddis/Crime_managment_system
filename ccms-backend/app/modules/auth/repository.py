from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.auth.models import (
    AuthAuditLog,
    Officer,
    PasswordResetAudit,
    Person,
    Role,
)
from app.shared.enums import AuthEventEnum


class AuthRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_person_by_national_id(self, national_id: str) -> Person | None:
        result = await self.session.execute(
            select(Person).where(
                Person.national_id == national_id,
                Person.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    async def get_officer_by_person_id(self, person_id: int) -> Officer | None:
        result = await self.session.execute(
            select(Officer)
            .options(
                selectinload(Officer.role),
                selectinload(Officer.person),
                selectinload(Officer.department),
            )
            .where(
                Officer.person_id == person_id,
                Officer.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    async def get_officer_by_id(self, officer_id: int) -> Officer | None:
        result = await self.session.execute(
            select(Officer)
            .options(
                selectinload(Officer.role),
                selectinload(Officer.person),
                selectinload(Officer.department),
            )
            .where(
                Officer.officer_id == officer_id,
                Officer.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    async def update_officer_password_hash(self, officer: Officer, new_hash: str) -> Officer:
        officer.password_hash = new_hash
        officer.updated_at = datetime.now(tz=timezone.utc)
        self.session.add(officer)
        await self.session.flush()
        return officer

    async def update_officer_last_login(self, officer: Officer) -> None:
        officer.last_login_at = datetime.now(tz=timezone.utc)
        self.session.add(officer)
        await self.session.flush()

    async def write_auth_audit_log(
        self,
        officer_id: int | None,
        event_type: AuthEventEnum,
        ip_address: str,
        user_agent: str,
        success: bool,
        failure_reason: str | None = None,
        metadata: dict | None = None,
    ) -> None:
        log = AuthAuditLog(
            officer_id=officer_id,
            event_type=event_type,
            ip_address=ip_address,
            user_agent=user_agent,
            success=success,
            failure_reason=failure_reason,
            metadata=metadata,
        )
        self.session.add(log)
        await self.session.flush()

    async def write_password_reset_audit(
        self,
        officer_id: int,
        ip_address: str,
        reset_token_hash: str,
    ) -> None:
        from datetime import timedelta

        now = datetime.now(tz=timezone.utc)
        audit = PasswordResetAudit(
            officer_id=officer_id,
            requested_at=now,
            reset_token_hash=reset_token_hash,
            ip_address=ip_address,
            expired_at=now + timedelta(seconds=900),
            used=False,
        )
        self.session.add(audit)
        await self.session.flush()

    async def complete_password_reset_audit(self, officer_id: int, token_hash: str) -> None:
        now = datetime.now(tz=timezone.utc)
        result = await self.session.execute(
            select(PasswordResetAudit).where(
                PasswordResetAudit.officer_id == officer_id,
                PasswordResetAudit.reset_token_hash == token_hash,
                PasswordResetAudit.used.is_(False),
            )
        )
        audit = result.scalar_one_or_none()
        if audit:
            audit.completed_at = now
            audit.used = True
            self.session.add(audit)
            await self.session.flush()
