from __future__ import annotations

from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core import redis_client as redis_ops
from app.core.security import hash_password
from app.modules.auth.schemas.responses import CurrentOfficerContext
from app.core.exceptions import ValidationError
from app.modules.auth.models import Officer
from app.modules.case_management.models import Arrest, Case, CaseOfficer, Charge
from app.modules.personnel.exceptions import (
    BadgeNumberConflictError,
    DepartmentNotFoundError,
    InsufficientRoleError,
    OfficerAlreadyExistsError,
    OfficerNotFoundError,
    PersonAlreadyExistsError,
    PersonNotFoundError,
    RoleNotFoundError,
    SuspectAlreadyExistsError,
    SuspectHasActiveChargesError,
    SuspectNotFoundError,
    VictimAlreadyExistsError,
    VictimNotFoundError,
    WitnessAlreadyExistsError,
    WitnessNotFoundError,
)
from app.modules.personnel.permissions import (
    can_promote_victim_or_witness,
    has_manage_users_access,
    is_admin_or_superadmin,
    is_investigator_or_above,
)
from app.modules.personnel.repository import (
    CiviliansRepository,
    DepartmentRepository,
    OfficerRepository,
    PersonRepository,
    RoleRepository,
)
from app.modules.personnel.schemas.requests import (
    CreateOfficerRequest,
    CreatePersonRequest,
    CreateSuspectRequest,
    CreateVictimRequest,
    CreateWitnessRequest,
    UpdateOfficerRequest,
    UpdatePersonRequest,
)
from app.modules.personnel.schemas.responses import (
    ArrestSummaryResponse,
    CaseOfficerAssignmentResponse,
    CaseSummaryResponse,
    ChargeSummaryResponse,
    OfficerBriefResponse,
    OfficerHistoryEntryResponse,
    OfficerResponse,
    PersonResponse,
    PersonSummaryResponse,
    SuspectDetailResponse,
    SuspectListItemResponse,
    SuspectResponse,
    VictimResponse,
    WitnessResponse,
)
from app.shared.enums import RiskLevelEnum, RoleNameEnum
from app.shared.pagination import PaginatedResponse
from app.shared.response_schemas import MessageResponse


class PersonService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.person_repo = PersonRepository(session)
        self.officer_repo = OfficerRepository(session)

    async def create_person(
        self, requester: CurrentOfficerContext, body: CreatePersonRequest
    ) -> PersonResponse:
        if not has_manage_users_access(requester):
            raise InsufficientRoleError()

        existing = await self.person_repo.get_by_national_id(
            body.national_id, include_deleted=True
        )
        if existing:
            raise PersonAlreadyExistsError()

        person = await self.person_repo.create(
            first_name=body.first_name,
            last_name=body.last_name,
            national_id=body.national_id,
            gender=body.gender,
            dob=body.dob,
            phone=body.phone,
            address=body.address,
        )
        return PersonResponse.model_validate(person)

    async def list_persons(
        self,
        requester: CurrentOfficerContext,
        search: str | None,
        active_only: bool,
        page: int,
        size: int,
    ) -> PaginatedResponse[PersonResponse]:
        if not has_manage_users_access(requester):
            raise InsufficientRoleError()

        offset = (page - 1) * size
        persons, total = await self.person_repo.list_persons(
            search=search,
            active_only=active_only,
            offset=offset,
            limit=size,
        )
        items = [PersonResponse.model_validate(p) for p in persons]
        return PaginatedResponse(items=items, total=total, page=page, size=size)

    async def get_person(
        self, requester: CurrentOfficerContext, person_id: int
    ) -> PersonResponse:
        if not has_manage_users_access(requester):
            raise InsufficientRoleError()

        person = await self.person_repo.get_by_id(person_id, include_deleted=False)
        if not person:
            raise PersonNotFoundError()
        return PersonResponse.model_validate(person)

    async def update_person(
        self,
        requester: CurrentOfficerContext,
        person_id: int,
        body: UpdatePersonRequest,
    ) -> PersonResponse:
        if not has_manage_users_access(requester):
            raise InsufficientRoleError()

        person = await self.person_repo.get_by_id(person_id, include_deleted=False)
        if not person:
            raise PersonNotFoundError()

        updates: dict[str, Any] = body.model_dump(exclude_unset=True)
        if updates:
            person = await self.person_repo.update(
                person=person,
                changed_by_officer_id=requester.officer_id,
                updates=updates,
            )

        linked_officer = await self.officer_repo.get_by_person_id(
            person.person_id, include_deleted=False
        )
        if linked_officer:
            await redis_ops.invalidate_officer_profile_cache(linked_officer.officer_id)

        return PersonResponse.model_validate(person)

    async def delete_person(
        self, requester: CurrentOfficerContext, person_id: int
    ) -> MessageResponse:
        if not has_manage_users_access(requester):
            raise InsufficientRoleError()

        person = await self.person_repo.get_by_id(person_id, include_deleted=False)
        if not person:
            raise PersonNotFoundError()

        await self.person_repo.soft_delete(person)

        linked_officer = await self.officer_repo.get_by_person_id(
            person.person_id, include_deleted=False
        )
        if linked_officer:
            await redis_ops.invalidate_officer_profile_cache(linked_officer.officer_id)
            await redis_ops.remove_officer_sessions(linked_officer.officer_id)

        return MessageResponse(message="Person deleted")


