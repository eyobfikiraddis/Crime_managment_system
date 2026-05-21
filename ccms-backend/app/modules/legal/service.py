from __future__ import annotations

from datetime import datetime, timezone
import os

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError, ValidationError
from app.modules.case_management.exceptions import CaseAccessDeniedError, CaseNotFoundError
from app.modules.case_management.permissions import check_case_access
from app.modules.case_management.repository import CaseRepository
from app.modules.case_management.models import CaseStatus, CrimeType
from app.modules.personnel.repository import CiviliansRepository
from app.modules.legal.repository import LegalRepository
from app.shared.enums import ChargeStatusEnum, RoleNameEnum, VerdictEnum
from app.shared.pagination import PaginatedResponse

VALID_VERDICTS = {v.value for v in VerdictEnum}
TERMINAL_VERDICTS = {
    VerdictEnum.guilty.value,
    VerdictEnum.not_guilty.value,
    VerdictEnum.dismissed.value,
}

VALID_CHARGE_STATUSES = {s.value for s in ChargeStatusEnum}
TERMINAL_CHARGE_STATUSES = {
    ChargeStatusEnum.convicted,
    ChargeStatusEnum.acquitted,
    ChargeStatusEnum.dismissed,
}

CHARGE_TRANSITIONS = {
    ChargeStatusEnum.filed: {ChargeStatusEnum.pending, ChargeStatusEnum.dismissed},
    ChargeStatusEnum.pending: {
        ChargeStatusEnum.dismissed,
        ChargeStatusEnum.convicted,
        ChargeStatusEnum.acquitted,
    },
    ChargeStatusEnum.dismissed: set(),
    ChargeStatusEnum.convicted: set(),
    ChargeStatusEnum.acquitted: set(),
    ChargeStatusEnum.appealed: set(),
}

AUTO_CLOSE_ON_VERDICT = os.getenv("AUTO_CLOSE_ON_VERDICT", "true").lower() == "true"


