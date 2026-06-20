import { z } from 'zod'

import { OfficerRole } from '@/shared/constants/roles'

export const officerProfileSchema = z.object({
  id: z.coerce.string(),
  badgeNumber: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  role: z.nativeEnum(OfficerRole),
  departmentId: z.coerce.string().nullable().optional(),
  permissions: z.array(z.string()),
  isActive: z.boolean(),
  lastLoginAt: z.string().nullable(),
})

export const authSessionSchema = z.object({
  officer: officerProfileSchema,
  sessionId: z.string(),
  expiresAt: z.string(),
})
