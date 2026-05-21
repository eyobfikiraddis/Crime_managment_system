from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ForbiddenError
from app.modules.auth.models import Officer
from app.modules.auth.schemas.responses import CurrentOfficerContext
from app.modules.case_management.exceptions import CaseAccessDeniedError, CaseNotFoundError
from app.modules.case_management.permissions import check_case_access, load_case_for_access
from app.modules.case_management.schemas.responses import LocationBriefResponse, OfficerTinyResponse
from app.modules.evidence.exceptions import (
    ChronologyViolationError,
    ClosedCaseModificationError,
    CollectionBeforeCaseReportedError,
    DuplicateCustodyEntryError,
    DuplicateForensicReportError,
    EvidenceHasForensicReportError,
    EvidenceNotFoundError,
    EvidenceSubmittedToCourtError,
    EvidenceTypeMismatchError,
    EvidenceTypeNotFoundError,
    ForensicReportDateError,
    ForensicReportFindingsRequiredError,
    FutureCollectionDateError,
    ImmutableFieldError,
    InvalidCustodyActionError,
    OfficerNotFoundError,
    ReservedCustodyActionError,
    VehicleDetailAlreadyExistsError,
    VehiclePlateNumberConflictError,
    WeaponDetailAlreadyExistsError,
    WeaponSerialNumberConflictError,
)
from app.modules.evidence.models import EvidenceHistory
from app.modules.evidence.repository import EvidenceRepository
from app.modules.evidence.schemas.requests import (
    CrimeScenePhotoCreateRequest,
    CustodyEntryCreateRequest,
    EvidenceCreateRequest,
    EvidenceUpdateRequest,
    ForensicReportCreateRequest,
    VehicleDetailCreateRequest,
    WeaponDetailCreateRequest,
)
from app.modules.evidence.schemas.responses import (
    CrimeScenePhotoResponse,
    CustodyChainResponse,
    CustodyEntryResponse,
    EvidenceDetailResponse,
    EvidenceResponse,
    EvidenceTypeBriefResponse,
    ForensicReportResponse,
    VehicleDetailResponse,
    WeaponDetailResponse,
)
from app.shared.enums import RoleNameEnum
from app.shared.pagination import PaginatedResponse, PaginationParams


ALLOWED_CUSTODY_ACTIONS = {
    "collected",
    "transferred",
    "analyzed",
    "stored",
    "returned",
    "destroyed",
    "submitted_to_court",
    "relocated",
    "decommissioned",
}


def _officer_tiny(officer: Officer | None) -> OfficerTinyResponse | None:
    if officer is None or officer.person is None:
        return None
    return OfficerTinyResponse(
        officer_id=officer.officer_id,
        first_name=officer.person.first_name,
        last_name=officer.person.last_name,
        badge_number=officer.badge_number,
    )


