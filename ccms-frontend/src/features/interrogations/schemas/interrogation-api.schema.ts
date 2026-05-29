import { z } from 'zod'

const officerRefSchema = z.object({
  id: z.string().uuid(),
  badgeNumber: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  departmentName: z.string(),
})

const subjectSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
  roleOnCase: z.enum(['SUSPECT', 'VICTIM', 'WITNESS']),
})

export const interrogationListItemSchema = z.object({
  id: z.string().uuid(),
  interrogationNumber: z.string(),
  caseId: z.string().uuid(),
  subject: subjectSchema,
  conductingOfficer: officerRefSchema,
  interrogationDate: z.string(),
  location: z.string(),
  durationMinutes: z.number().nullable(),
  legalRepresentativePresent: z.boolean(),
  legalRepresentativeName: z.string().nullable().optional(),
  summary: z.string().optional(),
  recordingReference: z.string().nullable().optional(),
  createdAt: z.string(),
})

export const interrogationDetailSchema = interrogationListItemSchema.extend({
  legalRepresentativeName: z.string().nullable(),
  summary: z.string(),
  recordingReference: z.string().nullable(),
})

export const paginatedInterrogationsSchema = z.object({
  data: z.array(interrogationListItemSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  totalPages: z.number(),
})
