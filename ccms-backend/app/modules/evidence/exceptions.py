from __future__ import annotations

from app.core.exceptions import ConflictError, NotFoundError, ValidationError


class EvidenceTypeNotFoundError(NotFoundError):
    detail = "Evidence type not found"


class EvidenceNotFoundError(NotFoundError):
    detail = "Evidence not found"


class FutureCollectionDateError(ValidationError):
    detail = "Collected date cannot be in the future"


class CollectionBeforeCaseReportedError(ValidationError):
    detail = "Collected date cannot be before the case was reported"


class ClosedCaseModificationError(ConflictError):
    detail = "Cannot modify evidence for a closed case"


class ImmutableFieldError(ValidationError):
    detail = "Immutable fields cannot be modified"


class EvidenceSubmittedToCourtError(ConflictError):
    detail = "Evidence submitted to court cannot be modified"


class EvidenceHasForensicReportError(ConflictError):
    detail = "Evidence with a forensic report cannot be deleted"


class ReservedCustodyActionError(ValidationError):
    detail = "Action 'collected' is reserved for system use"


class InvalidCustodyActionError(ValidationError):
    detail = "Invalid custody action"


class ChronologyViolationError(ValidationError):
    detail = "Custody entry timestamp must be chronological"


class OfficerNotFoundError(NotFoundError):
    detail = "Officer not found"


class DuplicateCustodyEntryError(ConflictError):
    detail = "Duplicate custody entry detected"


class DuplicateForensicReportError(ConflictError):
    detail = "Forensic report already exists for this evidence"


class ForensicReportDateError(ValidationError):
    detail = "Report date cannot be before evidence was collected"


class ForensicReportFindingsRequiredError(ValidationError):
    detail = "Findings are required"


class EvidenceTypeMismatchError(ValidationError):
    detail = "Evidence type does not match required detail"


class VehicleDetailAlreadyExistsError(ConflictError):
    detail = "Vehicle detail already exists for this evidence"


class WeaponDetailAlreadyExistsError(ConflictError):
    detail = "Weapon detail already exists for this evidence"


class VehiclePlateNumberConflictError(ConflictError):
    detail = "Vehicle plate number already exists"


class WeaponSerialNumberConflictError(ConflictError):
    detail = "Weapon serial number already exists"
