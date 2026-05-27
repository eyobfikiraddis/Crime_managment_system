import { z } from 'zod'
import { CustodyEventType } from '../types/evidence.types'

export const recordCustodyEventSchema = z.object({
  eventType: z.nativeEnum(CustodyEventType, {
    message: 'Event type is required.',
  }),
  toOfficerId: z.string().min(1, { message: 'Receiving officer is required.' }),
  location: z.string().min(2, { message: 'Location is required.' }).max(200),
  reason: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
})

export type RecordCustodyEventValues = z.infer<typeof recordCustodyEventSchema>