class OfficerService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.person_repo = PersonRepository(session)
        self.officer_repo = OfficerRepository(session)
        self.role_repo = RoleRepository(session)
        self.department_repo = DepartmentRepository(session)

    async def create_officer(
        self, requester: CurrentOfficerContext, body: CreateOfficerRequest
    ) -> OfficerResponse:
        if not is_admin_or_superadmin(requester):
            raise InsufficientRoleError()

        person = await self.person_repo.get_by_id(body.person_id, include_deleted=False)
        if not person:
            raise PersonNotFoundError()

        existing = await self.officer_repo.get_by_person_id(
            body.person_id, include_deleted=True
        )
        if existing:
            raise OfficerAlreadyExistsError()

        role = await self.role_repo.get_by_id(body.role_id)
        if not role:
            raise RoleNotFoundError()

        department_id = body.department_id
        if department_id is not None:
            department = await self.department_repo.get_by_id(department_id)
            if not department:
                raise DepartmentNotFoundError()

        if body.badge_number:
            badge_conflict = await self.officer_repo.get_by_badge_number(body.badge_number)
            if badge_conflict:
                raise BadgeNumberConflictError()

        password_hash = hash_password(body.password)
        officer = await self.officer_repo.create(
            person_id=body.person_id,
            department_id=department_id,
            role_id=body.role_id,
            password_hash=password_hash,
            rank=body.rank,
            badge_number=body.badge_number,
        )

        for field_name, new_value in {
            "rank": officer.rank,
            "badge_number": officer.badge_number,
            "role_id": officer.role_id,
            "department_id": officer.department_id,
        }.items():
            await self.officer_repo.write_officer_history(
                officer_id=officer.officer_id,
                changed_by=requester.officer_id,
                field_name=field_name,
                old_value=None,
                new_value=str(new_value) if new_value is not None else None,
            )

        full_officer = await self.officer_repo.get_by_id(
            officer.officer_id, include_deleted=False
        )
        if not full_officer:
            raise OfficerNotFoundError()
        return OfficerResponse.model_validate(full_officer)

    async def list_officers(
        self,
        requester: CurrentOfficerContext,
        department_id: int | None,
        role_id: int | None,
        search: str | None,
        active_only: bool,
        page: int,
        size: int,
    ) -> PaginatedResponse[OfficerResponse]:
        if not has_manage_users_access(requester):
            raise InsufficientRoleError()

        offset = (page - 1) * size
        officers, total = await self.officer_repo.list_officers(
            department_id=department_id,
            role_id=role_id,
            search=search,
            active_only=active_only,
            offset=offset,
            limit=size,
        )
        items = [OfficerResponse.model_validate(o) for o in officers]
        return PaginatedResponse(items=items, total=total, page=page, size=size)

    async def get_officer(
        self, requester: CurrentOfficerContext, officer_id: int
    ) -> OfficerResponse:
        if not has_manage_users_access(requester):
            raise InsufficientRoleError()

        officer = await self.officer_repo.get_by_id(officer_id, include_deleted=False)
        if not officer:
            raise OfficerNotFoundError()
        return OfficerResponse.model_validate(officer)

    async def update_officer(
        self,
        requester: CurrentOfficerContext,
        officer_id: int,
        body: UpdateOfficerRequest,
    ) -> OfficerResponse:
        if not has_manage_users_access(requester):
            raise InsufficientRoleError()

        officer = await self.officer_repo.get_by_id(officer_id, include_deleted=False)
        if not officer:
            raise OfficerNotFoundError()

        updates: dict[str, Any] = body.model_dump(exclude_unset=True)
        if "role_id" in updates:
            if updates["role_id"] is None:
                raise ValidationError("role_id cannot be null")
            role = await self.role_repo.get_by_id(updates["role_id"])
            if not role:
                raise RoleNotFoundError()
        if "department_id" in updates:
            department_id = updates["department_id"]
            if department_id is not None:
                department = await self.department_repo.get_by_id(department_id)
                if not department:
                    raise DepartmentNotFoundError()
        if "badge_number" in updates and updates["badge_number"]:
            conflict = await self.officer_repo.get_by_badge_number(
                updates["badge_number"], exclude_officer_id=officer.officer_id
            )
            if conflict:
                raise BadgeNumberConflictError()

        if updates:
            officer = await self.officer_repo.update(
                officer=officer,
                changed_by_officer_id=requester.officer_id,
                updates=updates,
            )

        await redis_ops.invalidate_officer_profile_cache(officer.officer_id)
        return OfficerResponse.model_validate(officer)

    async def delete_officer(
        self, requester: CurrentOfficerContext, officer_id: int
    ) -> MessageResponse:
        if not is_admin_or_superadmin(requester):
            raise InsufficientRoleError()

        officer = await self.officer_repo.get_by_id(officer_id, include_deleted=False)
        if not officer:
            raise OfficerNotFoundError()

        await self.officer_repo.soft_delete(officer)
        await redis_ops.invalidate_officer_profile_cache(officer.officer_id)
        await redis_ops.remove_officer_sessions(officer.officer_id)

        return MessageResponse(message="Officer deleted")


