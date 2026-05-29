import { z } from 'zod'
import { DetentionStatus, BailStatus } from '../types/arrest.types'

export const updateArrestSchema = z
  .object({
    detentionStatus: z.nativeEnum(DetentionStatus).optional(),
    bailStatus: z.nativeEnum(BailStatus).optional(),
    bailAmount: z.number().positive().nullable().optional(),
    notes: z.string().max(2000).optional(),
  })
  .refine(
    (data) => {
      if (
        (data.bailStatus === BailStatus.GRANTED || data.bailStatus === BailStatus.POSTED) &&
        (data.bailAmount === null || data.bailAmount === undefined)
      ) {
        return false
      }
      return true
    },
    {
      message: 'Bail amount is required when bail is granted or posted.',
      path: ['bailAmount'],
    },
  )

export type UpdateArrestValues = z.infer<typeof updateArrestSchema>
