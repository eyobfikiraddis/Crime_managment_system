import { z } from 'zod'

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'required').email('email'),
})
