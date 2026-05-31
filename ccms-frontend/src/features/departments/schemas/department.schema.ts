import { z } from 'zod'

// ─── Create Department ────────────────────────────────────────────────────────
export const createDepartmentSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Department name is required.' })
    .max(200),
  code: z
    .string()
    .max(10)
    .regex(/^[A-Z0-9]+$/, {
      message: 'Code must contain only uppercase letters and digits.',
    })
    .optional(),
  locationId: z.string().uuid().optional(),
  description: z.string().max(1000).optional(),
})

export type CreateDepartmentValues = z.infer<typeof createDepartmentSchema>

// ─── Update Department ────────────────────────────────────────────────────────
export const updateDepartmentSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  code: z
    .string()
    .max(10)
    .regex(/^[A-Z0-9]+$/, {
      message: 'Code must contain only uppercase letters and digits.',
    })
    .nullable()
    .optional(),
  locationId: z.string().uuid().nullable().optional(),
  description: z.string().max(1000).nullable().optional(),
})

export type UpdateDepartmentValues = z.infer<typeof updateDepartmentSchema>

// ─── Assign Head Officer ──────────────────────────────────────────────────────
export const assignHeadOfficerSchema = z.object({
  officerId: z.string().uuid({ message: 'A valid officer must be selected.' }),
})

export type AssignHeadOfficerValues = z.infer<typeof assignHeadOfficerSchema>
