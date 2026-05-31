import { z } from 'zod'
import { Gender, RiskLevel } from '../types/personnel.types'

export const createPersonSchema = z.object({
  firstName: z
    .string()
    .min(1, { message: 'First name is required.' })
    .max(100),
  lastName: z
    .string()
    .min(1, { message: 'Last name is required.' })
    .max(100),
  gender: z.nativeEnum(Gender).optional(),
  nationalId: z.string().max(50).optional(),
  dateOfBirth: z.string().optional(),
  phone: z.string().max(20).optional(),
  address: z.string().max(500).optional(),
})

export type CreatePersonValues = z.infer<typeof createPersonSchema>

export const promoteToSuspectSchema = z.object({
  riskLevel: z.nativeEnum(RiskLevel, {
    message: 'Risk level is required.',
  }),
  notes: z.string().max(2000).optional(),
})

export type PromoteToSuspectValues = z.infer<typeof promoteToSuspectSchema>

export const promoteToVictimSchema = z.object({
  notes: z.string().max(2000).optional(),
})

export type PromoteToVictimValues = z.infer<typeof promoteToVictimSchema>

export const promoteToWitnessSchema = z
  .object({
    credibilityNotes: z.string().max(2000).optional(),
    isProtected: z.boolean().default(false),
    protectionLevel: z.string().max(50).nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.isProtected && !data.protectionLevel) return false
      return true
    },
    {
      message: 'Protection level is required when witness protection is enabled.',
      path: ['protectionLevel'],
    },
  )

export type PromoteToWitnessValues = z.infer<typeof promoteToWitnessSchema>
