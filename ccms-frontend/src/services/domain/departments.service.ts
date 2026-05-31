import { apiClient } from '@services/api/client'
import {
  paginatedDepartmentsSchema,
  departmentDetailSchema,
  departmentOfficersResponseSchema,
} from '@features/departments/schemas/department-api.schema'
import type {
  Department,
  DepartmentListItem,
  DepartmentFilters,
  DepartmentOfficerSummary,
  CreateDepartmentPayload,
  UpdateDepartmentPayload,
  AssignHeadOfficerPayload,
} from '@features/departments/types/department.types'
import type { PaginatedResponse } from '@shared/types/api.types'

// ─── Endpoints ────────────────────────────────────────────────────────────────

/** GET /api/v1/departments — list with filters */
export async function getDepartments(
  filters: DepartmentFilters,
): Promise<PaginatedResponse<DepartmentListItem>> {
  const params = buildDepartmentParams(filters)
  const raw = await apiClient.get(`/api/v1/departments?${params}`)
  return paginatedDepartmentsSchema.parse(raw)
}

/** GET /api/v1/departments/:id — single department detail */
export async function getDepartment(departmentId: string): Promise<Department> {
  const raw = await apiClient.get(`/api/v1/departments/${departmentId}`)
  return departmentDetailSchema.parse(raw)
}

/** POST /api/v1/departments — create new department (admin+) */
export async function createDepartment(
  payload: CreateDepartmentPayload,
): Promise<Department> {
  const raw = await apiClient.post('/api/v1/departments', payload)
  return departmentDetailSchema.parse(raw)
}

/** PATCH /api/v1/departments/:id — update department metadata (admin+) */
export async function updateDepartment(
  departmentId: string,
  payload: UpdateDepartmentPayload,
): Promise<Department> {
  const raw = await apiClient.patch(`/api/v1/departments/${departmentId}`, payload)
  return departmentDetailSchema.parse(raw)
}

/** DELETE /api/v1/departments/:id — delete department (admin+) */
export async function deleteDepartment(departmentId: string): Promise<void> {
  await apiClient.delete(`/api/v1/departments/${departmentId}`)
}

/**
 * POST /api/v1/departments/:id/head
 * Assigns an officer as the department head (admin+).
 * The backend may update the officer's role to DEPT_HEAD.
 */
export async function assignHeadOfficer(
  departmentId: string,
  payload: AssignHeadOfficerPayload,
): Promise<Department> {
  const raw = await apiClient.post(`/api/v1/departments/${departmentId}/head`, payload)
  return departmentDetailSchema.parse(raw)
}

/**
 * DELETE /api/v1/departments/:id/head
 * Removes the department head designation (admin+).
 */
export async function removeHeadOfficer(departmentId: string): Promise<Department> {
  const raw = await apiClient.delete(`/api/v1/departments/${departmentId}/head`)
  return departmentDetailSchema.parse(raw)
}

/**
 * GET /api/v1/departments/:id/officers
 * Compact officer list for the department detail page.
 * Returns up to 50 officers sorted by lastName asc.
 */
export async function getDepartmentOfficers(
  departmentId: string,
  params: { page?: number; pageSize?: number } = {},
): Promise<{ data: DepartmentOfficerSummary[]; total: number }> {
  const p = new URLSearchParams()
  p.set('page', String(params.page ?? 1))
  p.set('pageSize', String(params.pageSize ?? 50))
  p.set('sortField', 'lastName')
  p.set('sortDirection', 'asc')
  const raw = await apiClient.get(
    `/api/v1/departments/${departmentId}/officers?${p.toString()}`,
  )
  return departmentOfficersResponseSchema.parse(raw)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildDepartmentParams(filters: DepartmentFilters): string {
  const p = new URLSearchParams()
  if (filters.search) p.set('search', filters.search)
  if (filters.locationId) p.set('locationId', filters.locationId)
  if (filters.hasHeadOfficer !== undefined)
    p.set('hasHeadOfficer', String(filters.hasHeadOfficer))
  p.set('page', String(filters.page ?? 1))
  p.set('pageSize', String(filters.pageSize ?? 25))
  if (filters.sortField) p.set('sortField', filters.sortField)
  if (filters.sortDirection) p.set('sortDirection', filters.sortDirection)
  return p.toString()
}
