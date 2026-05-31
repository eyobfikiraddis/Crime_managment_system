import { z } from 'zod'
import { CrimeSeverity } from '../types/admin.types'

export const createCrimeTypeSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Crime type name is required.' })
    .max(200),
  code: z
    .string()
    .min(1, { message: 'Code is required.' })
    .max(20)
    .regex(/^[A-Z0-9_]+$/, {
      message: 'Code must contain only uppercase letters, digits, and underscores.',
    }),
  category: z.string().max(100).optional(),
  severity: z.nativeEnum(CrimeSeverity).optional(),
})

export type CreateCrimeTypeValues = z.infer<typeof createCrimeTypeSchema>
