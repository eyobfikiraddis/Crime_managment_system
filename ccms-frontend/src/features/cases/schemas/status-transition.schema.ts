import { z } from 'zod'
import { CaseStatus } from '../types/case.types'

export const statusTransitionSchema = z
  .object({
    toStatus: z.nativeEnum(CaseStatus),
    reason: z.string().max(500).optional(),
  })
  .refine(
    (data) => {
      // Archival requires a reason
      if (data.toStatus === CaseStatus.ARCHIVED) {
        return (data.reason?.trim().length ?? 0) > 0
      }
      return true
    },
    {
      message: 'A reason is required when archiving a case.',
      path: ['reason'],
    },
  )

export type StatusTransitionValues = z.infer<typeof statusTransitionSchema>
