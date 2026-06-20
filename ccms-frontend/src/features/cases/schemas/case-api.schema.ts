import { z } from 'zod'
import { CaseStatus, TimelineEventType } from '../types/case.types'
import { OfficerRole } from '@shared/constants/roles'

export const caseOfficerSchema = z.object({
  id: z.string(),
  badgeNumber: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  role: z.nativeEnum(OfficerRole),
  departmentId: z.string(),
  departmentName: z.string(),
})

export const caseListItemSchema = z.object({
  id: z.string(),
  caseNumber: z.string(),
  title: z.string(),
  status: z.nativeEnum(CaseStatus),
  crimeType: z.object({ id: z.string(), name: z.string(), code: z.string() }),
  department: z.object({ id: z.string(), name: z.string() }),
  leadOfficer: caseOfficerSchema.pick({
    id: true,
    badgeNumber: true,
    firstName: true,
    lastName: true,
  }),
  incidentDate: z.string(),
  reportedDate: z.string(),
  evidenceCount: z.number(),
  arrestCount: z.number(),
  lastActivityAt: z.string(),
})

export const caseDetailSchema = caseListItemSchema.extend({
  description: z.string(),
  location: z
    .object({ id: z.string(), name: z.string(), address: z.string().optional() })
    .nullable(),
  chargeCount: z.number(),
  memberCount: z.number(),
  closedDate: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const timelineEntrySchema = z.object({
  id: z.string(),
  eventType: z.nativeEnum(TimelineEventType),
  eventLabel: z.string(),
  actor: caseOfficerSchema,
  description: z.string(),
  diff: z
    .array(z.object({ fieldName: z.string(), before: z.unknown(), after: z.unknown() }))
    .nullable(),
  securitySeverity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).nullable(),
  createdAt: z.string(),
})

export const paginatedCasesSchema = z.object({
  data: z.array(caseListItemSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  totalPages: z.number().optional().default(1),
})

export const paginatedTimelineSchema = z.object({
  data: z.array(timelineEntrySchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  totalPages: z.number().optional().default(1),
})
