import { z } from 'zod'

export const createLocationSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Location name is required.' })
    .max(200),
  region: z.string().max(100).optional(),
  country: z
    .string()
    .min(1, { message: 'Country is required.' })
    .max(100),
})

export type CreateLocationValues = z.infer<typeof createLocationSchema>
