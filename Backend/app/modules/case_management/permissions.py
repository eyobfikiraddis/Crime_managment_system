from __future__ import annotations

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.auth.schemas.responses import CurrentOfficerContext
from app.modules.case_management.models import Case, CaseOfficer, CasePermission
from app.shared.enums import AccessLevelEnum, RoleNameEnum


def level_satisfies(actual: str, required: str) -> bool:
    if actual == AccessLevelEnum.admin.value:
        return True
    if required == AccessLevelEnum.read.value:
        return actual in (
            AccessLevelEnum.read.value,
            AccessLevelEnum.write.value,
            AccessLevelEnum.admin.value,
        )
    if required == AccessLevelEnum.write.value:
        return actual in (AccessLevelEnum.write.value, AccessLevelEnum.admin.value)
    return actual == required


async def check_case_access(
    session: AsyncSession,
    officer: CurrentOfficerContext,
    case: Case,
    minimum_level: str = "read",
) -> bool:
    if officer.role_name in (RoleNameEnum.admin.value, RoleNameEnum.superadmin.value):
        return True

    if officer.role_name == RoleNameEnum.department_head.value:
        if case.lead_officer_id == officer.officer_id:
            return True
        if case.lead_officer and case.lead_officer.department_id == officer.department_id:
            return True
        for co in case.case_officers:
            if (
                co.active
                and co.officer
                and co.officer.department_id == officer.department_id
            ):
                return True

    result = await session.execute(
        select(CasePermission)
        .where(
            CasePermission.case_id == case.case_id,
            CasePermission.officer_id == officer.officer_id,
            CasePermission.revoked_at.is_(None),
        )
        .limit(1)
    )
    perm = result.scalar_one_or_none()
    if perm:
        al = (
            perm.access_level.value
            if hasattr(perm.access_level, "value")
            else str(perm.access_level)
        )
        if level_satisfies(al, minimum_level):
            return True

    assig = await session.execute(
        select(CaseOfficer)
        .where(
            CaseOfficer.case_id == case.case_id,
            CaseOfficer.officer_id == officer.officer_id,
            CaseOfficer.active.is_(True),
        )
        .limit(1)
    )
    if assig.scalar_one_or_none() is not None:
        if minimum_level in ("read", "write"):
            return True

    if case.lead_officer_id == officer.officer_id:
        return minimum_level in ("read", "write")

    return False


async def load_case_for_access(
    session: AsyncSession, case_id: int
) -> Case | None:
    from app.modules.auth.models import Officer

    result = await session.execute(
        select(Case)
        .options(
            selectinload(Case.case_officers).selectinload(CaseOfficer.officer).selectinload(
                Officer.person
            ),
            selectinload(Case.lead_officer).selectinload(Officer.person),
        )
        .where(Case.case_id == case_id, Case.deleted_at.is_(None))
    )
    return result.scalar_one_or_none()
