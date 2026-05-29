import { z } from 'zod'
import { BailStatus } from '../types/arrest.types'

export const createArrestSchema = z
  .object({
    arrestedPersonId: z
      .string()
      .min(1, { message: 'Arrested person is required.' }),
    arrestingOfficerId: z
      .string()
      .min(1, { message: 'Arresting officer is required.' }),
    arrestDate: z
      .string()
      .min(1, { message: 'Arrest date and time is required.' }),
    location: z
      .string()
      .min(2, { message: 'Arrest location is required.' })
      .max(300),
    warrantNumber: z.string().max(100).optional(),
    chargesAtArrest: z
      .array(z.string().min(1))
      .min(1, { message: 'At least one charge must be listed.' })
      .max(20),
    bailStatus: z.nativeEnum(BailStatus).optional().default(BailStatus.NOT_SET),
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

export type CreateArrestValues = z.input<typeof createArrestSchema>
