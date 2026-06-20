import { z } from 'zod'
import { AuditEventType, AuditEventCategory, SecuritySeverity } from '../types/audit.types'

const auditActorSchema = z.object({
  officerId: z.string(),
  fullName: z.string(),
  badgeNumber: z.string(),
  departmentName: z.string(),
})

const auditDiffFieldSchema = z.object({
  field: z.string(),
  before: z.string().nullable(),
  after: z.string().nullable(),
})

const auditDiffSchema = z.object({
  fields: z.array(auditDiffFieldSchema),
})

const custodyGapSchema = z.object({
  gapHours: z.number(),
  fromTimestamp: z.string(),
  toTimestamp: z.string(),
})

export const auditEntrySchema = z.object({
  id: z.string(),
  eventType: z.nativeEnum(AuditEventType),
  category: z.nativeEnum(AuditEventCategory),
  actor: auditActorSchema,
  timestamp: z.string(),
  description: z.string(),
  diff: auditDiffSchema.nullable(),
  noteText: z.string().nullable(),
  securitySeverity: z.nativeEnum(SecuritySeverity).nullable(),
  custodyGap: custodyGapSchema.nullable(),
  isImmutable: z.boolean(),
  linkedCaseId: z.string().nullable(),
  linkedCaseNumber: z.string().nullable(),
})

export const paginatedAuditEntriesSchema = z.object({
  data: z.array(auditEntrySchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  totalPages: z.number(),
})

// Add case note response — the server echoes back the created AuditEntry
export const addCaseNoteResponseSchema = auditEntrySchema
