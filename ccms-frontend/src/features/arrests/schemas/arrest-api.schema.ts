import { z } from 'zod'
import { DetentionStatus, BailStatus } from '../types/arrest.types'

const personRefSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
  nationalId: z.string(),
})

const officerRefSchema = z.object({
  id: z.string().uuid(),
  badgeNumber: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  departmentName: z.string(),
})

export const arrestListItemSchema = z.object({
  id: z.string().uuid(),
  arrestNumber: z.string(),
  caseId: z.string().uuid(),
  arrestedPerson: personRefSchema,
  arrestingOfficer: officerRefSchema,
  arrestDate: z.string(),
  location: z.string(),
  detentionStatus: z.nativeEnum(DetentionStatus),
  bailStatus: z.nativeEnum(BailStatus),
  bailAmount: z.number().nullable(),
  warrantNumber: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const arrestDetailSchema = arrestListItemSchema.extend({
  chargesAtArrest: z.array(z.string()),
  notes: z.string().nullable(),
  courtAppearanceDate: z.string().nullable(),
})

export const paginatedArrestsSchema = z.object({
  data: z.array(arrestListItemSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  totalPages: z.number(),
})
