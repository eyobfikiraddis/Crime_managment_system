import { z } from 'zod'
import { PersonRole, RiskLevel, OfficerStatus, OfficerRole } from '../types/personnel.types'

export const personFiltersSchema = z.object({
  search: z.string().optional(),
  roles: z.array(z.nativeEnum(PersonRole)).optional(),
  riskLevel: z.array(z.nativeEnum(RiskLevel)).optional(),
  isProtectedWitness: z.coerce.boolean().optional(),
  page: z.coerce.number().min(1).optional().default(1),
  pageSize: z.coerce.number().min(10).max(100).optional().default(25),
  sortField: z
    .enum(['firstName', 'lastName', 'createdAt', 'riskLevel'])
    .optional()
    .default('lastName'),
  sortDirection: z.enum(['asc', 'desc']).optional().default('asc'),
})

export const officerFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.array(z.nativeEnum(OfficerStatus)).optional(),
  role: z.array(z.nativeEnum(OfficerRole)).optional(),
  departmentId: z.string().optional(),
  page: z.coerce.number().min(1).optional().default(1),
  pageSize: z.coerce.number().min(10).max(100).optional().default(25),
  sortField: z
    .enum(['badgeNumber', 'firstName', 'lastName', 'status', 'lastActivityAt'])
    .optional()
    .default('badgeNumber'),
  sortDirection: z.enum(['asc', 'desc']).optional().default('asc'),
})
