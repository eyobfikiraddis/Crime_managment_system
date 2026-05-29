import { z } from 'zod'

export const interrogationFiltersSchema = z.object({
  search: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().min(1).optional().default(1),
  pageSize: z.coerce.number().min(10).max(100).optional().default(25),
  sortField: z
    .enum(['interrogationDate', 'interrogationNumber'])
    .optional()
    .default('interrogationDate'),
  sortDirection: z.enum(['asc', 'desc']).optional().default('desc'),
})
