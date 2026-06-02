import { z } from 'zod'

import {
  CourtCaseStatus,
  CourtCaseOutcome,
  HearingType,
  ChargeStatus,
  SentenceType,
  AppealOutcome,
} from '../types/legal.types'

// ─── Shared refs ──────────────────────────────────────────────────────────────
const personRefSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
})

const crimeTypeRefSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
})

// ─── Sentence ─────────────────────────────────────────────────────────────────
export const sentenceSchema = z.object({
  id: z.string().uuid(),
  sentenceType: z.nativeEnum(SentenceType),
  durationMonths: z.number().nullable(),
  fineAmountETB: z.number().nullable(),
  notes: z.string().nullable(),
  issuedAt: z.string(),
  issuedByJudge: z.string().nullable(),
})

// ─── Hearing Date ─────────────────────────────────────────────────────────────
export const hearingDateSchema = z.object({
  id: z.string().uuid(),
  date: z.string(),
  type: z.nativeEnum(HearingType),
  location: z.string(),
  notes: z.string().nullable(),
  outcome: z.string().nullable(),
})

// ─── Charge List Item ─────────────────────────────────────────────────────────
export const chargeListItemSchema = z.object({
  id: z.string().uuid(),
  courtCaseId: z.string().uuid(),
  caseId: z.string().uuid(),
  suspect: personRefSchema,
  crimeType: crimeTypeRefSchema,
  status: z.nativeEnum(ChargeStatus),
  filedAt: z.string(),
  updatedAt: z.string(),
  hasSentence: z.boolean(),
})

// ─── Charge Detail ────────────────────────────────────────────────────────────
export const chargeDetailSchema = chargeListItemSchema.extend({
  sentence: sentenceSchema.nullable(),
  notes: z.string().nullable(),
})

// ─── Paginated charges ────────────────────────────────────────────────────────
export const paginatedChargesSchema = z.object({
  data: z.array(chargeListItemSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  totalPages: z.number(),
})

// ─── Court Case Summary ───────────────────────────────────────────────────────
export const courtCaseSummarySchema = z.object({
  id: z.string().uuid(),
  courtCaseNumber: z.string(),
  investigationCaseId: z.string().uuid(),
  investigationCaseTitle: z.string(),
  court: z.string(),
  status: z.nativeEnum(CourtCaseStatus),
  outcome: z.nativeEnum(CourtCaseOutcome).nullable(),
  filedAt: z.string(),
  nextHearingDate: z.string().nullable(),
  chargeCount: z.number(),
  updatedAt: z.string(),
})

// ─── Court Case Detail ────────────────────────────────────────────────────────
export const courtCaseDetailSchema = courtCaseSummarySchema.extend({
  hearingDates: z.array(hearingDateSchema),
  presidingJudge: z.string().nullable(),
  prosecutor: z.string().nullable(),
  defenceCounsel: z.string().nullable(),
  notes: z.string().nullable(),
  charges: z.array(chargeListItemSchema),
})

// ─── Paginated court cases ────────────────────────────────────────────────────
export const paginatedCourtCasesSchema = z.object({
  data: z.array(courtCaseSummarySchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  totalPages: z.number(),
})

// ─── Appeal Record ────────────────────────────────────────────────────────────
export const appealRecordSchema = z.object({
  id: z.string().uuid(),
  chargeId: z.string().uuid(),
  filedAt: z.string(),
  filedByOfficerId: z.string().uuid(),
  outcome: z.nativeEnum(AppealOutcome),
  outcomeDate: z.string().nullable(),
  notes: z.string().nullable(),
})
