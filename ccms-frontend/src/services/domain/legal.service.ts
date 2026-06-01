import { apiClient } from '@services/api/client'
import { ApiError } from '@services/api/errors'
import {
  paginatedCourtCasesSchema,
  courtCaseDetailSchema,
  paginatedChargesSchema,
  chargeDetailSchema,
} from '@features/legal/schemas/legal-api.schema'
import type {
  CourtCase,
  CourtCaseSummary,
  CourtCaseFilters,
  ChargeListItem,
  Charge,
  ChargeFilters,
  CreateCourtCasePayload,
  UpdateCourtCasePayload,
  CreateChargePayload,
  UpdateChargePayload,
  RecordSentencePayload,
  EditSentencePayload,
  AppealChargePayload,
} from '@features/legal/types/legal.types'
import type { PaginatedResponse } from '@shared/types/api.types'
import { bulkOperationResultSchema } from '@shared/schemas/bulk.schema'
import type { BulkOperationResult } from '@shared/types/bulk.types'

// ─── Court Cases ──────────────────────────────────────────────────────────────

/**
 * GET /api/v1/court-cases
 * List all court cases (scoped to officer's access level by backend).
 */
export async function getCourtCases(
  filters: CourtCaseFilters,
): Promise<PaginatedResponse<CourtCaseSummary>> {
  const params = buildCourtCaseParams(filters)
  const raw = await apiClient.get(`/api/v1/court-cases?${params}`)
  return paginatedCourtCasesSchema.parse(raw)
}

/**
 * GET /api/v1/cases/{caseId}/court-case
 * Fetch the single court case linked to an investigation case.
 * Returns null when no court case exists.
 */
export async function getCourtCaseByCase(
  caseId: string,
): Promise<CourtCase | null> {
  try {
    const raw = await apiClient.get(`/api/v1/cases/${caseId}/court-case`)
    return courtCaseDetailSchema.parse(raw)
  } catch (err: unknown) {
    if (isNotFoundError(err)) return null
    throw err
  }
}

/**
 * POST /api/v1/cases/{caseId}/court-case
 * Create and link a court case to an investigation case.
 */
export async function createCourtCase(
  caseId: string,
  payload: CreateCourtCasePayload,
): Promise<CourtCase> {
  const raw = await apiClient.post(`/api/v1/cases/${caseId}/court-case`, payload)
  return courtCaseDetailSchema.parse(raw)
}

/**
 * PATCH /api/v1/court-cases/{courtCaseId}
 * Update a court case's metadata, status, hearing dates, or outcome.
 */
export async function updateCourtCase(
  courtCaseId: string,
  payload: UpdateCourtCasePayload,
): Promise<CourtCase> {
  const raw = await apiClient.patch(`/api/v1/court-cases/${courtCaseId}`, payload)
  return courtCaseDetailSchema.parse(raw)
}

// ─── Charges ──────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/court-cases/{courtCaseId}/charges
 * Paginated list of charges for a given court case.
 */
export async function getCharges(
  courtCaseId: string,
  filters: ChargeFilters,
): Promise<PaginatedResponse<ChargeListItem>> {
  const params = buildChargeParams(filters)
  const raw = await apiClient.get(
    `/api/v1/court-cases/${courtCaseId}/charges?${params}`,
  )
  return paginatedChargesSchema.parse(raw)
}

/**
 * GET /api/v1/charges/{chargeId}
 * Fetch a charge with sentence details.
 */
export async function getCharge(chargeId: string): Promise<Charge> {
  const raw = await apiClient.get(`/api/v1/charges/${chargeId}`)
  return chargeDetailSchema.parse(raw)
}

/**
 * POST /api/v1/court-cases/{courtCaseId}/charges
 * File a new charge against a suspect within a court case.
 */
export async function createCharge(
  courtCaseId: string,
  payload: CreateChargePayload,
): Promise<Charge> {
  const raw = await apiClient.post(
    `/api/v1/court-cases/${courtCaseId}/charges`,
    payload,
  )
  return chargeDetailSchema.parse(raw)
}

