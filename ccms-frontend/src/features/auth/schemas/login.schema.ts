import { z } from 'zod'

export const loginSchema = z.object({
  badgeNumber: z
    .string()
    .min(1, 'required')
    .regex(/^BD-\d{5}$/, 'badgeNumberFormat'),
  password: z.string().min(8, 'minLength'),
})
