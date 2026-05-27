import { z } from 'zod'
import { CaseStatus } from '../types/case.types'

export const caseFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.array(z.nativeEnum(CaseStatus)).optional(),
  crimeTypeId: z.string().optional(),
  departmentId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().min(1).optional().default(1),
  pageSize: z.coerce.number().min(10).max(100).optional().default(25),
  sortField: z
    .enum(['caseNumber', 'title', 'status', 'reportedDate', 'lastActivityAt'])
    .optional()
    .default('reportedDate'),
  sortDirection: z.enum(['asc', 'desc']).optional().default('desc'),
})

export type CaseFiltersValues = z.infer<typeof caseFiltersSchema>