class EvidenceService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = EvidenceRepository(session)

    async def _load_case(self, case_id: int):
        case = await load_case_for_access(self.session, case_id)
        if not case:
            raise CaseNotFoundError()
        return case

    async def _ensure_case_open(self, case_id: int) -> None:
        case = await self.repo.get_case_by_id(case_id)
        if not case:
            raise CaseNotFoundError()
        status = await self.repo.get_case_status(case.status_id)
        if status and status.is_terminal:
            raise ClosedCaseModificationError()

    def _officer_name(self, officer: Officer | None) -> str:
        if officer and officer.person:
            return f"{officer.person.first_name} {officer.person.last_name}"
        return "Unknown Officer"

    async def _location_label(self, location_id: int | None) -> str:
        loc = await self.repo.get_location_by_id(location_id)
        return loc.name if loc else "unassigned"

    def _to_evidence_response(self, evidence) -> EvidenceResponse:
        return EvidenceResponse(
            evidence_id=evidence.evidence_id,
            case_id=evidence.case_id,
            evidence_tag=evidence.evidence_tag,
            name=evidence.name,
            description=evidence.description,
            evidence_type_id=evidence.evidence_type_id,
            is_sensitive=evidence.is_sensitive,
            storage_location_id=evidence.storage_location_id,
            collected_by_officer_id=evidence.collected_by_officer_id,
            collected_at=evidence.collected_at,
            created_at=evidence.created_at,
            updated_at=evidence.updated_at,
            evidence_type=EvidenceTypeBriefResponse.model_validate(evidence.evidence_type)
            if evidence.evidence_type
            else None,
            collected_by_officer=_officer_tiny(evidence.collected_by_officer),
            storage_location=LocationBriefResponse.model_validate(evidence.storage_location)
            if evidence.storage_location
            else None,
        )

    def _to_custody_response(self, entry) -> CustodyEntryResponse:
        return CustodyEntryResponse(
            chain_id=entry.chain_id,
            evidence_id=entry.evidence_id,
            officer_id=entry.officer_id,
            action=entry.action,
            transferred_to=entry.transferred_to,
            location_id=entry.location_id,
            notes=entry.notes,
            created_at=entry.created_at,
            officer=_officer_tiny(entry.officer),
            transferred_to_officer=_officer_tiny(entry.transferred_to_officer),
            location=LocationBriefResponse.model_validate(entry.location)
            if entry.location
            else None,
        )

    def _to_forensic_report_response(self, report) -> ForensicReportResponse:
        return ForensicReportResponse(
            report_id=report.report_id,
            evidence_id=report.evidence_id,
            officer_id=report.officer_id,
            findings=report.findings,
            methodology=report.methodology,
            report_date=report.report_date,
            lab_reference=report.lab_reference,
            created_at=report.created_at,
            updated_at=report.updated_at,
            officer=_officer_tiny(report.officer),
        )

    def _to_vehicle_response(self, vehicle) -> VehicleDetailResponse:
        return VehicleDetailResponse(
            vehicle_id=vehicle.vehicle_id,
            evidence_id=vehicle.evidence_id,
            plate_number=vehicle.plate_number,
            type=vehicle.type,
            make=vehicle.make,
            model=vehicle.model,
            color=vehicle.color,
            year=vehicle.year,
            vin=vehicle.vin,
            description=vehicle.description,
        )

    def _to_weapon_response(self, weapon) -> WeaponDetailResponse:
        return WeaponDetailResponse(
            weapon_id=weapon.weapon_id,
            evidence_id=weapon.evidence_id,
            type=weapon.type,
            make=weapon.make,
            serial_number=weapon.serial_number,
            caliber=weapon.caliber,
            description=weapon.description,
        )

    def _to_photo_response(self, photo) -> CrimeScenePhotoResponse:
        return CrimeScenePhotoResponse(
            photo_id=photo.photo_id,
            case_id=photo.case_id,
            evidence_id=photo.evidence_id,
            image_url=photo.image_url,
            description=photo.description,
            captured_at=photo.captured_at,
            captured_by=photo.captured_by,
            created_at=photo.created_at,
            captured_by_officer=_officer_tiny(photo.photographer),
        )

    async def create_evidence(
        self,
        case_id: int,
        request_data: EvidenceCreateRequest,
        requesting_officer: CurrentOfficerContext,
    ) -> EvidenceResponse:
        case = await self._load_case(case_id)
        if not await check_case_access(self.session, requesting_officer, case, "write"):
            raise CaseAccessDeniedError()
        await self._ensure_case_open(case_id)

        evidence_type = await self.repo.get_evidence_type(request_data.evidence_type_id)
        if not evidence_type:
            raise EvidenceTypeNotFoundError()

        now = datetime.now(tz=timezone.utc)
        if request_data.collected_at > now:
            raise FutureCollectionDateError()

        reported_at = case.opened_at or case.created_at
        if reported_at and request_data.collected_at < reported_at:
            raise CollectionBeforeCaseReportedError()

        data = request_data.model_dump(exclude_unset=True)
        data["case_id"] = case_id
        data["collected_by_officer_id"] = requesting_officer.officer_id

        async with self.session.begin():
            evidence = await self.repo.create_evidence(data)
            await self.repo.add_case_update(
                case_id=case_id,
                officer_id=requesting_officer.officer_id,
                update_type="evidence_added",
                description=f"Evidence item #{evidence.evidence_id} ({evidence_type.name}) added",
            )
            await self.repo.add_custody_entry(
                evidence_id=evidence.evidence_id,
                officer_id=requesting_officer.officer_id,
                action="collected",
                location_id=request_data.storage_location_id,
                notes="Initial collection",
                created_at=now,
            )

        refreshed = await self.repo.get_evidence_by_id(evidence.evidence_id)
        if not refreshed:
            raise EvidenceNotFoundError()
        return self._to_evidence_response(refreshed)

    async def list_case_evidence(
        self,
        case_id: int,
        requesting_officer: CurrentOfficerContext,
        pagination: PaginationParams,
    ) -> PaginatedResponse[EvidenceResponse]:
        case = await self._load_case(case_id)
        if not await check_case_access(self.session, requesting_officer, case, "read"):
            raise CaseAccessDeniedError()

        rows, total = await self.repo.get_evidence_by_case(case_id, pagination)
        items = [self._to_evidence_response(row) for row in rows]
        return PaginatedResponse(
            items=items,
            total=total,
            page=pagination.page,
            size=pagination.size,
        )

    async def list_case_evidence_flat(
        self,
        case_id: int,
        requesting_officer: CurrentOfficerContext,
    ) -> list[EvidenceResponse]:
        case = await self._load_case(case_id)
        if not await check_case_access(self.session, requesting_officer, case, "read"):
            raise CaseAccessDeniedError()

        rows = await self.repo.list_evidence_by_case(case_id)
        return [self._to_evidence_response(row) for row in rows]

    async def update_evidence(
        self,
        evidence_id: int,
        request_data: EvidenceUpdateRequest,
        requesting_officer: CurrentOfficerContext,
    ) -> EvidenceResponse:
        evidence = await self.repo.get_evidence_by_id(evidence_id, include_deleted=True)
        if not evidence or evidence.deleted_at is not None:
            raise EvidenceNotFoundError()

        case = await self._load_case(evidence.case_id)
        can_write = await check_case_access(self.session, requesting_officer, case, "write")
        can_read = await check_case_access(self.session, requesting_officer, case, "read")
        if not (
            can_write
            or (
                requesting_officer.role_name == RoleNameEnum.forensic.value and can_read
            )
        ):
            raise CaseAccessDeniedError()

        await self._ensure_case_open(case.case_id)

        immutable_fields = {
            "evidence_type_id",
            "case_id",
            "collected_at",
            "collected_by_officer_id",
            "is_sensitive",
        }
        if any(field in request_data.model_fields_set for field in immutable_fields):
            raise ImmutableFieldError()

        update_data = request_data.model_dump(exclude_unset=True)
        update_data.pop("is_sensitive", None)
        if not update_data:
            return self._to_evidence_response(evidence)

        storage_location_changed = (
            "storage_location_id" in update_data
            and update_data["storage_location_id"] != evidence.storage_location_id
        )
        if storage_location_changed and await self.repo.has_custody_action(
            evidence_id, "submitted_to_court"
        ):
            raise EvidenceSubmittedToCourtError()

        changes: list[tuple[str, object | None, object | None]] = []
        for key, value in update_data.items():
            old_value = getattr(evidence, key, None)
            if old_value != value:
                changes.append((key, old_value, value))

        if not changes:
            return self._to_evidence_response(evidence)

        officer = await self.repo.get_officer_with_person(requesting_officer.officer_id)
        officer_name = self._officer_name(officer)

        async with self.session.begin():
            updated = await self.repo.update_evidence(evidence_id, update_data)
            if not updated:
                raise EvidenceNotFoundError()

            history_entries: list[EvidenceHistory] = []
            for field_name, old_value, new_value in changes:
                history_entries.append(
                    EvidenceHistory(
                        evidence_id=evidence_id,
                        changed_by=requesting_officer.officer_id,
                        field_name=field_name,
                        old_value=None if old_value is None else str(old_value),
                        new_value=None if new_value is None else str(new_value),
                        changed_at=datetime.now(tz=timezone.utc),
                    )
                )
            await self.repo.add_evidence_history_entries(history_entries)

            await self.repo.add_case_update(
                case_id=evidence.case_id,
                officer_id=requesting_officer.officer_id,
                update_type="evidence_updated",
                description=f"Evidence item #{evidence_id} updated by Officer {officer_name}",
            )

            if storage_location_changed:
                old_label = await self._location_label(evidence.storage_location_id)
                new_label = await self._location_label(update_data["storage_location_id"])
                await self.repo.add_case_update(
                    case_id=evidence.case_id,
                    officer_id=requesting_officer.officer_id,
                    update_type="evidence_updated",
                    description=(
                        f"Evidence #{evidence_id} relocated from {old_label} to {new_label}"
                    ),
                )

        refreshed = await self.repo.get_evidence_by_id(evidence_id)
        if not refreshed:
            raise EvidenceNotFoundError()
        return self._to_evidence_response(refreshed)

    async def update_case_evidence(
        self,
        case_id: int,
        evidence_id: int,
        request_data: EvidenceUpdateRequest,
        requesting_officer: CurrentOfficerContext,
    ) -> EvidenceResponse:
        evidence = await self.repo.get_evidence_by_id(evidence_id, include_deleted=True)
        if not evidence or evidence.deleted_at is not None:
            raise EvidenceNotFoundError()
        if evidence.case_id != case_id:
            raise EvidenceNotFoundError()
        return await self.update_evidence(
            evidence_id=evidence_id,
            request_data=request_data,
            requesting_officer=requesting_officer,
        )

    async def delete_evidence(
        self,
        evidence_id: int,
        requesting_officer: CurrentOfficerContext,
    ) -> None:
        evidence = await self.repo.get_evidence_by_id(evidence_id, include_deleted=True)
        if not evidence or evidence.deleted_at is not None:
            raise EvidenceNotFoundError()

        if requesting_officer.role_name not in {
            RoleNameEnum.admin.value,
            RoleNameEnum.superadmin.value,
        }:
            raise ForbiddenError("Insufficient privileges")

        if await self.repo.has_custody_action(evidence_id, "submitted_to_court"):
            raise EvidenceSubmittedToCourtError()

        report = await self.repo.get_forensic_report(evidence_id)
        if report and requesting_officer.role_name != RoleNameEnum.superadmin.value:
            raise EvidenceHasForensicReportError()

        async with self.session.begin():
            deleted = await self.repo.soft_delete_evidence(evidence_id)
            if not deleted:
                raise EvidenceNotFoundError()

            await self.repo.add_custody_entry(
                evidence_id=evidence_id,
                officer_id=requesting_officer.officer_id,
                action="decommissioned",
                notes="Evidence decommissioned",
            )

            await self.repo.add_case_update(
                case_id=evidence.case_id,
                officer_id=requesting_officer.officer_id,
                update_type="evidence_updated",
                description=f"Evidence #{evidence_id} marked as decommissioned",
            )

    async def get_evidence_detail(
        self,
        evidence_id: int,
        requesting_officer: CurrentOfficerContext,
    ) -> EvidenceDetailResponse:
        evidence = await self.repo.get_evidence_with_full_detail(evidence_id)
        if not evidence:
            raise EvidenceNotFoundError()

        case = await self._load_case(evidence.case_id)
        if not await check_case_access(self.session, requesting_officer, case, "read"):
            raise CaseAccessDeniedError()

        chain = sorted(evidence.chain_events or [], key=lambda c: c.created_at)
        chain_items = [self._to_custody_response(c) for c in chain]

        forensic = (
            self._to_forensic_report_response(evidence.forensic_report_doc)
            if evidence.forensic_report_doc
            else None
        )
        vehicle = self._to_vehicle_response(evidence.vehicle_detail) if evidence.vehicle_detail else None
        weapon = self._to_weapon_response(evidence.weapon_detail) if evidence.weapon_detail else None

        base = self._to_evidence_response(evidence)
        return EvidenceDetailResponse(
            **base.model_dump(),
            custody_chain=chain_items,
            forensic_report=forensic,
            vehicle=vehicle,
            weapon=weapon,
        )

    async def add_custody_event(
        self,
        evidence_id: int,
        request_data: CustodyEntryCreateRequest,
        requesting_officer: CurrentOfficerContext,
        case_id: int | None = None,
    ) -> CustodyEntryResponse:
        evidence = await self.repo.get_evidence_by_id(evidence_id, include_deleted=True)
        if not evidence or evidence.deleted_at is not None:
            raise EvidenceNotFoundError()
        if case_id is not None and evidence.case_id != case_id:
            raise EvidenceNotFoundError()

        case = await self._load_case(evidence.case_id)
        if not await check_case_access(self.session, requesting_officer, case, "write"):
            raise CaseAccessDeniedError()

        action = request_data.action
        if action not in ALLOWED_CUSTODY_ACTIONS:
            raise InvalidCustodyActionError()
        if action == "collected":
            raise ReservedCustodyActionError()

        if action == "transferred":
            if request_data.transferred_to is None:
                raise OfficerNotFoundError()
            receiving_officer = await self.repo.get_officer_active(
                request_data.transferred_to
            )
            if not receiving_officer:
                raise OfficerNotFoundError()

        timestamp = datetime.now(tz=timezone.utc)
        latest = await self.repo.get_latest_custody_entry(evidence_id)
        if latest and timestamp < latest.created_at:
            raise ChronologyViolationError()

        if await self.repo.custody_entry_exists(
            evidence_id=evidence_id,
            officer_id=requesting_officer.officer_id,
            action=action,
            timestamp=timestamp,
        ):
            raise DuplicateCustodyEntryError()

        async with self.session.begin():
            entry = await self.repo.add_custody_entry(
                evidence_id=evidence_id,
                officer_id=requesting_officer.officer_id,
                action=action,
                transferred_to=request_data.transferred_to,
                location_id=request_data.location_id,
                notes=request_data.notes,
                created_at=timestamp,
            )

            if action == "submitted_to_court":
                await self.repo.add_case_update(
                    case_id=evidence.case_id,
                    officer_id=requesting_officer.officer_id,
                    update_type="evidence_submitted_to_court",
                    description=f"Evidence #{evidence_id} submitted to court",
                )
            else:
                await self.repo.add_case_update(
                    case_id=evidence.case_id,
                    officer_id=requesting_officer.officer_id,
                    update_type="evidence_custody_transfer",
                    description=(
                        f"Custody of Evidence #{evidence_id} transferred. Action: {action}"
                    ),
                )

        chain = await self.repo.get_custody_chain(evidence_id)
        if not chain:
            raise EvidenceNotFoundError()
        return self._to_custody_response(chain[-1])

    async def get_full_custody_chain(
        self,
        evidence_id: int,
        requesting_officer: CurrentOfficerContext,
        case_id: int | None = None,
    ) -> list[CustodyEntryResponse]:
        evidence = await self.repo.get_evidence_by_id(evidence_id, include_deleted=True)
        if not evidence or evidence.deleted_at is not None:
            raise EvidenceNotFoundError()
        if case_id is not None and evidence.case_id != case_id:
            raise EvidenceNotFoundError()

        case = await self._load_case(evidence.case_id)
        if not await check_case_access(self.session, requesting_officer, case, "read"):
            raise CaseAccessDeniedError()

        chain = await self.repo.get_custody_chain(evidence_id)
        return [self._to_custody_response(c) for c in chain]

    async def get_custody_chain_response(
        self,
        evidence_id: int,
        requesting_officer: CurrentOfficerContext,
    ) -> CustodyChainResponse:
        chain = await self.get_full_custody_chain(
            evidence_id=evidence_id,
            requesting_officer=requesting_officer,
        )
        return CustodyChainResponse(evidence_id=evidence_id, items=chain)

    async def create_forensic_report(
        self,
        evidence_id: int,
        request_data: ForensicReportCreateRequest,
        requesting_officer: CurrentOfficerContext,
    ) -> ForensicReportResponse:
        evidence = await self.repo.get_evidence_by_id(evidence_id, include_deleted=True)
        if not evidence or evidence.deleted_at is not None:
            raise EvidenceNotFoundError()

        case = await self._load_case(evidence.case_id)
        can_write = await check_case_access(self.session, requesting_officer, case, "write")
        can_read = await check_case_access(self.session, requesting_officer, case, "read")
        if not (
            can_write
            or (
                requesting_officer.role_name == RoleNameEnum.forensic.value and can_read
            )
        ):
            raise CaseAccessDeniedError()

        if not request_data.findings or not request_data.findings.strip():
            raise ForensicReportFindingsRequiredError()

        if evidence.collected_at and request_data.report_date < evidence.collected_at.date():
            raise ForensicReportDateError()

        existing = await self.repo.get_forensic_report(evidence_id)
        if existing:
            raise DuplicateForensicReportError()

        officer = await self.repo.get_officer_with_person(requesting_officer.officer_id)
        officer_name = self._officer_name(officer)

        async with self.session.begin():
            report = await self.repo.create_forensic_report(
                {
                    "evidence_id": evidence_id,
                    "officer_id": requesting_officer.officer_id,
                    "findings": request_data.findings,
                    "methodology": request_data.methodology,
                    "report_date": request_data.report_date,
                    "lab_reference": request_data.lab_reference,
                }
            )

            await self.repo.add_case_update(
                case_id=evidence.case_id,
                officer_id=requesting_officer.officer_id,
                update_type="forensic_report_filed",
                description=(
                    f"Forensic report filed for Evidence #{evidence_id} by Officer {officer_name}"
                ),
            )

        refreshed = await self.repo.get_forensic_report(evidence_id)
        if not refreshed:
            raise EvidenceNotFoundError()
        return self._to_forensic_report_response(refreshed)

    async def get_forensic_report(
        self,
        evidence_id: int,
        requesting_officer: CurrentOfficerContext,
    ) -> ForensicReportResponse:
        evidence = await self.repo.get_evidence_by_id(evidence_id, include_deleted=True)
        if not evidence or evidence.deleted_at is not None:
            raise EvidenceNotFoundError()

        case = await self._load_case(evidence.case_id)
        if not await check_case_access(self.session, requesting_officer, case, "read"):
            raise CaseAccessDeniedError()

        report = await self.repo.get_forensic_report(evidence_id)
        if not report:
            raise EvidenceNotFoundError()
        return self._to_forensic_report_response(report)

    async def create_vehicle_detail(
        self,
        evidence_id: int,
        request_data: VehicleDetailCreateRequest,
        requesting_officer: CurrentOfficerContext,
    ) -> VehicleDetailResponse:
        evidence = await self.repo.get_evidence_by_id(evidence_id, include_deleted=True)
        if not evidence or evidence.deleted_at is not None:
            raise EvidenceNotFoundError()

        case = await self._load_case(evidence.case_id)
        if not await check_case_access(self.session, requesting_officer, case, "write"):
            raise CaseAccessDeniedError()

        if not evidence.evidence_type or evidence.evidence_type.name.lower() != "vehicle":
            raise EvidenceTypeMismatchError()

        existing = await self.repo.get_vehicle_by_evidence_id(evidence_id)
        if existing:
            raise VehicleDetailAlreadyExistsError()

        if request_data.plate_number:
            plate = await self.repo.get_vehicle_by_plate_number(request_data.plate_number)
            if plate:
                raise VehiclePlateNumberConflictError()

        vehicle = await self.repo.create_vehicle_detail(
            {"evidence_id": evidence_id, **request_data.model_dump(exclude_unset=True)}
        )
        return self._to_vehicle_response(vehicle)

    async def create_weapon_detail(
        self,
        evidence_id: int,
        request_data: WeaponDetailCreateRequest,
        requesting_officer: CurrentOfficerContext,
    ) -> WeaponDetailResponse:
        evidence = await self.repo.get_evidence_by_id(evidence_id, include_deleted=True)
        if not evidence or evidence.deleted_at is not None:
            raise EvidenceNotFoundError()

        case = await self._load_case(evidence.case_id)
        if not await check_case_access(self.session, requesting_officer, case, "write"):
            raise CaseAccessDeniedError()

        if not evidence.evidence_type or evidence.evidence_type.name.lower() != "weapon":
            raise EvidenceTypeMismatchError()

        existing = await self.repo.get_weapon_by_evidence_id(evidence_id)
        if existing:
            raise WeaponDetailAlreadyExistsError()

        if request_data.serial_number:
            serial = await self.repo.get_weapon_by_serial_number(request_data.serial_number)
            if serial:
                raise WeaponSerialNumberConflictError()

        weapon = await self.repo.create_weapon_detail(
            {"evidence_id": evidence_id, **request_data.model_dump(exclude_unset=True)}
        )
        return self._to_weapon_response(weapon)

    async def list_case_photos(
        self,
        case_id: int,
        requesting_officer: CurrentOfficerContext,
        page: int,
        size: int,
    ) -> PaginatedResponse[CrimeScenePhotoResponse]:
        case = await self._load_case(case_id)
        if not await check_case_access(self.session, requesting_officer, case, "read"):
            raise CaseAccessDeniedError()

        pagination = PaginationParams(page=page, size=size)
        rows, total = await self.repo.list_case_photos(case_id, pagination)
        items = [self._to_photo_response(row) for row in rows]
        return PaginatedResponse(items=items, total=total, page=page, size=size)

    async def create_case_photo(
        self,
        case_id: int,
        request_data: CrimeScenePhotoCreateRequest,
        requesting_officer: CurrentOfficerContext,
    ) -> CrimeScenePhotoResponse:
        case = await self._load_case(case_id)
        if not await check_case_access(self.session, requesting_officer, case, "write"):
            raise CaseAccessDeniedError()

        if request_data.evidence_id is not None:
            evidence = await self.repo.get_evidence_by_id(
                request_data.evidence_id, include_deleted=True
            )
            if not evidence or evidence.deleted_at is not None:
                raise EvidenceNotFoundError()
            if evidence.case_id != case_id:
                raise EvidenceNotFoundError()

        data = request_data.model_dump(exclude_unset=True)
        data["case_id"] = case_id
        data["captured_by"] = requesting_officer.officer_id

        if data.get("captured_at") is None:
            data["captured_at"] = datetime.now(tz=timezone.utc)

        async with self.session.begin():
            photo = await self.repo.create_case_photo(data)

        return self._to_photo_response(photo)
