import { z } from 'zod'

export const departmentFiltersSchema = z.object({
  search: z.string().optional(),
  locationId: z.string().optional(),
  hasHeadOfficer: z.coerce.boolean().optional(),
  page: z.coerce.number().min(1).optional().default(1),
  pageSize: z.coerce.number().min(10).max(100).optional().default(25),
  sortField: z
    .enum(['name', 'officerCount', 'activeCaseCount', 'createdAt'])
    .optional()
    .default('name'),
  sortDirection: z.enum(['asc', 'desc']).optional().default('asc'),
})
