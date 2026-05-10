from __future__ import annotations

from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError, ValidationError
from app.modules.auth.schemas.responses import CurrentOfficerContext
from app.modules.departments.repository import DepartmentRepository
from app.modules.departments.schemas.requests import AssignDepartmentHeadRequest, CreateDepartmentRequest, UpdateDepartmentRequest
from app.modules.departments.schemas.responses import DepartmentHeadSummary, DepartmentListItemResponse, DepartmentResponse
from app.shared.enums import RoleNameEnum
from app.shared.pagination import PaginatedResponse
from app.shared.response_schemas import MessageResponse


def _is_admin_or_superadmin(officer: CurrentOfficerContext) -> bool:
    return officer.role_name in {RoleNameEnum.admin.value, RoleNameEnum.superadmin.value}


class DepartmentService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = DepartmentRepository(session)

    async def create_department(
        self, requester: CurrentOfficerContext, body: CreateDepartmentRequest
    ) -> DepartmentResponse:
        if not _is_admin_or_superadmin(requester):
            raise ForbiddenError("Insufficient privileges")

        existing = await self.repo.get_by_name_case_insensitive(body.name)
        if existing:
            raise ConflictError("A department with this name already exists")

        department = await self.repo.create(name=body.name, location_id=body.location_id)
        return self._to_response(department, officer_count=0)

    async def list_departments(
        self, page: int, size: int
    ) -> PaginatedResponse[DepartmentListItemResponse]:
        offset = (page - 1) * size
        rows, total = await self.repo.list_departments(offset=offset, limit=size)
        items = [self._to_list_response(dep, count) for dep, count in rows]
        return PaginatedResponse(items=items, total=total, page=page, size=size)

    async def get_department(self, department_id: int) -> DepartmentResponse:
        department = await self.repo.get_by_id(department_id)
        if not department:
            raise NotFoundError("Department not found")
        officer_count = await self.repo.count_active_officers(department_id)
        return self._to_response(department, officer_count)

    async def update_department(
        self,
        requester: CurrentOfficerContext,
        department_id: int,
        body: UpdateDepartmentRequest,
    ) -> DepartmentResponse:
        if not _is_admin_or_superadmin(requester):
            raise ForbiddenError("Insufficient privileges")

        department = await self.repo.get_by_id(department_id)
        if not department:
            raise NotFoundError("Department not found")

        updates: dict[str, Any] = body.model_dump(exclude_unset=True)
        if "name" in updates:
            existing = await self.repo.get_by_name_case_insensitive(
                updates["name"], exclude_id=department.department_id
            )
            if existing:
                raise ConflictError("A department with this name already exists")

        if updates:
            department = await self.repo.update(department, updates)

        officer_count = await self.repo.count_active_officers(department.department_id)
        return self._to_response(department, officer_count)

    async def delete_department(
        self, requester: CurrentOfficerContext, department_id: int
    ) -> MessageResponse:
        if not _is_admin_or_superadmin(requester):
            raise ForbiddenError("Insufficient privileges")

        department = await self.repo.get_by_id(department_id)
        if not department:
            raise NotFoundError("Department not found")

        active_officers = await self.repo.count_active_officers(department_id)
        if active_officers > 0:
            raise ConflictError("Cannot delete a department with active officers")

        await self.repo.soft_delete(department)
        return MessageResponse(message="Department deleted")

    async def assign_department_head(
        self,
        requester: CurrentOfficerContext,
        department_id: int,
        body: AssignDepartmentHeadRequest,
    ) -> DepartmentResponse:
        if not _is_admin_or_superadmin(requester):
            raise ForbiddenError("Insufficient privileges")

        department = await self.repo.get_by_id(department_id)
        if not department:
            raise NotFoundError("Department not found")

        officer = await self.repo.get_officer_in_department(body.officer_id, department_id)
        if not officer:
            raise ValidationError("Officer does not belong to this department")

        old_head_id = department.department_head_officer_id
        department = await self.repo.update(
            department,
            {"department_head_officer_id": body.officer_id},
        )
        await self.repo.write_audit_log(
            department_id=department.department_id,
            changed_by_officer_id=requester.officer_id,
            event_type="department_head_assigned",
            old_value={"department_head_officer_id": old_head_id},
            new_value={"department_head_officer_id": body.officer_id},
        )
        refreshed = await self.repo.get_by_id(department.department_id)
        if not refreshed:
            raise NotFoundError("Department not found")
        officer_count = await self.repo.count_active_officers(refreshed.department_id)
        return self._to_response(refreshed, officer_count)

    def _build_head_summary(self, department) -> DepartmentHeadSummary | None:
        head = department.department_head
        if not head or not head.person:
            return None
        return DepartmentHeadSummary(
            officer_id=head.officer_id,
            first_name=head.person.first_name,
            last_name=head.person.last_name,
            rank=head.rank,
            badge_number=head.badge_number,
        )

    def _to_response(self, department, officer_count: int) -> DepartmentResponse:
        return DepartmentResponse(
            department_id=department.department_id,
            name=department.name,
            location_id=department.location_id,
            department_head_officer_id=department.department_head_officer_id,
            officer_count=officer_count,
            created_at=department.created_at,
            updated_at=department.updated_at,
            deleted_at=department.deleted_at,
            department_head=self._build_head_summary(department),
        )

    def _to_list_response(
        self, department, officer_count: int
    ) -> DepartmentListItemResponse:
        return DepartmentListItemResponse(
            department_id=department.department_id,
            name=department.name,
            location_id=department.location_id,
            department_head_officer_id=department.department_head_officer_id,
            officer_count=officer_count,
            created_at=department.created_at,
            updated_at=department.updated_at,
            department_head=self._build_head_summary(department),
        )
