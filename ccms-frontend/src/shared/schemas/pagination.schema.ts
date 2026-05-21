import { z } from 'zod'

export const paginationSchema = z.object({
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1).max(100),
})

export type PaginationSchema = z.infer<typeof paginationSchema>
