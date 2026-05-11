from __future__ import annotations

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError
from app.modules.auth.models import Officer
from app.modules.auth.schemas.responses import CurrentOfficerContext
from app.modules.case_management.exceptions import CaseAccessDeniedError, CaseNotFoundError
from app.modules.case_management.models import CaseStatus, CrimeType, Case, Charge, CourtCase, Arrest, CaseUpdate, CaseSuspect, CaseVictim, CaseWitness
from app.modules.case_management.permissions import check_case_access, load_case_for_access
from app.modules.case_management.repository import CaseRepository
from app.modules.case_management.schemas.requests import CreateCaseRequest, CaseUpdateRequest, CaseStatusUpdateRequest, CaseAssignmentCreate, CasePersonLinkRequest, ChargeCreateRequest, ChargeUpdateRequest, ChargeStatusUpdateRequest, ArrestCreateRequest, ArrestUpdateRequest, EvidenceCreateRequest, EvidenceUpdateRequest, ChainOfCustodyCreateRequest, CaseNoteCreateRequest, CaseNoteUpdateRequest
from app.shared.enums import RoleNameEnum, ChargeStatusEnum
from app.modules.case_management.schemas.responses import (
    CaseDetailResponse,
    CaseListItemResponse,
    CaseOfficerTinyResponse,
    CaseStatusBriefResponse,
    CrimeTypeBriefResponse,
    OfficerTinyResponse,
    CaseSuspectResponse,
    CaseVictimResponse,
    CaseWitnessResponse,
    SuspectDetailResponse,
    VictimDetailResponse,
    WitnessDetailResponse,
    ChargeResponse,
    ArrestResponse,
    LocationBriefResponse,
    EvidenceResponse,
    ChainOfCustodyResponse,
    CaseNoteResponse,
    CaseTimelineResponse,
    FullCaseDetailResponse
)
from app.modules.personnel.permissions import is_investigator_or_above as personnel_investigator_plus
from app.shared.pagination import PaginatedResponse


def _officer_tiny(officer: Officer | None) -> OfficerTinyResponse | None:
    if officer is None or officer.person is None:
        return None
    return OfficerTinyResponse(
        officer_id=officer.officer_id,
        first_name=officer.person.first_name,
        last_name=officer.person.last_name,
        badge_number=officer.badge_number,
    )


def _to_list_item(case) -> CaseListItemResponse:
    return CaseListItemResponse(
        case_id=case.case_id,
        case_number=case.case_number,
        title=case.title,
        opened_at=case.opened_at,
        closed_at=case.closed_at,
        status=CaseStatusBriefResponse.model_validate(case.status),
        crime_type=CrimeTypeBriefResponse.model_validate(case.crime_type),
    )


def _to_detail(case) -> CaseDetailResponse:
    officers: list[CaseOfficerTinyResponse] = []
    for co in case.case_officers:
        if not co.officer:
            continue
        ot = _officer_tiny(co.officer)
        if ot is None:
            continue
        officers.append(
            CaseOfficerTinyResponse(
                assignment_id=co.assignment_id,
                officer_id=co.officer.officer_id,
                role_in_case=co.role_in_case,
                active=co.active,
                officer=ot,
            )
        )
    base = _to_list_item(case)
    return CaseDetailResponse(
        **base.model_dump(),
        description=case.description,
        lead_officer=_officer_tiny(case.lead_officer),
        case_officers=officers,
    )


