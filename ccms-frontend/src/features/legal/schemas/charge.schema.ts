import { z } from 'zod'

import { ChargeStatus } from '../types/legal.types'

// ─── Add charge ───────────────────────────────────────────────────────────────
export const createChargeSchema = z.object({
  suspectId: z.string().min(1, { message: 'Suspect is required.' }),
  crimeTypeId: z.string().min(1, { message: 'Crime type is required.' }),
  notes: z.string().max(2000).optional(),
})

export type CreateChargeValues = z.infer<typeof createChargeSchema>

// ─── Update charge status (excludes CONVICTED — that goes via sentence form) ──
export const updateChargeStatusSchema = z.object({
  status: z.enum([ChargeStatus.ACTIVE, ChargeStatus.ACQUITTED] as const, {
    message: 'Please select a valid status.',
  }),
})

export type UpdateChargeStatusValues = z.infer<typeof updateChargeStatusSchema>
