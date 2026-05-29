import { apiClient } from '@services/api/client'
import {
  paginatedArrestsSchema,
  arrestDetailSchema,
} from '@features/arrests/schemas/arrest-api.schema'
import type {
  ArrestListItem,
  Arrest,
  ArrestFilters,
  CreateArrestPayload,
  UpdateArrestPayload,
} from '@features/arrests/types/arrest.types'
import type { PaginatedResponse } from '@shared/types/api.types'

// ─── List arrests for a case ──────────────────────────────────────────────
export async function getCaseArrests(
  caseId: string,
  filters: ArrestFilters,
): Promise<PaginatedResponse<ArrestListItem>> {
  const params = buildArrestParams(filters)
  const raw = await apiClient.get(`/api/v1/cases/${caseId}/arrests?${params}`)
  return paginatedArrestsSchema.parse(raw)
}

// ─── Detail ───────────────────────────────────────────────────────────────
export async function getArrest(arrestId: string): Promise<Arrest> {
  const raw = await apiClient.get(`/api/v1/arrests/${arrestId}`)
  return arrestDetailSchema.parse(raw)
}

// ─── Create ───────────────────────────────────────────────────────────────
export async function createArrest(
  caseId: string,
  payload: CreateArrestPayload,
): Promise<Arrest> {
  const raw = await apiClient.post(`/api/v1/cases/${caseId}/arrests`, payload)
  return arrestDetailSchema.parse(raw)
}

// ─── Update ───────────────────────────────────────────────────────────────
export async function updateArrest(
  arrestId: string,
  payload: UpdateArrestPayload,
): Promise<Arrest> {
  const raw = await apiClient.patch(`/api/v1/arrests/${arrestId}`, payload)
  return arrestDetailSchema.parse(raw)
}

// ─── Delete ───────────────────────────────────────────────────────────────
export async function deleteArrest(arrestId: string): Promise<void> {
  await apiClient.delete(`/api/v1/arrests/${arrestId}`)
}

// ─── Helpers ──────────────────────────────────────────────────────────────
function buildArrestParams(filters: ArrestFilters): string {
  const p = new URLSearchParams()
  if (filters.search) p.set('search', filters.search)
  if (filters.detentionStatus?.length)
    p.set('detentionStatus', filters.detentionStatus.join(','))
  if (filters.dateFrom) p.set('dateFrom', filters.dateFrom)
  if (filters.dateTo) p.set('dateTo', filters.dateTo)
  p.set('page', String(filters.page ?? 1))
  p.set('pageSize', String(filters.pageSize ?? 25))
  if (filters.sortField) p.set('sortField', filters.sortField)
  if (filters.sortDirection) p.set('sortDirection', filters.sortDirection)
  return p.toString()
}
