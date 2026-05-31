import { z } from 'zod'
import { OfficerRole } from '../types/personnel.types'

export const createOfficerSchema = z.object({
  badgeNumber: z
    .string()
    .min(1, { message: 'Badge number is required.' })
    .max(20)
    .regex(/^[A-Z0-9-]+$/, {
      message: 'Badge number must contain only uppercase letters, digits, and hyphens.',
    }),
  firstName: z
    .string()
    .min(1, { message: 'First name is required.' })
    .max(100),
  lastName: z
    .string()
    .min(1, { message: 'Last name is required.' })
    .max(100),
  email: z
    .string()
    .email({ message: 'A valid email address is required.' })
    .max(200),
  role: z.nativeEnum(OfficerRole, {
    message: 'Officer role is required.',
  }),
  departmentId: z.string().min(1, { message: 'Department is required.' }),
  phone: z.string().max(20).optional(),
})

export type CreateOfficerValues = z.infer<typeof createOfficerSchema>
