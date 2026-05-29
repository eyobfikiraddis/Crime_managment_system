import { apiClient } from '@services/api/client'
import {
  paginatedInterrogationsSchema,
  interrogationDetailSchema,
} from '@features/interrogations/schemas/interrogation-api.schema'
import type {
  InterrogationListItem,
  Interrogation,
  InterrogationFilters,
  CreateInterrogationPayload,
} from '@features/interrogations/types/interrogation.types'
import type { PaginatedResponse } from '@shared/types/api.types'

// ─── List ────────────────────────────────────────────────────────────────
export async function getCaseInterrogations(
  caseId: string,
  filters: InterrogationFilters,
): Promise<PaginatedResponse<InterrogationListItem>> {
  const params = buildInterrogationParams(filters)
  const raw = await apiClient.get(`/api/v1/cases/${caseId}/interrogations?${params}`)
  return paginatedInterrogationsSchema.parse(raw)
}

// ─── Create ───────────────────────────────────────────────────────────────
export async function createInterrogation(
  caseId: string,
  payload: CreateInterrogationPayload,
): Promise<Interrogation> {
  const raw = await apiClient.post(`/api/v1/cases/${caseId}/interrogations`, payload)
  return interrogationDetailSchema.parse(raw)
}

// ─── Helpers ──────────────────────────────────────────────────────────────
function buildInterrogationParams(filters: InterrogationFilters): string {
  const p = new URLSearchParams()
  if (filters.search) p.set('search', filters.search)
  if (filters.dateFrom) p.set('dateFrom', filters.dateFrom)
  if (filters.dateTo) p.set('dateTo', filters.dateTo)
  p.set('page', String(filters.page ?? 1))
  p.set('pageSize', String(filters.pageSize ?? 25))
  if (filters.sortField) p.set('sortField', filters.sortField)
  if (filters.sortDirection) p.set('sortDirection', filters.sortDirection)
  return p.toString()
}
