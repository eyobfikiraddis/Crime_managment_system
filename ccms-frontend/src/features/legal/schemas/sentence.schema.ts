import { z } from 'zod'

import {
  SentenceType,
  SENTENCE_TYPES_WITH_DURATION,
  SENTENCE_TYPES_WITH_FINE,
} from '../types/legal.types'

export const recordSentenceSchema = z
  .object({
    sentenceType: z.nativeEnum(SentenceType, {
      message: 'Sentence type is required.',
    }),
    durationMonths: z.number().int().positive().max(999).nullable().optional(),
    fineAmountETB: z.number().positive().max(999_999_999).nullable().optional(),
    notes: z.string().max(3000).nullable().optional(),
    issuedAt: z.string().min(1, { message: 'Sentence date is required.' }),
    issuedByJudge: z.string().max(200).nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (
      SENTENCE_TYPES_WITH_DURATION.includes(data.sentenceType) &&
      (data.durationMonths === null || data.durationMonths === undefined)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Duration is required for this sentence type.',
        path: ['durationMonths'],
      })
    }

    if (
      SENTENCE_TYPES_WITH_FINE.includes(data.sentenceType) &&
      (data.fineAmountETB === null || data.fineAmountETB === undefined)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Fine amount is required for a fine sentence.',
        path: ['fineAmountETB'],
      })
    }
  })

export type RecordSentenceValues = z.infer<typeof recordSentenceSchema>
