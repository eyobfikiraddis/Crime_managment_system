import { z } from 'zod'

export const apiErrorSchema = z.object({
  message: z.string().optional(),
  code: z.string().optional(),
  requestId: z.string().optional(),
  fieldErrors: z.record(z.array(z.string())).optional(),
})

export type ApiErrorPayload = z.infer<typeof apiErrorSchema>