class LegalService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.legal_repo = LegalRepository(session)
        self.case_repo = CaseRepository(session)
        self.civ_repo = CiviliansRepository(session)

    async def create_court_case(self, case_id: int, requester, data):
        if requester.role_name not in (
            RoleNameEnum.legal_officer.value,
            RoleNameEnum.admin.value,
            RoleNameEnum.superadmin.value,
        ):
            raise ForbiddenError(
                "Only legal officers, admins, and superadmins can open court cases"
            )

        case = await self.case_repo.get_by_id(case_id)
        if not case:
            raise CaseNotFoundError()

        current_status = case.status.status_name if case.status else ""
        if current_status != "referred_to_court":
            raise ValidationError(
                "Case must be in 'referred_to_court' status to open court proceedings"
            )

        existing = await self.legal_repo.get_court_case_by_case_id(case_id)
        if existing:
            raise ConflictError("A court case already exists for this case")

        if data.hearing_date and data.hearing_date <= datetime.now(tz=timezone.utc).date():
            raise ValidationError("Hearing date must be in the future")

        court_case = await self.legal_repo.create_court_case(
            case_id=case_id,
            court_name=data.court_name,
            court_reference=data.court_reference,
            judge_name=data.judge_name,
            prosecutor_name=data.prosecutor_name,
            hearing_date=data.hearing_date,
        )
        await self.case_repo.create_case_update(
            case_id=case_id,
            officer_id=requester.officer_id,
            update_type="court_case_opened",
            description=f"Court case opened at {data.court_name}",
        )
        return court_case

    async def get_court_case(self, case_id: int, requester):
        case = await self.case_repo.get_by_id(case_id)
        if not case:
            raise CaseNotFoundError()

        if requester.role_name not in (
            RoleNameEnum.legal_officer.value,
            RoleNameEnum.admin.value,
            RoleNameEnum.superadmin.value,
        ):
            if not await check_case_access(self.session, requester, case, "read"):
                raise CaseAccessDeniedError()

        court_case = await self.legal_repo.get_court_case_by_case_id(case_id)
        if not court_case:
            raise NotFoundError("No court case has been opened for this case")

        charges, _total = await self.legal_repo.list_charges_by_case(
            case_id=case_id,
            suspect_id_filter=None,
            status_filter=None,
            page=1,
            size=1000,
        )
        self._attach_sentences(charges)
        court_case.charges = charges
        return court_case

    async def patch_court_case(self, court_case_id: int, requester, data):
        if requester.role_name not in (
            RoleNameEnum.legal_officer.value,
            RoleNameEnum.admin.value,
            RoleNameEnum.superadmin.value,
        ):
            raise ForbiddenError(
                "Only legal officers, admins, and superadmins can update court cases"
            )

        court_case = await self.legal_repo.get_court_case_by_id(court_case_id)
        if not court_case:
            raise NotFoundError("Court case not found")

        current_verdict = self._verdict_value(court_case.verdict)
        if data.verdict is not None:
            if data.verdict not in VALID_VERDICTS:
                raise ValidationError(
                    f"Invalid verdict. Must be one of: {', '.join(sorted(VALID_VERDICTS))}"
                )
            if current_verdict in TERMINAL_VERDICTS:
                raise ConflictError(
                    "Verdict is immutable once a terminal verdict has been recorded"
                )

        if data.hearing_date is not None and data.hearing_date <= datetime.now(
            tz=timezone.utc
        ).date():
            raise ValidationError("Hearing date must be in the future")

        if data.court_name is not None:
            court_case.court_name = data.court_name
        if data.court_reference is not None:
            court_case.court_reference = data.court_reference
        if data.judge_name is not None:
            court_case.judge_name = data.judge_name
        if data.prosecutor_name is not None:
            court_case.prosecutor_name = data.prosecutor_name
        if data.hearing_date is not None:
            court_case.hearing_date = data.hearing_date
        if data.verdict_notes is not None:
            court_case.verdict_notes = data.verdict_notes

        verdict_changed = False
        if data.verdict is not None and data.verdict != current_verdict:
            court_case.verdict = VerdictEnum(data.verdict)
            verdict_changed = True
            if data.verdict in TERMINAL_VERDICTS:
                court_case.closed_at = datetime.now(tz=timezone.utc)

        court_case.updated_at = datetime.now(tz=timezone.utc)
        await self.legal_repo.update_court_case(court_case)

        if verdict_changed:
            await self.case_repo.create_case_update(
                case_id=court_case.case_id,
                officer_id=requester.officer_id,
                update_type="verdict_recorded",
                description=f"Verdict recorded: {data.verdict}",
            )

        if verdict_changed and data.verdict in TERMINAL_VERDICTS and AUTO_CLOSE_ON_VERDICT:
            unresolved = await self.legal_repo.count_unresolved_charges_for_court_case(
                court_case.court_case_id
            )
            if unresolved == 0:
                closed_status_id = await self._get_closed_status_id()
                if closed_status_id:
                    await self.case_repo.update_case(
                        court_case.case_id,
                        {
                            "status_id": closed_status_id,
                            "closed_at": datetime.now(tz=timezone.utc),
                            "closed_by": requester.officer_id,
                        },
                        requester.officer_id,
                    )
                    await self.case_repo.create_case_update(
                        case_id=court_case.case_id,
                        officer_id=requester.officer_id,
                        update_type="status_change",
                        description="Case automatically closed - all charges resolved",
                    )

        return court_case

    async def create_charge(self, case_id: int, requester, data):
        if requester.role_name not in (
            RoleNameEnum.legal_officer.value,
            RoleNameEnum.admin.value,
            RoleNameEnum.superadmin.value,
        ):
            raise ForbiddenError(
                "Only legal officers, admins, and superadmins can file charges"
            )

        case = await self.case_repo.get_by_id(case_id)
        if not case:
            raise CaseNotFoundError()

        suspect_linked = await self.legal_repo.suspect_linked_to_case(
            case_id, data.suspect_id
        )
        if not suspect_linked:
            raise ValidationError(
                "Suspect is not linked to this case. Link the suspect first."
            )

        suspect = await self.civ_repo.get_suspect_by_id(data.suspect_id)
        if not suspect:
            raise NotFoundError("Suspect not found")

        crime_type = await self._get_crime_type(data.crime_type_id)
        if not crime_type:
            raise NotFoundError("Crime type not found")

        if data.court_case_id is not None:
            court_case = await self.legal_repo.get_court_case_by_id(data.court_case_id)
            if not court_case or court_case.case_id != case_id:
                raise ValidationError("Court case does not belong to this case")

        charge = await self.legal_repo.create_charge(
            case_id=case_id,
            court_case_id=data.court_case_id,
            suspect_id=data.suspect_id,
            person_id=suspect.person_id,
            crime_type_id=data.crime_type_id,
            description=data.description,
        )
        await self.case_repo.create_case_update(
            case_id=case_id,
            officer_id=requester.officer_id,
            update_type="charge_filed",
            description=f"Charge filed against Suspect #{data.suspect_id}: {crime_type.name}",
        )
        return charge

    async def list_charges(
        self,
        case_id: int,
        requester,
        suspect_id: int | None,
        status: str | None,
        page: int,
        size: int,
    ) -> PaginatedResponse:
        case = await self.case_repo.get_by_id(case_id)
        if not case:
            raise CaseNotFoundError()

        if requester.role_name not in (
            RoleNameEnum.legal_officer.value,
            RoleNameEnum.admin.value,
            RoleNameEnum.superadmin.value,
        ):
            if not await check_case_access(self.session, requester, case, "read"):
                raise CaseAccessDeniedError()

        status_filter = self._parse_charge_status(status) if status else None
        charges, total = await self.legal_repo.list_charges_by_case(
            case_id=case_id,
            suspect_id_filter=suspect_id,
            status_filter=status_filter,
            page=page,
            size=size,
        )
        self._attach_sentences(charges)
        return PaginatedResponse(items=charges, total=total, page=page, size=size)

    async def patch_charge(self, charge_id: int, requester, data):
        if requester.role_name not in (
            RoleNameEnum.legal_officer.value,
            RoleNameEnum.admin.value,
            RoleNameEnum.superadmin.value,
        ):
            raise ForbiddenError(
                "Only legal officers, admins, and superadmins can update charges"
            )

        charge = await self.legal_repo.get_charge_by_id(charge_id)
        if not charge:
            raise NotFoundError("Charge not found")

        if charge.charge_status in TERMINAL_CHARGE_STATUSES:
            raise ConflictError(
                "Charge status is immutable - this charge has reached a terminal state"
            )

        new_status = self._parse_charge_status(data.status)
        allowed_next = CHARGE_TRANSITIONS.get(charge.charge_status, set())
        if new_status not in allowed_next:
            allowed_str = ", ".join(s.value for s in allowed_next) or "none"
            raise ValidationError(
                f"Invalid status transition from '{charge.charge_status.value}' to '{new_status.value}'. "
                f"Allowed: {allowed_str}"
            )

        updated_charge = await self.legal_repo.update_charge_status(charge, new_status)
        await self.case_repo.create_case_update(
            case_id=charge.case_id,
            officer_id=requester.officer_id,
            update_type="charge_updated",
            description=f"Charge #{charge_id} status updated to {new_status.value}",
        )
        return updated_charge

    async def drop_charge(self, charge_id: int, requester):
        if requester.role_name not in (
            RoleNameEnum.legal_officer.value,
            RoleNameEnum.admin.value,
            RoleNameEnum.superadmin.value,
        ):
            raise ForbiddenError(
                "Only legal officers, admins, and superadmins can drop charges"
            )

        charge = await self.legal_repo.get_charge_by_id(charge_id)
        if not charge:
            raise NotFoundError("Charge not found")

        if charge.charge_status != ChargeStatusEnum.filed:
            raise ValidationError("Only charges in 'filed' status can be dropped")

        existing_sentence = await self.legal_repo.get_sentence_by_charge_id(charge_id)
        if existing_sentence:
            raise ConflictError(
                "Cannot drop a charge that already has a sentence recorded"
            )

        dropped = await self.legal_repo.drop_charge(charge)
        await self.case_repo.create_case_update(
            case_id=charge.case_id,
            officer_id=requester.officer_id,
            update_type="charge_dropped",
            description=f"Charge #{charge_id} dropped",
        )
        return dropped

    async def create_sentence(self, charge_id: int, requester, data):
        if requester.role_name not in (
            RoleNameEnum.legal_officer.value,
            RoleNameEnum.admin.value,
            RoleNameEnum.superadmin.value,
        ):
            raise ForbiddenError(
                "Only legal officers, admins, and superadmins can record sentences"
            )

        charge = await self.legal_repo.get_charge_by_id(charge_id)
        if not charge:
            raise NotFoundError("Charge not found")

        if charge.charge_status != ChargeStatusEnum.convicted:
            raise ValidationError(
                "A sentence can only be recorded for a convicted charge"
            )

        if charge.court_case_id != data.court_case_id:
            raise ValidationError(
                "Court case ID does not match the charge's associated court case"
            )

        existing = await self.legal_repo.get_sentence_by_charge_id(charge_id)
        if existing:
            raise ConflictError("A sentence already exists for this charge")

        sentence = await self.legal_repo.create_sentence(
            charge_id=charge_id,
            court_case_id=data.court_case_id,
            description=data.description,
            duration=data.duration,
            duration_days=data.duration_days,
            start_date=data.start_date,
            end_date=data.end_date,
            sentence_type=data.sentence_type,
            is_suspended=data.is_suspended,
            sentenced_at=data.sentenced_at,
        )
        await self.case_repo.create_case_update(
            case_id=charge.case_id,
            officer_id=requester.officer_id,
            update_type="sentence_recorded",
            description=f"Sentence recorded for Charge #{charge_id}: {data.duration}",
        )

        if AUTO_CLOSE_ON_VERDICT:
            court_case = await self.legal_repo.get_court_case_by_id(data.court_case_id)
            verdict_value = self._verdict_value(court_case.verdict) if court_case else None
            if verdict_value in TERMINAL_VERDICTS:
                unresolved = await self.legal_repo.count_unresolved_charges_for_court_case(
                    data.court_case_id
                )
                if unresolved == 0:
                    closed_status_id = await self._get_closed_status_id()
                    if closed_status_id:
                        await self.case_repo.update_case(
                            charge.case_id,
                            {
                                "status_id": closed_status_id,
                                "closed_at": datetime.now(tz=timezone.utc),
                                "closed_by": requester.officer_id,
                            },
                            requester.officer_id,
                        )
                        await self.case_repo.create_case_update(
                            case_id=charge.case_id,
                            officer_id=requester.officer_id,
                            update_type="status_change",
                            description="Case automatically closed - all charges resolved",
                        )

        return sentence

    async def get_sentence(self, charge_id: int, requester):
        charge = await self.legal_repo.get_charge_by_id(charge_id)
        if not charge:
            raise NotFoundError("Charge not found")

        if requester.role_name not in (
            RoleNameEnum.legal_officer.value,
            RoleNameEnum.admin.value,
            RoleNameEnum.superadmin.value,
        ):
            case = await self.case_repo.get_by_id(charge.case_id)
            if case and not await check_case_access(self.session, requester, case, "read"):
                raise CaseAccessDeniedError()

        sentence = await self.legal_repo.get_sentence_by_charge_id(charge_id)
        if not sentence:
            raise NotFoundError("No sentence has been recorded for this charge")
        return sentence

    async def _get_case_status_name(self, status_id: int) -> str:
        result = await self.session.execute(
            select(CaseStatus).where(CaseStatus.status_id == status_id)
        )
        status = result.scalar_one_or_none()
        return status.status_name if status else ""

    async def _get_closed_status_id(self) -> int | None:
        result = await self.session.execute(
            select(CaseStatus).where(CaseStatus.status_name == "closed")
        )
        status = result.scalar_one_or_none()
        return status.status_id if status else None

    async def _get_crime_type(self, crime_type_id: int) -> CrimeType | None:
        result = await self.session.execute(
            select(CrimeType).where(CrimeType.crime_type_id == crime_type_id)
        )
        return result.scalar_one_or_none()

    def _parse_charge_status(self, status: str) -> ChargeStatusEnum:
        if status not in VALID_CHARGE_STATUSES:
            raise ValidationError(
                f"Invalid status. Must be one of: {', '.join(sorted(VALID_CHARGE_STATUSES))}"
            )
        return ChargeStatusEnum(status)

    def _verdict_value(self, verdict) -> str | None:
        if verdict is None:
            return None
        return verdict.value if hasattr(verdict, "value") else str(verdict)

    def _attach_sentences(self, charges) -> None:
        for charge in charges:
            if hasattr(charge, "sentence_record"):
                charge.sentence = charge.sentence_record