def _officer_brief(officer: Officer) -> OfficerBriefResponse:
    p = officer.person
    return OfficerBriefResponse(
        officer_id=officer.officer_id,
        badge_number=officer.badge_number,
        first_name=p.first_name,
        last_name=p.last_name,
        rank=officer.rank,
    )


def _case_to_summary(case: Case) -> CaseSummaryResponse:
    assigns: list[CaseOfficerAssignmentResponse] = []
    for co in case.case_officers:
        if not co.active:
            continue
        o = co.officer
        p = o.person
        assigns.append(
            CaseOfficerAssignmentResponse(
                officer_id=o.officer_id,
                badge_number=o.badge_number,
                first_name=p.first_name,
                last_name=p.last_name,
                rank=o.rank,
                role_in_case=co.role_in_case,
            )
        )
    return CaseSummaryResponse(
        case_id=case.case_id,
        case_number=case.case_number,
        title=case.title,
        status_name=case.status.status_name,
        crime_type_name=case.crime_type.name,
        opened_at=case.opened_at,
        assigned_officers=assigns,
    )


def _arrest_to_summary(arrest: Arrest) -> ArrestSummaryResponse:
    bail: str | None = None
    if arrest.bail_amount is not None:
        bail = format(arrest.bail_amount, "f")
    case_title = arrest.case.title if arrest.case else None
    return ArrestSummaryResponse(
        arrest_id=arrest.arrest_id,
        booking_number=arrest.booking_number,
        date=arrest.date,
        released_at=arrest.released_at,
        bail_amount=bail,
        case_id=arrest.case_id,
        case_title=case_title,
        arresting_officer=_officer_brief(arrest.arresting_officer),
    )


