import { z } from 'zod'
import { EvidenceType } from '../types/evidence.types'

export const evidenceFiltersSchema = z.object({
  search: z.string().optional(),
  evidenceType: z.array(z.nativeEnum(EvidenceType)).optional(),
  collectedById: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().min(1).optional().default(1),
  pageSize: z.coerce.number().min(10).max(100).optional().default(25),
  sortField: z
    .enum(['evidenceNumber', 'collectedAt', 'evidenceType', 'custodyStatus'])
    .optional()
    .default('collectedAt'),
  sortDirection: z.enum(['asc', 'desc']).optional().default('desc'),
})
