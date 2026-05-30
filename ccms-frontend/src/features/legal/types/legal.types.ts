// ─── Court Case Status enum ──────────────────────────────────────────────────
export const CourtCaseStatus = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  CONCLUDED: 'CONCLUDED',
  DISMISSED: 'DISMISSED',
} as const
export type CourtCaseStatus = (typeof CourtCaseStatus)[keyof typeof CourtCaseStatus]

// ─── Court Case Outcome enum ──────────────────────────────────────────────────
export const CourtCaseOutcome = {
  GUILTY: 'GUILTY',
  NOT_GUILTY: 'NOT_GUILTY',
  DISMISSED: 'DISMISSED',
  MISTRIAL: 'MISTRIAL',
  PLEA_DEAL: 'PLEA_DEAL',
} as const
export type CourtCaseOutcome =
  (typeof CourtCaseOutcome)[keyof typeof CourtCaseOutcome]

// ─── Hearing Type enum ───────────────────────────────────────────────────────
export const HearingType = {
  PRELIMINARY: 'PRELIMINARY',
  TRIAL: 'TRIAL',
  SENTENCING: 'SENTENCING',
  APPEAL: 'APPEAL',
  ARRAIGNMENT: 'ARRAIGNMENT',
} as const
export type HearingType = (typeof HearingType)[keyof typeof HearingType]

// ─── Charge Status enum ───────────────────────────────────────────────────────
export const ChargeStatus = {
  FILED: 'FILED',
  ACTIVE: 'ACTIVE',
  CONVICTED: 'CONVICTED',
  ACQUITTED: 'ACQUITTED',
  DROPPED: 'DROPPED',
} as const
export type ChargeStatus = (typeof ChargeStatus)[keyof typeof ChargeStatus]

// Terminal charge statuses — cannot be changed once reached
export const TERMINAL_CHARGE_STATUSES: ChargeStatus[] = [
  ChargeStatus.CONVICTED,
  ChargeStatus.ACQUITTED,
  ChargeStatus.DROPPED,
]

// ─── Sentence Type enum ───────────────────────────────────────────────────────
export const SentenceType = {
  IMPRISONMENT: 'IMPRISONMENT',
  FINE: 'FINE',
  COMMUNITY_SERVICE: 'COMMUNITY_SERVICE',
  SUSPENDED: 'SUSPENDED',
  DEATH_PENALTY: 'DEATH_PENALTY',
  LIFE_IMPRISONMENT: 'LIFE_IMPRISONMENT',
} as const
export type SentenceType = (typeof SentenceType)[keyof typeof SentenceType]

// Sentence types that require a duration field
export const SENTENCE_TYPES_WITH_DURATION: SentenceType[] = [
  SentenceType.IMPRISONMENT,
  SentenceType.COMMUNITY_SERVICE,
  SentenceType.SUSPENDED,
]

// Sentence types that require a fine amount field
export const SENTENCE_TYPES_WITH_FINE: SentenceType[] = [SentenceType.FINE]

// ─── Shared reference shapes ──────────────────────────────────────────────────
export interface PersonRef {
  id: string
  firstName: string
  lastName: string
}

export interface OfficerRef {
  id: string
  badgeNumber: string
  firstName: string
  lastName: string
  departmentName: string
}

export interface CrimeTypeRef {
  id: string
  name: string
}

// ─── Hearing Date ─────────────────────────────────────────────────────────────
export interface HearingDate {
  id: string
  date: string // ISO 8601
  type: HearingType
  location: string
  notes: string | null
  outcome: string | null // Free-text outcome note for concluded hearings
}

// ─── Sentence ─────────────────────────────────────────────────────────────────
export interface Sentence {
  id: string
  sentenceType: SentenceType
  durationMonths: number | null // In months; null for non-duration sentence types
  fineAmountETB: number | null // In ETB; null for non-fine types
  notes: string | null
  issuedAt: string // ISO 8601
  issuedByJudge: string | null
}

// ─── Charge List Item (for DataTable) ────────────────────────────────────────
export interface ChargeListItem {
  id: string
  courtCaseId: string
  caseId: string
  suspect: PersonRef
  crimeType: CrimeTypeRef
  status: ChargeStatus
  filedAt: string // ISO 8601
  updatedAt: string
  hasSentence: boolean // True when status is CONVICTED and a sentence is recorded
}

// ─── Charge Detail (for detail drawer and sentence panel) ────────────────────
export interface Charge extends ChargeListItem {
  sentence: Sentence | null
  notes: string | null
}

// ─── Court Case Summary (for list page) ──────────────────────────────────────
export interface CourtCaseSummary {
  id: string
  courtCaseNumber: string // Court-assigned reference (e.g. "CC-2026-0047")
  investigationCaseId: string
  investigationCaseTitle: string
  court: string
  status: CourtCaseStatus
  outcome: CourtCaseOutcome | null
  filedAt: string
  nextHearingDate: string | null // ISO 8601
  chargeCount: number
  updatedAt: string
}

// ─── Court Case Detail (for case detail legal tab) ────────────────────────────
export interface CourtCase extends CourtCaseSummary {
  hearingDates: HearingDate[]
  presidingJudge: string | null
  prosecutor: string | null
  defenceCounsel: string | null
  notes: string | null
  charges: ChargeListItem[]
}

// ─── Filters ─────────────────────────────────────────────────────────────────
export interface CourtCaseFilters {
  search?: string | undefined
  status?: CourtCaseStatus[] | undefined
  dateFrom?: string | undefined
  dateTo?: string | undefined
  page?: number | undefined
  pageSize?: number | undefined
  sortField?: 'filedAt' | 'courtCaseNumber' | 'status' | undefined
  sortDirection?: 'asc' | 'desc' | undefined
}

export interface ChargeFilters {
  search?: string | undefined
  status?: ChargeStatus[] | undefined
  page?: number | undefined
  pageSize?: number | undefined
  sortField?: 'filedAt' | 'status' | undefined
  sortDirection?: 'asc' | 'desc' | undefined
}

export interface HearingDateInput {
  date: string
  type: HearingType
  location: string
  notes?: string | null | undefined
}

// ─── Payloads ─────────────────────────────────────────────────────────────────
export interface CreateCourtCasePayload {
  court: string
  filedAt: string
  presidingJudge?: string | undefined
  prosecutor?: string | undefined
  defenceCounsel?: string | undefined
  hearingDates?: HearingDateInput[] | undefined
  notes?: string | undefined
}

export interface UpdateCourtCasePayload {
  court?: string | undefined
  status?: CourtCaseStatus | undefined
  outcome?: CourtCaseOutcome | null | undefined
  presidingJudge?: string | null | undefined
  prosecutor?: string | null | undefined
  defenceCounsel?: string | null | undefined
  hearingDates?: HearingDateInput[] | undefined
  notes?: string | null | undefined
}

export interface CreateChargePayload {
  suspectId: string
  crimeTypeId: string
  notes?: string | undefined
}

export interface UpdateChargePayload {
  status: Exclude<ChargeStatus, 'CONVICTED'> // CONVICTED goes via RecordSentencePayload
}

export interface RecordSentencePayload {
  sentenceType: SentenceType
  durationMonths?: number | null | undefined
  fineAmountETB?: number | null | undefined
  notes?: string | null | undefined
  issuedAt: string
  issuedByJudge?: string | null | undefined
}


