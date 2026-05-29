import { z } from 'zod'
import { DetentionStatus } from '../types/arrest.types'

export const arrestFiltersSchema = z.object({
  search: z.string().optional(),
  detentionStatus: z.array(z.nativeEnum(DetentionStatus)).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().min(1).optional().default(1),
  pageSize: z.coerce.number().min(10).max(100).optional().default(25),
  sortField: z
    .enum(['arrestDate', 'arrestNumber', 'detentionStatus'])
    .optional()
    .default('arrestDate'),
  sortDirection: z.enum(['asc', 'desc']).optional().default('desc'),
})