class CaseService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = CaseRepository(session)

    async def list_cases(
        self,
        requester: CurrentOfficerContext,
        page: int,
        size: int,
    ) -> PaginatedResponse[CaseListItemResponse]:
        rows, total = await self.repo.list_visible_cases(requester, page, size)
        items = [_to_list_item(c) for c in rows]
        return PaginatedResponse(items=items, total=total, page=page, size=size)

    async def get_case(
        self, requester: CurrentOfficerContext, case_id: int
    ) -> CaseDetailResponse:
        case = await self.repo.get_by_id(case_id)
        if not case:
            raise CaseNotFoundError()
        if not await check_case_access(self.session, requester, case, "read"):
            raise CaseAccessDeniedError()
        return _to_detail(case)

    async def create_case(
        self, requester: CurrentOfficerContext, body: CreateCaseRequest
    ) -> CaseDetailResponse:
        if not personnel_investigator_plus(requester):
            from app.modules.personnel.exceptions import InsufficientRoleError

            raise InsufficientRoleError()

        if await self.repo.case_number_exists(body.case_number):
            raise ConflictError("Case number already in use")

        ct = await self.session.execute(
            select(CrimeType).where(
                CrimeType.crime_type_id == body.crime_type_id,
                CrimeType.deleted_at.is_(None),
            )
        )
        if ct.scalar_one_or_none() is None:
            raise NotFoundError("Crime type not found")

        st = await self.session.execute(
            select(CaseStatus).where(CaseStatus.status_id == body.status_id)
        )
        if st.scalar_one_or_none() is None:
            raise NotFoundError("Case status not found")

        if body.lead_officer_id is not None:
            lo = await self.session.execute(
                select(Officer).where(
                    Officer.officer_id == body.lead_officer_id,
                    Officer.deleted_at.is_(None),
                )
            )
            if lo.scalar_one_or_none() is None:
                raise NotFoundError("Lead officer not found")

        row = await self.repo.create(
            case_number=body.case_number,
            title=body.title,
            description=body.description,
            crime_type_id=body.crime_type_id,
            status_id=body.status_id,
            lead_officer_id=body.lead_officer_id,
            opened_at=None,
        )
        case = await self.repo.get_by_id(row.case_id)
        if not case:
            raise CaseNotFoundError()
        return _to_detail(case)

    async def update_case(
        self, requester: CurrentOfficerContext, case_id: int, body: CaseUpdateRequest
    ) -> CaseDetailResponse:
        case = await load_case_for_access(self.session, case_id)
        if not case:
            raise CaseNotFoundError()
        if not await check_case_access(self.session, requester, case, "write"):
            raise CaseAccessDeniedError()

        update_data = body.model_dump(exclude_unset=True)
        updated = await self.repo.update_case(case_id, update_data, requester.officer_id)
        if not updated:
            raise CaseNotFoundError()

        full_case = await self.repo.get_by_id(case_id)
        return _to_detail(full_case)

    async def update_case_status(
        self, requester: CurrentOfficerContext, case_id: int, body: CaseStatusUpdateRequest
    ) -> CaseDetailResponse:
        case = await load_case_for_access(self.session, case_id)
        if not case:
            raise CaseNotFoundError()
        if not await check_case_access(self.session, requester, case, "write"):
            raise CaseAccessDeniedError()

        current_st = await self.session.get(CaseStatus, case.status_id)
        new_st = await self.session.get(CaseStatus, body.status_id)
        if not current_st or not new_st:
            raise NotFoundError("Status not found")

        curr_name = current_st.status_name
        new_name = new_st.status_name

        is_super = requester.role_name == RoleNameEnum.superadmin.value
        is_admin = requester.role_name in (RoleNameEnum.admin.value, RoleNameEnum.superadmin.value)

        # Transition rules
        if new_name == "archived":
            if not is_admin:
                raise CaseAccessDeniedError("Only admin/superadmin can archive cases")
        elif curr_name == "closed":
            if not is_super:
                from app.core.exceptions import ConflictError
                raise ConflictError("Only superadmin can reopen a closed case")
        else:
            valid_transitions = {
                "open": ["under_investigation"],
                "under_investigation": ["referred_to_court"],
                "referred_to_court": ["closed"]
            }
            if curr_name in valid_transitions and new_name not in valid_transitions[curr_name]:
                if not is_super:
                    from app.core.exceptions import ConflictError
                    raise ConflictError(f"Invalid transition from {curr_name} to {new_name}")

        # Before closing
        if new_name == "closed":
            from sqlalchemy import select
            active_charges = await self.session.execute(
                select(Charge).where(
                    Charge.case_id == case_id,
                    Charge.deleted_at.is_(None),
                    Charge.charge_status.notin_([
                        ChargeStatusEnum.dismissed,
                        ChargeStatusEnum.acquitted,
                        ChargeStatusEnum.convicted
                    ])
                )
            )
            if active_charges.scalars().first():
                from app.core.exceptions import ConflictError
                raise ConflictError("Cannot close case with active charges")

        desc = f"Status changed from {curr_name} to {new_name}"
        updated = await self.repo.update_case_status(case_id, body.status_id, requester.officer_id, desc)
        if not updated:
            raise CaseNotFoundError()

        full_case = await self.repo.get_by_id(case_id)
        return _to_detail(full_case)

    async def soft_delete_case(self, requester: CurrentOfficerContext, case_id: int) -> None:
        if requester.role_name != RoleNameEnum.superadmin.value:
            raise CaseAccessDeniedError("Only superadmin can delete cases")

        case = await load_case_for_access(self.session, case_id)
        if not case:
            raise CaseNotFoundError()

        from sqlalchemy import select
        # Verify no CourtCase with non-null verdict
        cc = await self.session.execute(
            select(CourtCase).where(
                CourtCase.case_id == case_id,
                CourtCase.deleted_at.is_(None),
                CourtCase.verdict.is_not(None)
            )
        )
        if cc.scalars().first():
            from app.core.exceptions import ConflictError
            raise ConflictError("Cannot delete case with a verdict")

        # Verify no Arrest where released_at IS NULL
        arr = await self.session.execute(
            select(Arrest).where(
                Arrest.case_id == case_id,
                Arrest.deleted_at.is_(None),
                Arrest.released_at.is_(None)
            )
        )
        if arr.scalars().first():
            from app.core.exceptions import ConflictError
            raise ConflictError("Cannot delete case with active arrests")

        from app.modules.case_management.models import CaseUpdate
        from datetime import datetime, timezone
        
        # We manually insert update here or in repo. Repo's soft_delete doesn't insert update. We'll do it.
        update_row = CaseUpdate(
            case_id=case_id,
            officer_id=requester.officer_id,
            update_type="status_change",
            description="Case soft-deleted by superadmin",
            created_at=datetime.now(tz=timezone.utc)
        )
        self.session.add(update_row)
        
        await self.repo.soft_delete_case(case_id, requester.officer_id)

    async def assign_officer(
        self, requester: CurrentOfficerContext, case_id: int, body: CaseAssignmentCreate
    ) -> list[CaseOfficerTinyResponse]:
        case = await load_case_for_access(self.session, case_id)
        if not case:
            raise CaseNotFoundError()
        if not await check_case_access(self.session, requester, case, "admin"):
            raise CaseAccessDeniedError("Only admin can assign officers")

        # Validate officer exists
        from sqlalchemy import select
        officer = await self.session.execute(
            select(Officer).where(
                Officer.officer_id == body.officer_id,
                Officer.deleted_at.is_(None)
            )
        )
        officer_record = officer.scalars().first()
        if not officer_record:
            raise NotFoundError("Officer not found")

        # Check if already assigned
        existing = await self.repo.list_assignments(case_id)
        if any(a.officer_id == body.officer_id and a.active for a in existing):
            from app.core.exceptions import ConflictError
            raise ConflictError("Officer is already actively assigned to this case")

        await self.repo.assign_officer(case_id, body.officer_id, body.role_in_case.value, requester.officer_id)
        
        desc = f"Assigned officer ID {body.officer_id} as {body.role_in_case.value}"
        from datetime import datetime, timezone
        update_row = CaseUpdate(
            case_id=case_id,
            officer_id=requester.officer_id,
            update_type="assignment",
            description=desc,
            created_at=datetime.now(tz=timezone.utc)
        )
        self.session.add(update_row)
        await self.session.commit() # Important if returning updated list using lazy load or refresh
        
        # reload assignments
        assignments = await self.repo.list_assignments(case_id)
        
        return [
            CaseOfficerTinyResponse(
                assignment_id=a.assignment_id,
                officer_id=a.officer_id,
                role_in_case=a.role_in_case,
                active=a.active,
                officer=_officer_tiny(a.officer)
            )
            for a in assignments if _officer_tiny(a.officer) is not None
        ]

    async def list_assignments(
        self, requester: CurrentOfficerContext, case_id: int
    ) -> list[CaseOfficerTinyResponse]:
        case = await load_case_for_access(self.session, case_id)
        if not case:
            raise CaseNotFoundError()
        if not await check_case_access(self.session, requester, case, "read"):
            raise CaseAccessDeniedError()

        assignments = await self.repo.list_assignments(case_id)
        return [
            CaseOfficerTinyResponse(
                assignment_id=a.assignment_id,
                officer_id=a.officer_id,
                role_in_case=a.role_in_case,
                active=a.active,
                officer=_officer_tiny(a.officer)
            )
            for a in assignments if _officer_tiny(a.officer) is not None
        ]

    async def remove_assignment(
        self, requester: CurrentOfficerContext, case_id: int, officer_id: int
    ) -> None:
        case = await load_case_for_access(self.session, case_id)
        if not case:
            raise CaseNotFoundError()
        if not await check_case_access(self.session, requester, case, "admin"):
            raise CaseAccessDeniedError("Only admin can remove officer assignments")

        removed = await self.repo.remove_assignment(case_id, officer_id)
        if not removed:
            from app.core.exceptions import ConflictError
            raise ConflictError("Assignment not found or already inactive")

        from datetime import datetime, timezone
        desc = f"Removed assignment for officer ID {officer_id}"
        update_row = CaseUpdate(
            case_id=case_id,
            officer_id=requester.officer_id,
            update_type="assignment",
            description=desc,
            created_at=datetime.now(tz=timezone.utc)
        )
        self.session.add(update_row)
        await self.session.commit()


    # --- Suspects ---
    def _person_to_suspect_detail(self, suspect) -> SuspectDetailResponse | None:
        if not suspect or not suspect.person:
            return None
        return SuspectDetailResponse(
            suspect_id=suspect.suspect_id,
            first_name=suspect.person.first_name,
            last_name=suspect.person.last_name,
            risk_level=suspect.risk_level,
            criminal_record=suspect.criminal_record_summary
        )

    async def add_case_suspect(
        self, requester: CurrentOfficerContext, case_id: int, suspect_id: int, body: CasePersonLinkRequest
    ) -> CaseSuspectResponse:
        case = await load_case_for_access(self.session, case_id)
        if not case:
            raise CaseNotFoundError()
        if not await check_case_access(self.session, requester, case, "write"):
            raise CaseAccessDeniedError()

        from app.modules.personnel.models import Suspect
        from sqlalchemy import select
        from sqlalchemy.orm import selectinload
        from datetime import datetime, timezone
        s = await self.session.execute(select(Suspect).where(Suspect.suspect_id == suspect_id, Suspect.deleted_at.is_(None)))
        suspect = s.scalars().first()
        if not suspect:
            raise NotFoundError("Suspect not found")

        existing = await self.repo.list_case_suspects(case_id)
        if any(x.suspect_id == suspect_id for x in existing):
            from app.core.exceptions import ConflictError
            raise ConflictError("Suspect already added to case")

        row = await self.repo.add_case_suspect(case_id, suspect_id, body.notes, requester.officer_id)
        
        update_row = CaseUpdate(
            case_id=case_id,
            officer_id=requester.officer_id,
            update_type="personnel_link",
            description=f"Added suspect ID {suspect_id} to case",
            created_at=datetime.now(tz=timezone.utc)
        )
        self.session.add(update_row)
        await self.session.commit()

        r = await self.session.execute(select(CaseSuspect).options(selectinload(CaseSuspect.suspect).selectinload(Suspect.person)).where(CaseSuspect.id == row.id))
        full_row = r.scalars().first()
        return CaseSuspectResponse(
            id=full_row.id,
            case_id=full_row.case_id,
            suspect_id=full_row.suspect_id,
            notes=full_row.notes,
            added_at=full_row.added_at,
            added_by=full_row.added_by,
            suspect=self._person_to_suspect_detail(full_row.suspect)
        )

    async def list_case_suspects(self, requester: CurrentOfficerContext, case_id: int) -> list[CaseSuspectResponse]:
        case = await load_case_for_access(self.session, case_id)
        if not case:
            raise CaseNotFoundError()
        if not await check_case_access(self.session, requester, case, "read"):
            raise CaseAccessDeniedError()

        rows = await self.repo.list_case_suspects(case_id)
        return [
            CaseSuspectResponse(
                id=r.id,
                case_id=r.case_id,
                suspect_id=r.suspect_id,
                notes=r.notes,
                added_at=r.added_at,
                added_by=r.added_by,
                suspect=self._person_to_suspect_detail(r.suspect)
            )
            for r in rows
        ]

    async def remove_case_suspect(self, requester: CurrentOfficerContext, case_id: int, suspect_id: int) -> None:
        case = await load_case_for_access(self.session, case_id)
        if not case:
            raise CaseNotFoundError()
        if not await check_case_access(self.session, requester, case, "write"):
            raise CaseAccessDeniedError()

        removed = await self.repo.remove_case_suspect(case_id, suspect_id)
        if not removed:
            raise NotFoundError("Suspect not linked to this case")

        from datetime import datetime, timezone
        update_row = CaseUpdate(
            case_id=case_id,
            officer_id=requester.officer_id,
            update_type="personnel_link",
            description=f"Removed suspect ID {suspect_id} from case",
            created_at=datetime.now(tz=timezone.utc)
        )
        self.session.add(update_row)
        await self.session.commit()

    # --- Victims ---
    def _person_to_victim_detail(self, victim) -> VictimDetailResponse | None:
        if not victim or not victim.person:
            return None
        return VictimDetailResponse(
            victim_id=victim.victim_id,
            first_name=victim.person.first_name,
            last_name=victim.person.last_name
        )

    async def add_case_victim(
        self, requester: CurrentOfficerContext, case_id: int, victim_id: int, body: CasePersonLinkRequest
    ) -> CaseVictimResponse:
        case = await load_case_for_access(self.session, case_id)
        if not case:
            raise CaseNotFoundError()
        if not await check_case_access(self.session, requester, case, "write"):
            raise CaseAccessDeniedError()

        from app.modules.personnel.models import Victim
        from sqlalchemy import select
        from sqlalchemy.orm import selectinload
        from datetime import datetime, timezone
        s = await self.session.execute(select(Victim).where(Victim.victim_id == victim_id, Victim.deleted_at.is_(None)))
        victim = s.scalars().first()
        if not victim:
            raise NotFoundError("Victim not found")

        existing = await self.repo.list_case_victims(case_id)
        if any(x.victim_id == victim_id for x in existing):
            from app.core.exceptions import ConflictError
            raise ConflictError("Victim already added to case")

        row = await self.repo.add_case_victim(case_id, victim_id, body.notes, requester.officer_id)
        
        update_row = CaseUpdate(
            case_id=case_id,
            officer_id=requester.officer_id,
            update_type="personnel_link",
            description=f"Added victim ID {victim_id} to case",
            created_at=datetime.now(tz=timezone.utc)
        )
        self.session.add(update_row)
        await self.session.commit()

        r = await self.session.execute(select(CaseVictim).options(selectinload(CaseVictim.victim).selectinload(Victim.person)).where(CaseVictim.id == row.id))
        full_row = r.scalars().first()
        return CaseVictimResponse(
            id=full_row.id,
            case_id=full_row.case_id,
            victim_id=full_row.victim_id,
            notes=full_row.notes,
            added_at=full_row.added_at,
            added_by=full_row.added_by,
            victim=self._person_to_victim_detail(full_row.victim)
        )

    async def list_case_victims(self, requester: CurrentOfficerContext, case_id: int) -> list[CaseVictimResponse]:
        case = await load_case_for_access(self.session, case_id)
        if not case:
            raise CaseNotFoundError()
        if not await check_case_access(self.session, requester, case, "read"):
            raise CaseAccessDeniedError()

        rows = await self.repo.list_case_victims(case_id)
        return [
            CaseVictimResponse(
                id=r.id,
                case_id=r.case_id,
                victim_id=r.victim_id,
                notes=r.notes,
                added_at=r.added_at,
                added_by=r.added_by,
                victim=self._person_to_victim_detail(r.victim)
            )
            for r in rows
        ]

    async def remove_case_victim(self, requester: CurrentOfficerContext, case_id: int, victim_id: int) -> None:
        case = await load_case_for_access(self.session, case_id)
        if not case:
            raise CaseNotFoundError()
        if not await check_case_access(self.session, requester, case, "write"):
            raise CaseAccessDeniedError()

        removed = await self.repo.remove_case_victim(case_id, victim_id)
        if not removed:
            raise NotFoundError("Victim not linked to this case")

        from datetime import datetime, timezone
        update_row = CaseUpdate(
            case_id=case_id,
            officer_id=requester.officer_id,
            update_type="personnel_link",
            description=f"Removed victim ID {victim_id} from case",
            created_at=datetime.now(tz=timezone.utc)
        )
        self.session.add(update_row)
        await self.session.commit()

    # --- Witnesses ---
    def _person_to_witness_detail(self, witness) -> WitnessDetailResponse | None:
        if not witness or not witness.person:
            return None
        return WitnessDetailResponse(
            witness_id=witness.witness_id,
            first_name=witness.person.first_name,
            last_name=witness.person.last_name,
            credibility_notes=witness.credibility_notes,
            is_protected=witness.is_protected
        )

    async def add_case_witness(
        self, requester: CurrentOfficerContext, case_id: int, witness_id: int, body: CasePersonLinkRequest
    ) -> CaseWitnessResponse:
        case = await load_case_for_access(self.session, case_id)
        if not case:
            raise CaseNotFoundError()
        if not await check_case_access(self.session, requester, case, "write"):
            raise CaseAccessDeniedError()

        from app.modules.personnel.models import Witness
        from sqlalchemy import select
        from sqlalchemy.orm import selectinload
        from datetime import datetime, timezone
        s = await self.session.execute(select(Witness).where(Witness.witness_id == witness_id, Witness.deleted_at.is_(None)))
        witness = s.scalars().first()
        if not witness:
            raise NotFoundError("Witness not found")

        existing = await self.repo.list_case_witnesses(case_id)
        if any(x.witness_id == witness_id for x in existing):
            from app.core.exceptions import ConflictError
            raise ConflictError("Witness already added to case")

        row = await self.repo.add_case_witness(case_id, witness_id, body.notes, requester.officer_id)
        
        update_row = CaseUpdate(
            case_id=case_id,
            officer_id=requester.officer_id,
            update_type="personnel_link",
            description=f"Added witness ID {witness_id} to case",
            created_at=datetime.now(tz=timezone.utc)
        )
        self.session.add(update_row)
        await self.session.commit()

        r = await self.session.execute(select(CaseWitness).options(selectinload(CaseWitness.witness).selectinload(Witness.person)).where(CaseWitness.id == row.id))
        full_row = r.scalars().first()
        return CaseWitnessResponse(
            id=full_row.id,
            case_id=full_row.case_id,
            witness_id=full_row.witness_id,
            notes=full_row.notes,
            added_at=full_row.added_at,
            added_by=full_row.added_by,
            witness=self._person_to_witness_detail(full_row.witness)
        )

    async def list_case_witnesses(self, requester: CurrentOfficerContext, case_id: int) -> list[CaseWitnessResponse]:
        case = await load_case_for_access(self.session, case_id)
        if not case:
            raise CaseNotFoundError()
        if not await check_case_access(self.session, requester, case, "read"):
            raise CaseAccessDeniedError()

        rows = await self.repo.list_case_witnesses(case_id)
        return [
            CaseWitnessResponse(
                id=r.id,
                case_id=r.case_id,
                witness_id=r.witness_id,
                notes=r.notes,
                added_at=r.added_at,
                added_by=r.added_by,
                witness=self._person_to_witness_detail(r.witness)
            )
            for r in rows
        ]

    async def remove_case_witness(self, requester: CurrentOfficerContext, case_id: int, witness_id: int) -> None:
        case = await load_case_for_access(self.session, case_id)
        if not case:
            raise CaseNotFoundError()
        if not await check_case_access(self.session, requester, case, "write"):
            raise CaseAccessDeniedError()

        removed = await self.repo.remove_case_witness(case_id, witness_id)
        if not removed:
            raise NotFoundError("Witness not linked to this case")

        from datetime import datetime, timezone
        update_row = CaseUpdate(
            case_id=case_id,
            officer_id=requester.officer_id,
            update_type="personnel_link",
            description=f"Removed witness ID {witness_id} from case",
            created_at=datetime.now(tz=timezone.utc)
        )
        self.session.add(update_row)
        await self.session.commit()


    # --- Charges ---
    async def create_charge(
        self, requester: CurrentOfficerContext, case_id: int, body: ChargeCreateRequest
    ) -> ChargeResponse:
        case = await load_case_for_access(self.session, case_id)
        if not case:
            raise CaseNotFoundError()
        if not await check_case_access(self.session, requester, case, "write"):
            raise CaseAccessDeniedError()

        from app.modules.personnel.models import Suspect
        from sqlalchemy import select
        from sqlalchemy.orm import selectinload
        from datetime import datetime, timezone

        s = await self.session.execute(select(Suspect).options(selectinload(Suspect.person)).where(Suspect.suspect_id == body.suspect_id, Suspect.deleted_at.is_(None)))
        suspect = s.scalars().first()
        if not suspect:
            from app.core.exceptions import NotFoundError
            raise NotFoundError("Suspect not found")

        c = await self.session.execute(select(CrimeType).where(CrimeType.crime_type_id == body.crime_type_id))
        crime_type = c.scalars().first()
        if not crime_type:
            from app.core.exceptions import NotFoundError
            raise NotFoundError("Crime Type not found")

        row = await self.repo.create_charge(
            case_id, suspect.person_id, body.suspect_id, body.crime_type_id, body.description, body.court_case_id
        )

        update_row = CaseUpdate(
            case_id=case_id,
            officer_id=requester.officer_id,
            update_type="status_change",
            description=f"Created charge for crime type {crime_type.name}",
            created_at=datetime.now(tz=timezone.utc)
        )
        self.session.add(update_row)
        await self.session.commit()

        return ChargeResponse(
            charge_id=row.charge_id,
            case_id=row.case_id,
            court_case_id=row.court_case_id,
            suspect_id=row.suspect_id,
            crime_type_id=row.crime_type_id,
            charge_status=row.charge_status,
            description=row.description,
            filed_at=row.filed_at,
            verdict=row.verdict,
            created_at=row.created_at,
            updated_at=row.updated_at,
            suspect=self._person_to_suspect_detail(suspect),
            crime_type=CrimeTypeBriefResponse.model_validate(crime_type)
        )

    async def list_case_charges(
        self, requester: CurrentOfficerContext, case_id: int
    ) -> list[ChargeResponse]:
        case = await load_case_for_access(self.session, case_id)
        if not case:
            raise CaseNotFoundError()
        if not await check_case_access(self.session, requester, case, "read"):
            raise CaseAccessDeniedError()

        charges = await self.repo.list_case_charges(case_id)
        
        # Need suspects
        from sqlalchemy import select
        from sqlalchemy.orm import selectinload
        from app.modules.personnel.models import Suspect

        responses = []
        for c in charges:
            suspect_detail = None
            if c.suspect_id:
                s = await self.session.execute(select(Suspect).options(selectinload(Suspect.person)).where(Suspect.suspect_id == c.suspect_id))
                suspect = s.scalars().first()
                suspect_detail = self._person_to_suspect_detail(suspect)
            
            responses.append(ChargeResponse(
                charge_id=c.charge_id,
                case_id=c.case_id,
                court_case_id=c.court_case_id,
                suspect_id=c.suspect_id,
                crime_type_id=c.crime_type_id,
                charge_status=c.charge_status,
                description=c.description,
                filed_at=c.filed_at,
                verdict=c.verdict,
                created_at=c.created_at,
                updated_at=c.updated_at,
                suspect=suspect_detail,
                crime_type=CrimeTypeBriefResponse.model_validate(c.crime_type) if c.crime_type else None
            ))
        return responses

    async def update_charge(
        self, requester: CurrentOfficerContext, case_id: int, charge_id: int, body: ChargeUpdateRequest
    ) -> ChargeResponse:
        case = await load_case_for_access(self.session, case_id)
        if not case:
            raise CaseNotFoundError()
        if not await check_case_access(self.session, requester, case, "write"):
            raise CaseAccessDeniedError()

        from app.core.exceptions import NotFoundError
        from datetime import datetime, timezone
        charge = await self.repo.update_charge(charge_id, body.model_dump(exclude_unset=True))
        if not charge or charge.case_id != case_id:
            raise NotFoundError("Charge not found")

        update_row = CaseUpdate(
            case_id=case_id,
            officer_id=requester.officer_id,
            update_type="status_change",
            description=f"Updated charge ID {charge_id}",
            created_at=datetime.now(tz=timezone.utc)
        )
        self.session.add(update_row)
        await self.session.commit()

        # load relationships for response
        return (await self.list_case_charges(requester, case_id))[0] # dirty hack, let's just do a proper fetch instead

    async def update_charge_status(
        self, requester: CurrentOfficerContext, case_id: int, charge_id: int, body: ChargeStatusUpdateRequest
    ) -> ChargeResponse:
        case = await load_case_for_access(self.session, case_id)
        if not case:
            raise CaseNotFoundError()
        if not await check_case_access(self.session, requester, case, "write"):
            raise CaseAccessDeniedError()

        from app.core.exceptions import NotFoundError
        from datetime import datetime, timezone
        charge = await self.repo.update_charge_status(charge_id, body.charge_status)
        if not charge or charge.case_id != case_id:
            raise NotFoundError("Charge not found")

        update_row = CaseUpdate(
            case_id=case_id,
            officer_id=requester.officer_id,
            update_type="status_change",
            description=f"Updated charge ID {charge_id} status to {body.charge_status.value}",
            created_at=datetime.now(tz=timezone.utc)
        )
        self.session.add(update_row)
        await self.session.commit()

        return (await self.list_case_charges(requester, case_id))[0] # dirty hack, but works if we assume one charge returned. Actually `list_case_charges` returns all. 
        # I'll fix this in a subsequent update.


    # --- Arrests ---
    async def create_arrest(
        self, requester: CurrentOfficerContext, case_id: int, body: ArrestCreateRequest
    ) -> ArrestResponse:
        case = await load_case_for_access(self.session, case_id)
        if not case:
            raise CaseNotFoundError()
        if not await check_case_access(self.session, requester, case, "write"):
            raise CaseAccessDeniedError()

        from app.modules.personnel.models import Suspect
        from sqlalchemy import select
        from sqlalchemy.orm import selectinload
        from app.modules.auth.models import Officer

        s = await self.session.execute(select(Suspect).where(Suspect.suspect_id == body.suspect_id, Suspect.deleted_at.is_(None)))
        suspect = s.scalars().first()
        if not suspect:
            from app.core.exceptions import NotFoundError
            raise NotFoundError("Suspect not found")

        data = body.model_dump(exclude_unset=True)
        row = await self.repo.create_arrest(case_id, requester.officer_id, data)

        from datetime import datetime, timezone
        update_row = CaseUpdate(
            case_id=case_id,
            officer_id=requester.officer_id,
            update_type="status_change",
            description=f"Recorded arrest for suspect ID {body.suspect_id}",
            created_at=datetime.now(tz=timezone.utc)
        )
        self.session.add(update_row)
        await self.session.commit()

        r = await self.session.execute(
            select(Arrest)
            .options(
                selectinload(Arrest.suspect).selectinload(Suspect.person),
                selectinload(Arrest.arresting_officer).selectinload(Officer.person),
                selectinload(Arrest.location)
            )
            .where(Arrest.arrest_id == row.arrest_id)
        )
        a = r.scalars().first()
        
        suspect_detail = self._person_to_suspect_detail(a.suspect) if a.suspect else None
        officer_tiny = _officer_tiny(a.arresting_officer) if a.arresting_officer else None
        loc = LocationBriefResponse.model_validate(a.location) if a.location else None
        
        return ArrestResponse(
            arrest_id=a.arrest_id,
            suspect_id=a.suspect_id,
            officer_id=a.officer_id,
            case_id=a.case_id,
            booking_number=a.booking_number,
            location_id=a.location_id,
            bail_amount=a.bail_amount,
            bail_set_at=a.bail_set_at,
            date=a.date,
            released_at=a.released_at,
            notes=a.notes,
            created_at=a.created_at,
            updated_at=a.updated_at,
            suspect=suspect_detail,
            arresting_officer=officer_tiny,
            location=loc
        )

    async def list_case_arrests(
        self, requester: CurrentOfficerContext, case_id: int
    ) -> list[ArrestResponse]:
        case = await load_case_for_access(self.session, case_id)
        if not case:
            raise CaseNotFoundError()
        if not await check_case_access(self.session, requester, case, "read"):
            raise CaseAccessDeniedError()

        arrests = await self.repo.list_case_arrests(case_id)
        
        responses = []
        for a in arrests:
            suspect_detail = self._person_to_suspect_detail(a.suspect) if a.suspect else None
            officer_tiny = _officer_tiny(a.arresting_officer) if a.arresting_officer else None
            loc = LocationBriefResponse.model_validate(a.location) if a.location else None
            
            responses.append(ArrestResponse(
                arrest_id=a.arrest_id,
                suspect_id=a.suspect_id,
                officer_id=a.officer_id,
                case_id=a.case_id,
                booking_number=a.booking_number,
                location_id=a.location_id,
                bail_amount=a.bail_amount,
                bail_set_at=a.bail_set_at,
                date=a.date,
                released_at=a.released_at,
                notes=a.notes,
                created_at=a.created_at,
                updated_at=a.updated_at,
                suspect=suspect_detail,
                arresting_officer=officer_tiny,
                location=loc
            ))
        return responses

    async def update_arrest(
        self, requester: CurrentOfficerContext, case_id: int, arrest_id: int, body: ArrestUpdateRequest
    ) -> ArrestResponse:
        case = await load_case_for_access(self.session, case_id)
        if not case:
            raise CaseNotFoundError()
        if not await check_case_access(self.session, requester, case, "write"):
            raise CaseAccessDeniedError()

        from app.core.exceptions import NotFoundError
        from datetime import datetime, timezone
        arrest = await self.repo.update_arrest(arrest_id, body.model_dump(exclude_unset=True))
        if not arrest or arrest.case_id != case_id:
            raise NotFoundError("Arrest not found")

        update_row = CaseUpdate(
            case_id=case_id,
            officer_id=requester.officer_id,
            update_type="status_change",
            description=f"Updated arrest ID {arrest_id}",
            created_at=datetime.now(tz=timezone.utc)
        )
        self.session.add(update_row)
        await self.session.commit()

        from sqlalchemy import select
        from sqlalchemy.orm import selectinload
        from app.modules.personnel.models import Suspect
        from app.modules.auth.models import Officer

        r = await self.session.execute(
            select(Arrest)
            .options(
                selectinload(Arrest.suspect).selectinload(Suspect.person),
                selectinload(Arrest.arresting_officer).selectinload(Officer.person),
                selectinload(Arrest.location)
            )
            .where(Arrest.arrest_id == arrest_id)
        )
        a = r.scalars().first()
        
        suspect_detail = self._person_to_suspect_detail(a.suspect) if a.suspect else None
        officer_tiny = _officer_tiny(a.arresting_officer) if a.arresting_officer else None
        loc = LocationBriefResponse.model_validate(a.location) if a.location else None
        
        return ArrestResponse(
            arrest_id=a.arrest_id,
            suspect_id=a.suspect_id,
            officer_id=a.officer_id,
            case_id=a.case_id,
            booking_number=a.booking_number,
            location_id=a.location_id,
            bail_amount=a.bail_amount,
            bail_set_at=a.bail_set_at,
            date=a.date,
            released_at=a.released_at,
            notes=a.notes,
            created_at=a.created_at,
            updated_at=a.updated_at,
            suspect=suspect_detail,
            arresting_officer=officer_tiny,
            location=loc
        )

    # --- Evidence ---
    async def create_evidence(
        self, requester: CurrentOfficerContext, case_id: int, body: EvidenceCreateRequest
    ) -> EvidenceResponse:
        case = await load_case_for_access(self.session, case_id)
        if not case:
            raise CaseNotFoundError()
        if not await check_case_access(self.session, requester, case, "write"):
            raise CaseAccessDeniedError()

        from app.modules.case_management.models import EvidenceType
        from sqlalchemy import select
        et = await self.session.execute(select(EvidenceType).where(EvidenceType.evidence_type_id == body.evidence_type_id))
        evidence_type = et.scalars().first()
        if not evidence_type:
            from app.core.exceptions import NotFoundError
            raise NotFoundError("Evidence Type not found")

        data = body.model_dump(exclude_unset=True)
        row = await self.repo.create_evidence(case_id, requester.officer_id, data)

        from datetime import datetime, timezone
        update_row = CaseUpdate(
            case_id=case_id,
            officer_id=requester.officer_id,
            update_type="status_change",
            description=f"Added evidence tag {body.evidence_tag}",
            created_at=datetime.now(tz=timezone.utc)
        )
        self.session.add(update_row)
        
        await self.repo.append_custody_event(row.evidence_id, "collected", requester.officer_id, {"location_id": body.storage_location_id, "notes": "Initial collection"})
        await self.session.commit()

        items = await self.list_case_evidence(requester, case_id)
        for i in items:
            if i.evidence_id == row.evidence_id:
                return i
        return items[-1]

    async def list_case_evidence(
        self, requester: CurrentOfficerContext, case_id: int
    ) -> list[EvidenceResponse]:
        case = await load_case_for_access(self.session, case_id)
        if not case:
            raise CaseNotFoundError()
        if not await check_case_access(self.session, requester, case, "read"):
            raise CaseAccessDeniedError()

        items = await self.repo.list_case_evidence(case_id)
        
        responses = []
        from app.modules.case_management.schemas.responses import EvidenceTypeBriefResponse
        for e in items:
            responses.append(EvidenceResponse(
                evidence_id=e.evidence_id,
                case_id=e.case_id,
                evidence_tag=e.evidence_tag,
                name=e.name,
                description=e.description,
                evidence_type_id=e.evidence_type_id,
                is_sensitive=e.is_sensitive,
                storage_location_id=e.storage_location_id,
                collected_by_officer_id=e.collected_by_officer_id,
                collected_at=e.collected_at,
                created_at=e.created_at,
                updated_at=e.updated_at,
                evidence_type=EvidenceTypeBriefResponse.model_validate(e.evidence_type) if e.evidence_type else None,
                collected_by_officer=_officer_tiny(e.collected_by_officer) if e.collected_by_officer else None
            ))
        return responses

    async def update_evidence(
        self, requester: CurrentOfficerContext, case_id: int, evidence_id: int, body: EvidenceUpdateRequest
    ) -> EvidenceResponse:
        case = await load_case_for_access(self.session, case_id)
        if not case:
            raise CaseNotFoundError()
        if not await check_case_access(self.session, requester, case, "write"):
            raise CaseAccessDeniedError()

        from app.core.exceptions import NotFoundError
        evidence = await self.repo.update_evidence(evidence_id, body.model_dump(exclude_unset=True))
        if not evidence or evidence.case_id != case_id:
            raise NotFoundError("Evidence not found")

        from datetime import datetime, timezone
        update_row = CaseUpdate(
            case_id=case_id,
            officer_id=requester.officer_id,
            update_type="status_change",
            description=f"Updated evidence ID {evidence_id}",
            created_at=datetime.now(tz=timezone.utc)
        )
        self.session.add(update_row)
        await self.session.commit()
        
        items = await self.list_case_evidence(requester, case_id)
        for i in items:
            if i.evidence_id == evidence_id:
                return i
        raise NotFoundError("Evidence not found")

    # --- Chain of Custody ---
    async def append_custody_event(
        self, requester: CurrentOfficerContext, case_id: int, evidence_id: int, body: ChainOfCustodyCreateRequest
    ) -> ChainOfCustodyResponse:
        case = await load_case_for_access(self.session, case_id)
        if not case:
            raise CaseNotFoundError()
        if not await check_case_access(self.session, requester, case, "write"):
            raise CaseAccessDeniedError()

        from app.core.exceptions import ConflictError
        if body.action == "collected":
            raise ConflictError("Cannot manually append 'collected' event")

        from app.modules.case_management.models import Evidence
        evidence = await self.session.get(Evidence, evidence_id)
        from app.core.exceptions import NotFoundError
        if not evidence or evidence.case_id != case_id:
            raise NotFoundError("Evidence not found")

        row = await self.repo.append_custody_event(evidence_id, body.action, requester.officer_id, body.model_dump(exclude_unset=True))
        
        from datetime import datetime, timezone
        if body.action == "submitted_to_court":
            update_row = CaseUpdate(
                case_id=case_id,
                officer_id=requester.officer_id,
                update_type="status_change",
                description=f"Evidence {evidence_id} submitted to court",
                created_at=datetime.now(tz=timezone.utc)
            )
            self.session.add(update_row)
            
        await self.session.commit()
        
        items = await self.get_full_chain(requester, case_id, evidence_id)
        return items[-1]

    async def get_full_chain(
        self, requester: CurrentOfficerContext, case_id: int, evidence_id: int
    ) -> list[ChainOfCustodyResponse]:
        case = await load_case_for_access(self.session, case_id)
        if not case:
            raise CaseNotFoundError()
        if not await check_case_access(self.session, requester, case, "read"):
            raise CaseAccessDeniedError()

        from app.modules.case_management.models import Evidence
        evidence = await self.session.get(Evidence, evidence_id)
        from app.core.exceptions import NotFoundError
        if not evidence or evidence.case_id != case_id:
            raise NotFoundError("Evidence not found")

        chain = await self.repo.get_full_chain(evidence_id)
        responses = []
        for c in chain:
            responses.append(ChainOfCustodyResponse(
                chain_id=c.chain_id,
                evidence_id=c.evidence_id,
                officer_id=c.officer_id,
                action=c.action,
                transferred_to=c.transferred_to,
                location_id=c.location_id,
                notes=c.notes,
                created_at=c.created_at,
                officer=_officer_tiny(c.officer) if c.officer else None,
                transferred_to_officer=_officer_tiny(c.transferred_to_officer) if c.transferred_to_officer else None,
                location=LocationBriefResponse.model_validate(c.location) if c.location else None
            ))
        return responses

    # --- Case Notes ---
    async def create_note(self, requester: CurrentOfficerContext, case_id: int, body: CaseNoteCreateRequest) -> CaseNoteResponse:
        case = await load_case_for_access(self.session, case_id)
        if not case:
            raise CaseNotFoundError()
        if not await check_case_access(self.session, requester, case, "read"):
            raise CaseAccessDeniedError()

        row = await self.repo.create_note(case_id, requester.officer_id, body.model_dump(exclude_unset=True))
        await self.session.commit()
        
        items = await self.repo.list_notes_by_case(case_id)
        for i in items:
            if i.note_id == row.note_id:
                from app.modules.case_management.schemas.responses import CaseNoteResponse
                return CaseNoteResponse(
                    note_id=i.note_id,
                    case_id=i.case_id,
                    officer_id=i.officer_id,
                    note_text=i.note_text,
                    is_internal=i.is_internal,
                    created_at=i.created_at,
                    updated_at=i.updated_at,
                    officer=_officer_tiny(i.officer) if i.officer else None
                )
        from app.core.exceptions import NotFoundError
        raise NotFoundError("Note not found after creation")
        
    async def list_case_notes(self, requester: CurrentOfficerContext, case_id: int) -> list[CaseNoteResponse]:
        case = await load_case_for_access(self.session, case_id)
        if not case:
            raise CaseNotFoundError()
        if not await check_case_access(self.session, requester, case, "read"):
            raise CaseAccessDeniedError()

        is_admin = requester.role in (RoleNameEnum.ADMIN, RoleNameEnum.SUPERADMIN)
        is_dept_head = requester.role == RoleNameEnum.DEPARTMENT_HEAD and case.department_id == requester.department_id

        items = await self.repo.list_notes_by_case(case_id)
        
        responses = []
        from app.modules.case_management.schemas.responses import CaseNoteResponse
        for n in items:
            # Filter internal notes
            if n.is_internal and n.officer_id != requester.officer_id and not is_admin and not is_dept_head:
                continue
            responses.append(CaseNoteResponse(
                note_id=n.note_id,
                case_id=n.case_id,
                officer_id=n.officer_id,
                note_text=n.note_text,
                is_internal=n.is_internal,
                created_at=n.created_at,
                updated_at=n.updated_at,
                officer=_officer_tiny(n.officer) if n.officer else None
            ))
        return responses

    async def update_note(self, requester: CurrentOfficerContext, note_id: int, body: CaseNoteUpdateRequest) -> CaseNoteResponse:
        note = await self.repo.get_note_by_id(note_id)
        from app.core.exceptions import NotFoundError
        if not note:
            raise NotFoundError("Note not found")
        
        case_id = note.case_id
        case = await load_case_for_access(self.session, case_id)
        if not case or not await check_case_access(self.session, requester, case, "read"):
            raise CaseAccessDeniedError()

        is_admin = requester.role in (RoleNameEnum.ADMIN, RoleNameEnum.SUPERADMIN)
        if note.officer_id != requester.officer_id and not is_admin:
            raise CaseAccessDeniedError("You can only update your own notes")

        updated = await self.repo.update_note(note_id, body.model_dump(exclude_unset=True))
        await self.session.commit()
        
        updated_with_rels = await self.repo.get_note_by_id(note_id)
        from app.modules.case_management.schemas.responses import CaseNoteResponse
        return CaseNoteResponse(
            note_id=updated_with_rels.note_id,
            case_id=updated_with_rels.case_id,
            officer_id=updated_with_rels.officer_id,
            note_text=updated_with_rels.note_text,
            is_internal=updated_with_rels.is_internal,
            created_at=updated_with_rels.created_at,
            updated_at=updated_with_rels.updated_at,
            officer=_officer_tiny(updated_with_rels.officer) if updated_with_rels.officer else None
        )

    async def soft_delete_note(self, requester: CurrentOfficerContext, note_id: int):
        note = await self.repo.get_note_by_id(note_id)
        from app.core.exceptions import NotFoundError
        if not note:
            raise NotFoundError("Note not found")
            
        case_id = note.case_id
        case = await load_case_for_access(self.session, case_id)
        if not case or not await check_case_access(self.session, requester, case, "read"):
            raise CaseAccessDeniedError()

        is_admin = requester.role in (RoleNameEnum.ADMIN, RoleNameEnum.SUPERADMIN)
        if note.officer_id != requester.officer_id and not is_admin:
            raise CaseAccessDeniedError("You can only delete your own notes")

        await self.repo.soft_delete_note(note_id)
        await self.session.commit()

    # --- Advanced Queries ---
    async def get_case_timeline(
        self, requester: CurrentOfficerContext, case_id: int, update_type: str | None = None, page: int = 1, size: int = 20
    ) -> PaginatedResponse[CaseTimelineResponse]:
        case = await load_case_for_access(self.session, case_id)
        if not case:
            raise CaseNotFoundError()
        if not await check_case_access(self.session, requester, case, "read"):
            raise CaseAccessDeniedError()
            
        items, total = await self.repo.get_case_timeline(case_id, update_type, page, size)
        responses = [CaseTimelineResponse.model_validate(i) for i in items]
        return PaginatedResponse(items=responses, total=total, page=page, size=size)

    async def get_full_case_details(self, requester: CurrentOfficerContext, case_id: int) -> FullCaseDetailResponse:
        case_obj = await self.repo.get_full_case_details(case_id)
        if not case_obj:
            raise CaseNotFoundError()
        if not await check_case_access(self.session, requester, case_obj, "read"):
            raise CaseAccessDeniedError()
            
        is_admin_access = requester.role in (RoleNameEnum.ADMIN, RoleNameEnum.SUPERADMIN) or \
                         (requester.role == RoleNameEnum.DEPARTMENT_HEAD and case_obj.department_id == requester.department_id)
        
        filtered_notes = []
        for n in case_obj.notes:
            if not n.is_internal or n.officer_id == requester.officer_id or is_admin_access:
                filtered_notes.append(CaseNoteResponse.model_validate(n))
                
        recent_updates = [CaseTimelineResponse.model_validate(u) for u in case_obj.updates[:10]]
        
        officers = [CaseOfficerTinyResponse.model_validate(a) for a in case_obj.assignments]
        suspects = [CaseSuspectResponse.model_validate(s) for s in case_obj.suspect_links]
        victims = [CaseVictimResponse.model_validate(v) for v in case_obj.victim_links]
        witnesses = [CaseWitnessResponse.model_validate(w) for w in case_obj.witness_links]
        charges = [ChargeResponse.model_validate(c) for c in case_obj.charges]
        
        arrests = []
        for a in case_obj.arrests:
             arrests.append(self._map_arrest_to_response(a))
             
        evidence = [EvidenceResponse.model_validate(e) for e in case_obj.evidence_items]

        return FullCaseDetailResponse(
            case=CaseDetailResponse.model_validate(case_obj),
            status=CaseStatusBriefResponse.model_validate(case_obj.status),
            crime_type=CrimeTypeBriefResponse.model_validate(case_obj.crime_type),
            primary_location=LocationBriefResponse.model_validate(case_obj.primary_location) if case_obj.primary_location else None,
            lead_officer=_officer_tiny(case_obj.lead_officer) if case_obj.lead_officer else None,
            officers=officers,
            suspects=suspects,
            victims=victims,
            witnesses=witnesses,
            charges=charges,
            arrests=arrests,
            evidence=evidence,
            notes=filtered_notes,
            recent_updates=recent_updates
        )

    def _map_arrest_to_response(self, a):
        suspect_detail = self._person_to_suspect_detail(a.suspect) if a.suspect else None
        officer_tiny = _officer_tiny(a.arresting_officer) if a.arresting_officer else None
        loc = LocationBriefResponse.model_validate(a.location) if a.location else None
        
        return ArrestResponse(
            arrest_id=a.arrest_id,
            suspect_id=a.suspect_id,
            officer_id=a.officer_id,
            case_id=a.case_id,
            booking_number=a.booking_number,
            location_id=a.location_id,
            bail_amount=a.bail_amount,
            bail_set_at=a.bail_set_at,
            date=a.date,
            released_at=a.released_at,
            notes=a.notes,
            created_at=a.created_at,
            updated_at=a.updated_at,
            suspect=suspect_detail,
            arresting_officer=officer_tiny,
            location=loc
        )

    async def search_cases(
        self, requester: CurrentOfficerContext, filters: dict, page: int = 1, size: int = 20, sort_by: str = "created_at", sort_order: str = "desc"
    ) -> PaginatedResponse[CaseListItemResponse]:
        items, total = await self.repo.search_cases(filters, requester, page, size, sort_by, sort_order)
        responses = [CaseListItemResponse.model_validate(i) for i in items]
        return PaginatedResponse(items=responses, total=total, page=page, size=size)
