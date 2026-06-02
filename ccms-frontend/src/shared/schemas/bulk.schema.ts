import { z } from 'zod'

export const bulkOperationResultSchema = z.object({
  updated: z.number(),
  failed: z.number(),
  errors: z.array(z.string()),
})

export type BulkOperationResult = z.infer<typeof bulkOperationResultSchema>
