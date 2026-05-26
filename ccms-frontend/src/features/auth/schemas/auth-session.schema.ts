import { z } from 'zod'

import { OfficerRole } from '@/shared/constants/roles'

export const officerProfileSchema = z.object({
  id: z.string().uuid(),
  badgeNumber: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  role: z.nativeEnum(OfficerRole),
  departmentId: z.string().uuid(),
  permissions: z.array(z.string()),
  isActive: z.boolean(),
  lastLoginAt: z.string().datetime().nullable(),
})

export const authSessionSchema = z.object({
  officer: officerProfileSchema,
  sessionId: z.string(),
  expiresAt: z.string().datetime(),
})
