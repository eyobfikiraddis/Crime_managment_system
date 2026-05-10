from __future__ import annotations

from fastapi import status

from app.core.exceptions import (
    CCMSBaseException,
    ConflictError,
    ForbiddenError,
    NotFoundError,
    ValidationError,
)


class PersonNotFoundError(NotFoundError):
    detail = "Person not found"


class PersonAlreadyExistsError(ConflictError):
    detail = "A person with this national ID already exists"


class OfficerNotFoundError(NotFoundError):
    detail = "Officer not found"


class OfficerAlreadyExistsError(ConflictError):
    detail = "This person is already registered as an active officer"


class PersonHasCriminalRecordError(ConflictError):
    detail = (
        "This person has an active suspect record or unresolved charges "
        "and cannot be registered as an officer"
    )


class BadgeNumberConflictError(ConflictError):
    detail = "Badge number already assigned to another officer"


class DepartmentNotFoundError(NotFoundError):
    detail = "Department not found"


class RoleNotFoundError(NotFoundError):
    detail = "Role not found"


class DepartmentScopeViolationError(ForbiddenError):
    detail = "Department heads may only create officers for their own department"


class DepartmentChangeNotPermittedError(ForbiddenError):
    detail = "Only admins and superadmins may change an officer's department"


class EscalationNotPermittedError(ForbiddenError):
    detail = "Only superadmins can assign privileged roles"


class DepartmentManagementScopeError(ForbiddenError):
    detail = "Department heads may only manage officers within their own department"


class SelfDeactivationError(ForbiddenError):
    detail = "Cannot deactivate your own account"


class OfficerHasOpenCasesError(ConflictError):
    detail = "Officer has open case assignments. Reassign before deactivating."

    def __init__(self, case_ids: list[int]) -> None:
        super().__init__(detail=self.__class__.detail)
        self.case_ids = case_ids

    def to_dict(self) -> dict:
        return {"detail": self.detail, "case_ids": self.case_ids}


class ImmutableFieldError(ValidationError):
    detail = "national_id cannot be modified after creation"


class SuspectAlreadyExistsError(ConflictError):
    detail = "This person is already an active suspect"


class SuspectNotFoundError(NotFoundError):
    detail = "Suspect record not found"


class SuspectHasActiveChargesError(ConflictError):
    detail = "Cannot deactivate a suspect with active charges"


class VictimAlreadyExistsError(ConflictError):
    detail = "This person is already an active victim record"


class VictimNotFoundError(NotFoundError):
    detail = "Victim record not found"


class WitnessAlreadyExistsError(ConflictError):
    detail = "This person is already an active witness record"


class WitnessNotFoundError(NotFoundError):
    detail = "Witness record not found"


class InsufficientRoleError(ForbiddenError):
    detail = "You do not have sufficient privileges to perform this action"