/**
 * PATCH /api/v1/charges/{chargeId}
 * Update a charge's status. For conviction, use recordSentence instead.
 */
export async function updateCharge(
  chargeId: string,
  payload: UpdateChargePayload,
): Promise<Charge> {
  const raw = await apiClient.patch(`/api/v1/charges/${chargeId}`, payload)
  return chargeDetailSchema.parse(raw)
}

/**
 * POST /api/v1/charges/{chargeId}/sentence
 * Record conviction and sentence for a charge. Sets status to CONVICTED.
 */
export async function recordSentence(
  chargeId: string,
  payload: RecordSentencePayload,
): Promise<Charge> {
  const raw = await apiClient.post(`/api/v1/charges/${chargeId}/sentence`, payload)
  return chargeDetailSchema.parse(raw)
}

/**
 * POST /api/v1/charges/bulk/drop
 * Sets multiple charges to DROPPED status. Skips terminal charges.
 * Returns BulkOperationResult.
 */
export async function bulkDropCharges(payload: {
  chargeIds: string[]
}): Promise<BulkOperationResult> {
  const raw = await apiClient.post('/api/v1/charges/bulk/drop', payload)
  return bulkOperationResultSchema.parse(raw)
}

/**
 * PATCH /api/v1/charges/{chargeId}/sentence
 * Amends an existing sentence. Admin+ only.
 * The backend creates an audit entry preserving the original values.
 * Returns the updated Charge (with amended sentence).
 */
export async function editSentence(
  chargeId: string,
  payload: EditSentencePayload,
): Promise<Charge> {
  const raw = await apiClient.patch(
    `/api/v1/charges/${chargeId}/sentence`,
    payload,
  )
  return chargeDetailSchema.parse(raw)
}

/**
 * POST /api/v1/charges/{chargeId}/appeal
 * Files an appeal for a CONVICTED or ACQUITTED charge. Superadmin only.
 * Reverts the charge status to ACTIVE. Creates an AppealRecord.
 * Returns the updated Charge.
 */
export async function appealCharge(
  chargeId: string,
  payload: AppealChargePayload,
): Promise<Charge> {
  const raw = await apiClient.post(
    `/api/v1/charges/${chargeId}/appeal`,
    payload,
  )
  return chargeDetailSchema.parse(raw)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildCourtCaseParams(filters: CourtCaseFilters): string {
  const p = new URLSearchParams()
  if (filters.search) p.set('search', filters.search)
  if (filters.status?.length) p.set('status', filters.status.join(','))
  if (filters.dateFrom) p.set('dateFrom', filters.dateFrom)
  if (filters.dateTo) p.set('dateTo', filters.dateTo)
  p.set('page', String(filters.page ?? 1))
  p.set('pageSize', String(filters.pageSize ?? 25))
  if (filters.sortField) p.set('sortField', filters.sortField)
  if (filters.sortDirection) p.set('sortDirection', filters.sortDirection)
  return p.toString()
}

function buildChargeParams(filters: ChargeFilters): string {
  const p = new URLSearchParams()
  if (filters.search) p.set('search', filters.search)
  if (filters.status?.length) p.set('status', filters.status.join(','))
  p.set('page', String(filters.page ?? 1))
  p.set('pageSize', String(filters.pageSize ?? 25))
  if (filters.sortField) p.set('sortField', filters.sortField)
  if (filters.sortDirection) p.set('sortDirection', filters.sortDirection)
  return p.toString()
}

function isNotFoundError(err: unknown): boolean {
  if (err instanceof ApiError) {
    return err.statusCode === 404
  }
  if (typeof err === 'object' && err !== null && 'statusCode' in err) {
    return (err as { statusCode: number }).statusCode === 404
  }
  if (typeof err === 'object' && err !== null && 'status' in err) {
    return (err as { status: number }).status === 404
  }
  return false
}
