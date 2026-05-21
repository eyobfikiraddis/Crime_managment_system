from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import ConflictError, NotFoundError, ValidationError
from app.modules.auth.models import Location, Officer
from app.modules.auth.schemas.responses import CurrentOfficerContext
from app.modules.case_management.exceptions import CaseAccessDeniedError, CaseNotFoundError
from app.modules.case_management.models import Case, CaseSuspect, Interrogation
from app.modules.case_management.permissions import check_case_access, load_case_for_access
from app.modules.case_management.repository import CaseRepository
from app.modules.interrogation.repository import InterrogationRepository
from app.modules.interrogation.schemas.requests import InterrogationCreateRequest
from app.modules.interrogation.schemas.responses import InterrogationResponse
from app.modules.personnel.models import Suspect
from app.shared.pagination import PaginatedResponse


class InterrogationService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = InterrogationRepository(session)
        self.case_repo = CaseRepository(session)

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

    async def create_interrogation(
        self,
        case_id: int,
        requester: CurrentOfficerContext,
        body: InterrogationCreateRequest,
    ) -> InterrogationResponse:
        case = await load_case_for_access(self.session, case_id)
        if not case:
            raise CaseNotFoundError()
        if not await check_case_access(self.session, requester, case, "write"):
            raise CaseAccessDeniedError()

        if case.status and case.status.status_name == "closed":
            raise ConflictError("Cannot record an interrogation on a closed case")

        suspect_result = await self.session.execute(
            select(Suspect).where(
                Suspect.suspect_id == body.suspect_id,
                Suspect.deleted_at.is_(None),
            )
        )
        suspect = suspect_result.scalar_one_or_none()
        if not suspect:
            raise NotFoundError("Suspect not found")

        link_result = await self.session.execute(
            select(CaseSuspect).where(
                CaseSuspect.case_id == case_id,
                CaseSuspect.suspect_id == body.suspect_id,
                CaseSuspect.deleted_at.is_(None),
            )
        )
        if link_result.scalar_one_or_none() is None:
            raise ValidationError(
                "Suspect is not linked to this case. Link the suspect to the case before recording an interrogation."
            )

        now = datetime.now(tz=timezone.utc)
        if body.date > now:
            raise ValidationError("Interrogation date cannot be in the future")

        if body.location_id is not None:
            location = await self.session.get(Location, body.location_id)
            if not location:
                raise NotFoundError("Location not found")

        row = await self.repo.create_interrogation(
            case_id=case_id,
            suspect_id=body.suspect_id,
            officer_id=requester.officer_id,
            date=body.date,
            notes=body.notes,
            location_id=body.location_id,
            recording_url=body.recording_url,
        )

        officer_name = await self._get_officer_name(requester.officer_id)
        await self.case_repo.create_case_update(
            case_id=case_id,
            officer_id=requester.officer_id,
            update_type="interrogation_recorded",
            description=(
                f"Interrogation of Suspect #{body.suspect_id} recorded by Officer {officer_name} on {body.date.date()}"
            ),
        )
        await self.session.commit()

        response = InterrogationResponse.model_validate(row)
        response.suspect_name = await self._get_suspect_name(body.suspect_id)
        response.officer_name = officer_name
        response.location_name = await self._get_location_name(body.location_id)
        return response

    async def list_interrogations(
        self,
        case_id: int,
        requester: CurrentOfficerContext,
        suspect_id_filter: int | None,
        page: int,
        size: int,
    ) -> PaginatedResponse[InterrogationResponse]:
        case = await load_case_for_access(self.session, case_id)
        if not case:
            raise CaseNotFoundError()
        if not await check_case_access(self.session, requester, case, "read"):
            raise CaseAccessDeniedError()

        rows, total = await self.repo.list_by_case(case_id, suspect_id_filter, page, size)
        items: list[InterrogationResponse] = []
        for row in rows:
            response = InterrogationResponse.model_validate(row)
            response.suspect_name = await self._get_suspect_name(row.suspect_id)
            response.officer_name = await self._get_officer_name(row.officer_id)
            response.location_name = await self._get_location_name(row.location_id)
            items.append(response)

        return PaginatedResponse(items=items, total=total, page=page, size=size)
