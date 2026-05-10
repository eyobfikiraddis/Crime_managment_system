from __future__ import annotations

from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.core import redis_client as redis_ops
from app.core.security import hash_password
from app.modules.auth.schemas.responses import CurrentOfficerContext
from app.core.exceptions import ValidationError
from app.modules.personnel.exceptions import (
    BadgeNumberConflictError,
    DepartmentNotFoundError,
    InsufficientRoleError,
    OfficerAlreadyExistsError,
    OfficerNotFoundError,
    PersonAlreadyExistsError,
    PersonNotFoundError,
    RoleNotFoundError,
)
from app.modules.personnel.permissions import has_manage_users_access, is_admin_or_superadmin
from app.modules.personnel.repository import DepartmentRepository, OfficerRepository, PersonRepository, RoleRepository
from app.modules.personnel.schemas.requests import CreateOfficerRequest, CreatePersonRequest, UpdateOfficerRequest, UpdatePersonRequest
from app.modules.personnel.schemas.responses import OfficerResponse, PersonResponse
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
