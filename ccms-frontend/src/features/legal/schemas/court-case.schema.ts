import { z } from 'zod'

import { CourtCaseStatus, CourtCaseOutcome, HearingType } from '../types/legal.types'

// ─── Hearing date sub-schema ──────────────────────────────────────────────────
export const hearingDateInputSchema = z.object({
  date: z.string().min(1, { message: 'Hearing date is required.' }),
  type: z.nativeEnum(HearingType),
  location: z.string().min(2, { message: 'Location is required.' }).max(300),
  notes: z.string().max(1000).optional(),
})

// ─── Create court case ────────────────────────────────────────────────────────
export const createCourtCaseSchema = z.object({
  court: z.string().min(2, { message: 'Court name is required.' }).max(300),
  filedAt: z.string().min(1, { message: 'Filing date is required.' }),
  presidingJudge: z.string().max(200).optional(),
  prosecutor: z.string().max(200).optional(),
  defenceCounsel: z.string().max(200).optional(),
  hearingDates: z.array(hearingDateInputSchema).max(20).optional().default([]),
  notes: z.string().max(3000).optional(),
})

export type CreateCourtCaseValues = z.infer<typeof createCourtCaseSchema>

// ─── Update court case ────────────────────────────────────────────────────────
export const updateCourtCaseSchema = z
  .object({
    court: z.string().min(2).max(300).optional(),
    status: z.nativeEnum(CourtCaseStatus).optional(),
    outcome: z.nativeEnum(CourtCaseOutcome).nullable().optional(),
    presidingJudge: z.string().max(200).nullable().optional(),
    prosecutor: z.string().max(200).nullable().optional(),
    defenceCounsel: z.string().max(200).nullable().optional(),
    hearingDates: z.array(hearingDateInputSchema).max(20).optional(),
    notes: z.string().max(3000).nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.status === CourtCaseStatus.CONCLUDED && !data.outcome) {
        return false
      }
      return true
    },
    {
      message: 'An outcome is required when the court case status is Concluded.',
      path: ['outcome'],
    },
  )

export type UpdateCourtCaseValues = z.infer<typeof updateCourtCaseSchema>
