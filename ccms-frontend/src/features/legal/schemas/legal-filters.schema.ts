import { z } from 'zod'

import { CourtCaseStatus, ChargeStatus } from '../types/legal.types'

export const courtCaseFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.array(z.nativeEnum(CourtCaseStatus)).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().min(1).optional().default(1),
  pageSize: z.coerce.number().min(10).max(100).optional().default(25),
  sortField: z.enum(['filedAt', 'courtCaseNumber', 'status']).optional().default('filedAt'),
  sortDirection: z.enum(['asc', 'desc']).optional().default('desc'),
})

export const chargeFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.array(z.nativeEnum(ChargeStatus)).optional(),
  page: z.coerce.number().min(1).optional().default(1),
  pageSize: z.coerce.number().min(10).max(100).optional().default(25),
  sortField: z.enum(['filedAt', 'status']).optional().default('filedAt'),
  sortDirection: z.enum(['asc', 'desc']).optional().default('desc'),
})
