import { z } from 'zod'

export const loginSchema = z.object({
  nationalId: z
    .string()
    .min(1, 'required')
    .max(100, 'maxLength'),
  password: z.string().min(8, 'minLength'),
})
