import { z } from 'zod'
import { apiClient } from '@services/api/client'
import {
  paginatedCasesSchema,
  caseDetailSchema,
  paginatedTimelineSchema,
} from '@features/cases/schemas/case-api.schema'
import type {
  Case,
  CaseListItem,
  CaseFilters,
  TimelineEntry,
  TimelineFilters,
  CaseMember,
  CaseSummary,
  CreateCasePayload,
  StatusTransitionPayload,
  CaseStatus,
} from '@features/cases/types/case.types'
import type { PersonRef } from '@features/arrests/types/arrest.types'
import type { PaginatedResponse } from '@shared/types/api.types'
import { bulkOperationResultSchema } from '@shared/schemas/bulk.schema'
import type { BulkOperationResult } from '@shared/types/bulk.types'

// ─── List ──────────────────────────────────────────────────────────────────
export async function getCases(
  filters: CaseFilters,
): Promise<PaginatedResponse<CaseListItem>> {
  const params = new URLSearchParams()
  if (filters.search) params.set('search', filters.search)
  if (filters.status?.length) params.set('status', filters.status.join(','))
  if (filters.crimeTypeId) params.set('crimeTypeId', filters.crimeTypeId)
  if (filters.departmentId) params.set('departmentId', filters.departmentId)
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom)
  if (filters.dateTo) params.set('dateTo', filters.dateTo)
  params.set('page', String(filters.page ?? 1))
  params.set('pageSize', String(filters.pageSize ?? 25))
  if (filters.sortField) params.set('sortField', filters.sortField)
  if (filters.sortDirection) params.set('sortDirection', filters.sortDirection)

  const raw = await apiClient.get(`/api/v1/cases?${params.toString()}`)
  return paginatedCasesSchema.parse(raw)
}

// ─── Detail ────────────────────────────────────────────────────────────────
export async function getCase(caseId: string): Promise<Case> {
  const raw = await apiClient.get(`/api/v1/cases/${caseId}`)
  return caseDetailSchema.parse(raw)
}

// ─── Create ────────────────────────────────────────────────────────────────
export async function createCase(payload: CreateCasePayload): Promise<Case> {
  const raw = await apiClient.post('/api/v1/cases', payload)
  return caseDetailSchema.parse(raw)
}

// ─── Update ────────────────────────────────────────────────────────────────
export async function updateCase(
  caseId: string,
  payload: Partial<CreateCasePayload>,
): Promise<Case> {
  const raw = await apiClient.patch(`/api/v1/cases/${caseId}`, payload)
  return caseDetailSchema.parse(raw)
}

// ─── Delete ────────────────────────────────────────────────────────────────
export async function deleteCase(caseId: string): Promise<void> {
  await apiClient.delete(`/api/v1/cases/${caseId}`)
}

// ─── Status transition ─────────────────────────────────────────────────────
export async function transitionCaseStatus(
  caseId: string,
  payload: StatusTransitionPayload,
): Promise<Case> {
  const raw = await apiClient.patch(`/api/v1/cases/${caseId}/status`, payload)
  return caseDetailSchema.parse(raw)
}

// ─── Timeline ──────────────────────────────────────────────────────────────
export async function getCaseTimeline(
  caseId: string,
  filters: TimelineFilters & { page?: number; pageSize?: number },
): Promise<PaginatedResponse<TimelineEntry>> {
  const params = new URLSearchParams()
  if (filters.actorSearch) params.set('actorSearch', filters.actorSearch)
  if (filters.eventTypes?.length) params.set('eventTypes', filters.eventTypes.join(','))
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom)
  if (filters.dateTo) params.set('dateTo', filters.dateTo)
  params.set('page', String(filters.page ?? 1))
  params.set('pageSize', String(filters.pageSize ?? 50))

  const raw = await apiClient.get(
    `/api/v1/cases/${caseId}/timeline?${params.toString()}`,
  )
  return paginatedTimelineSchema.parse(raw)
}

export async function addCaseNote(
  caseId: string,
  content: string,
): Promise<TimelineEntry> {
  const raw = await apiClient.post(`/api/v1/cases/${caseId}/timeline/notes`, { content })
  return raw as unknown as TimelineEntry
}

// ─── Members / Officers ────────────────────────────────────────────────────
export async function getCaseMembers(caseId: string): Promise<CaseMember[]> {

  const raw = await apiClient.get(`/api/v1/cases/${caseId}/officers`)
  return raw as unknown as CaseMember[]

}

// ─── Persons linked to a case (for SearchableSelect in arrest/interrogation forms) ─
export async function getCasePersons(
  caseId: string,
  params: { role?: 'SUSPECT' | 'VICTIM' | 'WITNESS'; search?: string },
): Promise<PersonRef[]> {
  const p = new URLSearchParams()
  if (params.role) p.set('role', params.role)
  if (params.search) p.set('search', params.search)
  const raw = await apiClient.get(`/api/v1/cases/${caseId}/persons?${p.toString()}`)
  const personRefSchema = z.object({
    id: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    nationalId: z.string(),
    roleOnCase: z.enum(['SUSPECT', 'VICTIM', 'WITNESS']).optional(),
  })
  return z.array(personRefSchema).parse(raw)
}

// ─── Summary ──────────────────────────────────────────────────────────────
export async function getCaseSummary(caseId: string): Promise<CaseSummary> {
  return apiClient.get(`/api/v1/cases/${caseId}/summary`)
}

// ─── Reference data needed for create-case form ───────────────────────────
export async function getCrimeTypes(): Promise<Array<{ id: string; name: string; code: string }>> {
  return apiClient.get('/api/v1/admin/crime-types')
}

export async function getLocations(): Promise<Array<{ id: string; name: string; address?: string }>> {
  return apiClient.get('/api/v1/admin/locations')
}

/**
 * PATCH /api/v1/cases/bulk/status
 * Updates the status of multiple cases in a single atomic operation.
 * Backend validates each case's current state machine eligibility.
 * Returns { updated: number, failed: number, errors: string[] }
 */
export async function bulkUpdateCaseStatus(payload: {
  caseIds: string[]
  status: CaseStatus
  reason?: string
}): Promise<BulkOperationResult> {
  const raw = await apiClient.patch('/api/v1/cases/bulk/status', payload)
  return bulkOperationResultSchema.parse(raw)
}
