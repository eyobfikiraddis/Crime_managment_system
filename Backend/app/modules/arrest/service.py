from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import ConflictError, NotFoundError, ValidationError
from app.modules.arrest.repository import ArrestRepository
from app.modules.arrest.schemas.requests import ArrestCreateRequest, ArrestUpdateRequest
from app.modules.arrest.schemas.responses import ArrestResponse
from app.modules.auth.models import Location, Officer
from app.modules.auth.schemas.responses import CurrentOfficerContext
from app.modules.case_management.exceptions import CaseAccessDeniedError, CaseNotFoundError
from app.modules.case_management.models import Arrest, Case
from app.modules.case_management.permissions import check_case_access, load_case_for_access
from app.modules.case_management.repository import CaseRepository
from app.modules.personnel.models import Suspect
from app.shared.enums import RoleNameEnum
from app.shared.pagination import PaginatedResponse


class ArrestService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = ArrestRepository(session)
        self.case_repo = CaseRepository(session)

    def _role_allows(self, requester: CurrentOfficerContext) -> bool:
        return requester.role_name in {
            RoleNameEnum.investigator.value,
            RoleNameEnum.department_head.value,
            RoleNameEnum.admin.value,
            RoleNameEnum.superadmin.value,
        }

    async def _get_officer_name(self, officer_id: int) -> str:
        result = await self.session.execute(
            select(Officer).options(selectinload(Officer.person)).where(
                Officer.officer_id == officer_id,
                Officer.deleted_at.is_(None),
            )
        )
        officer = result.scalar_one_or_none()
        if officer and officer.person:
            return f"{officer.person.first_name} {officer.person.last_name}"
        return "Unknown Officer"

    async def _get_suspect_name(self, suspect_id: int) -> str | None:
        result = await self.session.execute(
            select(Suspect).options(selectinload(Suspect.person)).where(
                Suspect.suspect_id == suspect_id,
                Suspect.deleted_at.is_(None),
            )
        )
        suspect = result.scalar_one_or_none()
        if suspect and suspect.person:
            return f"{suspect.person.first_name} {suspect.person.last_name}"
        return None

    async def _get_location_name(self, location_id: int | None) -> str | None:
        if location_id is None:
            return None
        loc = await self.session.get(Location, location_id)
        return loc.name if loc else None

    async def create_arrest(
        self,
        requester: CurrentOfficerContext,
        body: ArrestCreateRequest,
    ) -> ArrestResponse:
        if not self._role_allows(requester):
            raise CaseAccessDeniedError("Insufficient role for arrest creation")

        now = datetime.now(tz=timezone.utc)
        if body.arrest_datetime > now:
            raise ValidationError("Arrest date cannot be in the future")

        suspect_result = await self.session.execute(
            select(Suspect).where(
                Suspect.suspect_id == body.suspect_id,
                Suspect.deleted_at.is_(None),
            )
        )
        if suspect_result.scalar_one_or_none() is None:
            raise NotFoundError("Suspect not found")

        officer_result = await self.session.execute(
            select(Officer).where(
                Officer.officer_id == body.arrested_by_officer_id,
                Officer.deleted_at.is_(None),
            )
        )
        if officer_result.scalar_one_or_none() is None:
            raise NotFoundError("Arresting officer not found")

        if body.arrest_location_id is not None:
            location = await self.session.get(Location, body.arrest_location_id)
            if not location:
                raise NotFoundError("Location not found")

        if body.booking_number:
            existing = await self.repo.get_by_booking_number(body.booking_number)
            if existing:
                raise ConflictError("Booking number already assigned to another arrest")

        case: Case | None = None
        if body.case_id is not None:
            case = await load_case_for_access(self.session, body.case_id)
            if not case:
                raise CaseNotFoundError()
            if not await check_case_access(self.session, requester, case, "write"):
                raise CaseAccessDeniedError()

        row = await self.repo.create_arrest(body, requester.officer_id)

        if body.case_id is not None:
            linked = await self.repo.suspect_linked_to_case(body.case_id, body.suspect_id)
            if not linked:
                await self.repo.link_suspect_to_case(
                    body.case_id, body.suspect_id, requester.officer_id
                )

            await self.case_repo.create_case_update(
                case_id=body.case_id,
                officer_id=requester.officer_id,
                update_type="arrest_recorded",
                description=f"Arrest recorded for Suspect #{body.suspect_id}",
            )

        await self.session.commit()

        response = ArrestResponse.model_validate(row)
        response.suspect_name = await self._get_suspect_name(body.suspect_id)
        response.officer_name = await self._get_officer_name(body.arrested_by_officer_id)
        response.location_name = await self._get_location_name(body.arrest_location_id)
        return response

    async def get_arrest(
        self, arrest_id: int, requester: CurrentOfficerContext
    ) -> ArrestResponse:
        if not self._role_allows(requester):
            raise CaseAccessDeniedError("Insufficient role for arrest access")

        arrest = await self.repo.get_by_id(arrest_id)
        if not arrest:
            raise NotFoundError("Arrest not found")

        if arrest.case_id is not None:
            case = await load_case_for_access(self.session, arrest.case_id)
            if not case:
                raise CaseNotFoundError()
            if not await check_case_access(self.session, requester, case, "read"):
                raise CaseAccessDeniedError()

        response = ArrestResponse.model_validate(arrest)
        response.suspect_name = await self._get_suspect_name(arrest.suspect_id)
        response.officer_name = await self._get_officer_name(arrest.officer_id)
        response.location_name = await self._get_location_name(arrest.location_id)
        return response

    async def list_arrests_for_case(
        self,
        case_id: int,
        requester: CurrentOfficerContext,
        page: int,
        size: int,
    ) -> PaginatedResponse[ArrestResponse]:
        case = await load_case_for_access(self.session, case_id)
        if not case:
            raise CaseNotFoundError()
        if not await check_case_access(self.session, requester, case, "read"):
            raise CaseAccessDeniedError()

        rows, total = await self.repo.list_by_case(case_id, page, size)
        items: list[ArrestResponse] = []
        for row in rows:
            response = ArrestResponse.model_validate(row)
            response.suspect_name = await self._get_suspect_name(row.suspect_id)
            response.officer_name = await self._get_officer_name(row.officer_id)
            response.location_name = await self._get_location_name(row.location_id)
            items.append(response)

        return PaginatedResponse(items=items, total=total, page=page, size=size)

    async def update_arrest(
        self,
        arrest_id: int,
        requester: CurrentOfficerContext,
        body: ArrestUpdateRequest,
    ) -> ArrestResponse:
        if not self._role_allows(requester):
            raise CaseAccessDeniedError("Insufficient role for arrest updates")

        arrest = await self.repo.get_by_id(arrest_id)
        if not arrest:
            raise NotFoundError("Arrest not found")

        if arrest.case_id is not None:
            case = await load_case_for_access(self.session, arrest.case_id)
            if not case:
                raise CaseNotFoundError()
            if not await check_case_access(self.session, requester, case, "write"):
                raise CaseAccessDeniedError()

        if body.released_at is not None:
            if body.released_at < arrest.date:
                raise ValidationError("Release date cannot be before arrest date")
            if arrest.released_at is not None:
                raise ConflictError("Arrest already has a release date recorded")

        updated = await self.repo.update_arrest(arrest, body)
        await self.session.commit()

        response = ArrestResponse.model_validate(updated)
        response.suspect_name = await self._get_suspect_name(updated.suspect_id)
        response.officer_name = await self._get_officer_name(updated.officer_id)
        response.location_name = await self._get_location_name(updated.location_id)
        return response

    async def delete_arrest(
        self, arrest_id: int, requester: CurrentOfficerContext
    ) -> None:
        if requester.role_name not in {
            RoleNameEnum.admin.value,
            RoleNameEnum.superadmin.value,
        }:
            raise CaseAccessDeniedError("Only admin or superadmin can delete arrests")

        arrest = await self.repo.get_by_id(arrest_id)
        if not arrest:
            raise NotFoundError("Arrest not found")

        await self.repo.soft_delete(arrest)
        await self.session.commit()
