import { z } from 'zod'

export const createInterrogationSchema = z.object({
  subjectId: z.string().min(1, { message: 'Subject is required.' }),
  conductingOfficerId: z
    .string()
    .min(1, { message: 'Conducting officer is required.' }),
  interrogationDate: z
    .string()
    .min(1, { message: 'Date and time is required.' }),
  location: z
    .string()
    .min(2, { message: 'Location is required.' })
    .max(300),
  durationMinutes: z.number().int().positive().max(1440).nullable().optional(),
  legalRepresentativePresent: z.boolean().default(false),
  legalRepresentativeName: z.string().max(200).optional(),
  summary: z
    .string()
    .min(10, { message: 'Summary must be at least 10 characters.' })
    .max(5000),
  recordingReference: z.string().max(200).optional(),
}).refine(
  (data) => {
    if (!data.legalRepresentativePresent) return true
    return Boolean(data.legalRepresentativeName?.trim())
  },
  {
    message: 'Legal representative name is required when present.',
    path: ['legalRepresentativeName'],
  },
)

export type CreateInterrogationValues = z.input<typeof createInterrogationSchema>