def _charge_to_summary(charge: Charge) -> ChargeSummaryResponse:
    return ChargeSummaryResponse(
        charge_id=charge.charge_id,
        crime_type_name=charge.crime_type.name,
        charge_status=charge.charge_status,
        description=charge.description,
        verdict=charge.verdict,
        filed_at=charge.filed_at,
        case_id=charge.case_id,
        case_number=charge.case.case_number,
        court_case_id=None,
    )


class CiviliansService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.civ = CiviliansRepository(session)
        self.person_repo = PersonRepository(session)
        self.officer_repo = OfficerRepository(session)

    async def promote_to_suspect(
        self,
        requester: CurrentOfficerContext,
        person_id: int,
        body: CreateSuspectRequest,
    ) -> SuspectResponse:
        person = await self.person_repo.get_by_id(person_id, include_deleted=False)
        if not person:
            raise PersonNotFoundError()

        prior = await self.civ.get_suspect_by_person_id(person_id, include_deleted=True)
        if prior and prior.deleted_at is None:
            raise SuspectAlreadyExistsError()
        if prior and prior.deleted_at is not None:
            await self.civ.reactivate_suspect(
                prior,
                criminal_record=body.criminal_record,
                risk_level=body.risk_level,
            )
            await self.session.refresh(prior, attribute_names=["person"])
            loaded = await self._load_suspect_with_person(prior.suspect_id)
            if not loaded:
                raise SuspectNotFoundError()
            return SuspectResponse.model_validate(loaded)

        row = await self.civ.create_suspect(
            person_id=person_id,
            criminal_record=body.criminal_record,
            risk_level=body.risk_level,
        )
        loaded = await self._load_suspect_with_person(row.suspect_id)
        if not loaded:
            raise SuspectNotFoundError()
        return SuspectResponse.model_validate(loaded)

    async def _load_suspect_with_person(self, suspect_id: int):
        from app.modules.personnel.models import Suspect

        r = await self.session.execute(
            select(Suspect)
            .options(selectinload(Suspect.person))
            .where(Suspect.suspect_id == suspect_id)
        )
        return r.scalar_one_or_none()

    async def deactivate_suspect(
        self, requester: CurrentOfficerContext, person_id: int
    ) -> MessageResponse:
        if requester.role_name not in {
            RoleNameEnum.admin.value,
            RoleNameEnum.superadmin.value,
        }:
            raise InsufficientRoleError()

        suspect = await self.civ.get_suspect_by_person_id(person_id, include_deleted=False)
        if not suspect:
            raise SuspectNotFoundError()

        if await self.civ.person_has_blocking_charges(suspect.person_id):
            raise SuspectHasActiveChargesError()

        await self.civ.soft_delete_suspect(suspect)
        return MessageResponse(message="Suspect record deactivated")

    async def list_suspects(
        self,
        requester: CurrentOfficerContext,
        risk_level: RiskLevelEnum | None,
        include_deleted: bool,
        involved_in_case_id: int | None,
        page: int,
        size: int,
    ) -> PaginatedResponse[SuspectListItemResponse]:
        if include_deleted and requester.role_name not in {
            RoleNameEnum.admin.value,
            RoleNameEnum.superadmin.value,
        }:
            raise InsufficientRoleError()

        suspects, total = await self.civ.list_suspects(
            risk_level=risk_level,
            include_deleted=include_deleted,
            case_id=involved_in_case_id,
            page=page,
            size=size,
        )
        pids = [s.person_id for s in suspects]
        case_c = await self.civ.count_active_cases_as_suspect_for_persons(pids)
        chg_c = await self.civ.count_active_charges_for_persons(pids)
        items = [
            SuspectListItemResponse(
                suspect_id=s.suspect_id,
                person=PersonSummaryResponse.model_validate(s.person),
                risk_level=s.risk_level,
                active_case_count=case_c.get(s.person_id, 0),
                active_charge_count=chg_c.get(s.person_id, 0),
                deleted_at=s.deleted_at,
            )
            for s in suspects
        ]
        return PaginatedResponse(items=items, total=total, page=page, size=size)

    async def get_suspect_detail(
        self, requester: CurrentOfficerContext, suspect_id: int
    ) -> SuspectDetailResponse:
        if not is_investigator_or_above(requester):
            raise InsufficientRoleError()

        s = await self.civ.get_suspect_by_id(suspect_id)
        if not s:
            raise SuspectNotFoundError()

        base = SuspectResponse.model_validate(s)
        ac = await self.civ.count_arrests_for_suspect(suspect_id)
        cc = await self.civ.count_charges_for_person(s.person_id)
        kc = await self.civ.count_cases_as_suspect_for_person(s.person_id)
        return SuspectDetailResponse(
            **base.model_dump(),
            arrest_count=ac,
            charge_count=cc,
            case_count=kc,
        )

    async def get_suspect_cases(
        self,
        requester: CurrentOfficerContext,
        suspect_id: int,
        page: int,
        size: int,
    ) -> PaginatedResponse[CaseSummaryResponse]:
        if not is_investigator_or_above(requester):
            raise InsufficientRoleError()

        s = await self.civ.get_suspect_by_id(suspect_id)
        if not s:
            raise SuspectNotFoundError()

        offset = (page - 1) * size
        cases, total = await self.civ.get_suspect_cases(s.person_id, offset, size)
        items = [_case_to_summary(c) for c in cases]
        return PaginatedResponse(items=items, total=total, page=page, size=size)

    async def get_suspect_arrests(
        self,
        requester: CurrentOfficerContext,
        suspect_id: int,
        page: int,
        size: int,
    ) -> PaginatedResponse[ArrestSummaryResponse]:
        if not is_investigator_or_above(requester):
            raise InsufficientRoleError()

        s = await self.civ.get_suspect_by_id(suspect_id)
        if not s:
            raise SuspectNotFoundError()

        offset = (page - 1) * size
        rows, total = await self.civ.get_suspect_arrests(suspect_id, offset, size)
        items = [_arrest_to_summary(a) for a in rows]
        return PaginatedResponse(items=items, total=total, page=page, size=size)

    async def get_suspect_charges(
        self,
        requester: CurrentOfficerContext,
        suspect_id: int,
        page: int,
        size: int,
    ) -> PaginatedResponse[ChargeSummaryResponse]:
        if not is_investigator_or_above(requester):
            raise InsufficientRoleError()

        s = await self.civ.get_suspect_by_id(suspect_id)
        if not s:
            raise SuspectNotFoundError()

        offset = (page - 1) * size
        rows, total = await self.civ.get_suspect_charges(s.person_id, offset, size)
        items = [_charge_to_summary(c) for c in rows]
        return PaginatedResponse(items=items, total=total, page=page, size=size)

    async def promote_to_victim(
        self,
        requester: CurrentOfficerContext,
        person_id: int,
        body: CreateVictimRequest,
    ) -> VictimResponse:
        if not can_promote_victim_or_witness(requester):
            raise InsufficientRoleError()

        person = await self.person_repo.get_by_id(person_id, include_deleted=False)
        if not person:
            raise PersonNotFoundError()

        prior = await self.civ.get_victim_by_person_id(person_id, include_deleted=True)
        if prior and prior.deleted_at is None:
            raise VictimAlreadyExistsError()
        if prior and prior.deleted_at is not None:
            await self.civ.reactivate_victim(prior, notes=body.notes)
            await self.session.refresh(prior, attribute_names=["person"])
            return VictimResponse.model_validate(prior)

        row = await self.civ.create_victim(person_id, body.notes)
        from app.modules.personnel.models import Victim

        r = await self.session.execute(
            select(Victim)
            .options(selectinload(Victim.person))
            .where(Victim.victim_id == row.victim_id)
        )
        loaded = r.scalar_one()
        return VictimResponse.model_validate(loaded)

    async def deactivate_victim(
        self, requester: CurrentOfficerContext, person_id: int
    ) -> MessageResponse:
        if requester.role_name not in {
            RoleNameEnum.admin.value,
            RoleNameEnum.superadmin.value,
        }:
            raise InsufficientRoleError()

        v = await self.civ.get_victim_by_person_id(person_id, include_deleted=False)
        if not v:
            raise VictimNotFoundError()

        await self.civ.soft_delete_victim(v)
        return MessageResponse(message="Victim record deactivated")

    async def promote_to_witness(
        self,
        requester: CurrentOfficerContext,
        person_id: int,
        body: CreateWitnessRequest,
    ) -> WitnessResponse:
        if not can_promote_victim_or_witness(requester):
            raise InsufficientRoleError()

        person = await self.person_repo.get_by_id(person_id, include_deleted=False)
        if not person:
            raise PersonNotFoundError()

        prior = await self.civ.get_witness_by_person_id(person_id, include_deleted=True)
        if prior and prior.deleted_at is None:
            raise WitnessAlreadyExistsError()
        if prior and prior.deleted_at is not None:
            await self.civ.reactivate_witness(
                prior,
                credibility_notes=body.credibility_notes,
                is_protected=body.is_protected,
            )
            await self.session.refresh(prior, attribute_names=["person"])
            return WitnessResponse.model_validate(prior)

        row = await self.civ.create_witness(
            person_id,
            credibility_notes=body.credibility_notes,
            is_protected=body.is_protected,
        )
        from app.modules.personnel.models import Witness

        r = await self.session.execute(
            select(Witness)
            .options(selectinload(Witness.person))
            .where(Witness.witness_id == row.witness_id)
        )
        loaded = r.scalar_one()
        return WitnessResponse.model_validate(loaded)

    async def deactivate_witness(
        self, requester: CurrentOfficerContext, person_id: int
    ) -> MessageResponse:
        if requester.role_name not in {
            RoleNameEnum.admin.value,
            RoleNameEnum.superadmin.value,
        }:
            raise InsufficientRoleError()

        w = await self.civ.get_witness_by_person_id(person_id, include_deleted=False)
        if not w:
            raise WitnessNotFoundError()

        await self.civ.soft_delete_witness(w)
        return MessageResponse(message="Witness record deactivated")

    async def get_officer_history(
        self,
        requester: CurrentOfficerContext,
        officer_id: int,
        page: int,
        size: int,
    ) -> PaginatedResponse[OfficerHistoryEntryResponse]:
        if requester.role_name not in {
            RoleNameEnum.admin.value,
            RoleNameEnum.superadmin.value,
        }:
            raise InsufficientRoleError()

        officer = await self.officer_repo.get_by_id(officer_id, include_deleted=True)
        if not officer:
            raise OfficerNotFoundError()

        offset = (page - 1) * size
        rows, total = await self.civ.get_officer_history(officer_id, offset, size)
        items = [
            OfficerHistoryEntryResponse(
                history_id=h.history_id,
                officer_id=h.officer_id,
                changed_by=h.changed_by,
                changed_by_name=name,
                field_name=h.field_name,
                old_value=h.old_value,
                new_value=h.new_value,
                changed_at=h.changed_at,
            )
            for h, name in rows
        ]
        return PaginatedResponse(items=items, total=total, page=page, size=size)
