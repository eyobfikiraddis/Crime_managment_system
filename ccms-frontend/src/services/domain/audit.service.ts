import { apiClient } from '@services/api/client'
import { axiosInstance } from '@services/api/client'
import {
  paginatedAuditEntriesSchema,
  addCaseNoteResponseSchema,
} from '@features/audit/schemas/audit-api.schema'
import { buildAuditCsvFilename } from '@features/audit/utils/auditUtils'
import type {
  AuditEntry,
  AuditFilters,
  AddCaseNotePayload,
} from '@features/audit/types/audit.types'
import type { PaginatedResponse } from '@shared/types/api.types'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function buildAuditParams(filters: AuditFilters): string {
  const p = new URLSearchParams()
  if (filters.actorSearch) p.set('actorSearch', filters.actorSearch)
  if (filters.eventTypes?.length)
    p.set('eventTypes', filters.eventTypes.join(','))
  if (filters.dateFrom) p.set('dateFrom', filters.dateFrom)
  if (filters.dateTo) p.set('dateTo', filters.dateTo)
  if (filters.linkedCaseId) p.set('linkedCaseId', filters.linkedCaseId)
  if (filters.linkedOfficerId) p.set('linkedOfficerId', filters.linkedOfficerId)
  p.set('page', String(filters.page ?? 1))
  p.set('pageSize', String(filters.pageSize ?? 25))
  return p.toString()
}

// ─── Case timeline ────────────────────────────────────────────────────────────

/**
 * GET /api/v1/cases/{caseId}/timeline
 * Paginated audit entries for a specific investigation case.
 * Returns newest-first. Includes custody gap metadata on chain-of-custody entries.
 */
export async function getCaseTimeline(
  caseId: string,
  filters: AuditFilters,
): Promise<PaginatedResponse<AuditEntry>> {
  const raw = await apiClient.get(
    `/api/v1/cases/${caseId}/timeline?${buildAuditParams(filters)}`,
  )
  return paginatedAuditEntriesSchema.parse(raw)
}

/**
 * POST /api/v1/cases/{caseId}/timeline/note
 * Appends a case note audit entry to the case timeline.
 * Returns the created AuditEntry.
 */
export async function addCaseNote(
  caseId: string,
  payload: AddCaseNotePayload,
): Promise<AuditEntry> {
  const raw = await apiClient.post(
    `/api/v1/cases/${caseId}/timeline/note`,
    payload,
  )
  return addCaseNoteResponseSchema.parse(raw)
}

// ─── Global audit log (admin+) ────────────────────────────────────────────────

/**
 * GET /api/v1/audit
 * System-wide paginated audit log. Admin+ only.
 * Supports entity scope filters (linkedCaseId, linkedOfficerId).
 */
export async function getGlobalAuditLog(
  filters: AuditFilters,
): Promise<PaginatedResponse<AuditEntry>> {
  const raw = await apiClient.get(
    `/api/v1/audit?${buildAuditParams(filters)}`,
  )
  return paginatedAuditEntriesSchema.parse(raw)
}

// ─── Officer audit history (admin+) ──────────────────────────────────────────

/**
 * GET /api/v1/personnel/officers/{officerId}/audit
 * All audit entries where the officer was the actor. Admin+ only.
 */
export async function getOfficerAuditHistory(
  officerId: string,
  filters: AuditFilters,
): Promise<PaginatedResponse<AuditEntry>> {
  const raw = await apiClient.get(
    `/api/v1/personnel/officers/${officerId}/audit?${buildAuditParams(filters)}`,
  )
  return paginatedAuditEntriesSchema.parse(raw)
}

// ─── Person audit history (admin+) ───────────────────────────────────────────

/**
 * GET /api/v1/personnel/persons/{personId}/audit
 * All audit entries related to a person record. Admin+ only.
 */
export async function getPersonAuditHistory(
  personId: string,
  filters: AuditFilters,
): Promise<PaginatedResponse<AuditEntry>> {
  const raw = await apiClient.get(
    `/api/v1/personnel/persons/${personId}/audit?${buildAuditParams(filters)}`,
  )
  return paginatedAuditEntriesSchema.parse(raw)
}

// ─── CSV Export ───────────────────────────────────────────────────────────────

/**
 * Downloads an audit timeline as CSV.
 * The endpoint path varies by surface; append ?format=csv to request the blob.
 */
export async function downloadAuditCsv(
  endpointPath: string,
  filters: AuditFilters,
  filename: string,
): Promise<void> {
  const params = buildAuditParams(filters)
  const response = await axiosInstance.get(
    `/api/v1/${endpointPath}?${params}&format=csv`,
    { responseType: 'blob' },
  )
  const blob = response.data as Blob
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

// ─── Phase 4 Legacy Compatibility ────────────────────────────────────────────

/**
 * Fire-and-forget: log that a PII field was revealed by the current user.
 * Must not surface errors to the UI.
 */
export async function logPIIRevealEvent(
  targetId: string,
  field: string,
  targetType: 'person' | 'officer' = 'person',
): Promise<void> {
  try {
    await apiClient.post('/api/v1/audit/pii-reveal', {
      target_type: targetType,
      target_id: targetId,
      field,
    })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('logPIIRevealEvent failed', err)
  }
}

/**
 * Get recent audit events for an entity (compact list for detail pages).
 * Retained for legacy components.
 */
export interface LegacyAuditEntry {
  id: string
  eventType: string
  actorName: string
  description: string
  createdAt: string
}

export async function getRecentActivityForEntity(
  targetType: 'person' | 'officer',
  targetId: string,
  limit = 5,
): Promise<{ data: LegacyAuditEntry[]; total: number }> {
  const params = new URLSearchParams()
  params.set('target_type', targetType)
  params.set('target_id', targetId)
  params.set('limit', String(limit))

  const raw = await apiClient.get(`/api/v1/audit/recent?${params.toString()}`)
  return (raw as unknown) as { data: LegacyAuditEntry[]; total: number }
}
