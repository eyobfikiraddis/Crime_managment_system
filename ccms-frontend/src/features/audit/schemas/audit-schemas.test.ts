import { describe, it, expect } from 'vitest'
import { auditEntrySchema, paginatedAuditEntriesSchema } from './audit-api.schema'

describe('audit Zod schemas', () => {
  const validEntry = {
    id: '8b189e75-c243-4c86-ba0a-69dd607a5fe5',
    eventType: 'CASE_CREATED',
    category: 'CASE',
    actor: {
      officerId: '8b189e75-c243-4c86-ba0a-69dd607a5fe5',
      fullName: 'Sara Haile',
      badgeNumber: 'BD-082',
      departmentName: 'Criminal Investigations',
    },
    timestamp: '2026-06-01T10:00:00Z',
    description: 'Case created successfully',
    diff: null,
    noteText: null,
    securitySeverity: null,
    custodyGap: null,
    isImmutable: true,
    linkedCaseId: null,
    linkedCaseNumber: null,
  }

  describe('auditEntrySchema', () => {
    it('successfully parses valid entries', () => {
      const parsed = auditEntrySchema.safeParse(validEntry)
      expect(parsed.success).toBe(true)
    })

    it('rejects invalid event types', () => {
      const invalid = { ...validEntry, eventType: 'UNKNOWN_TYPE' }
      const parsed = auditEntrySchema.safeParse(invalid)
      expect(parsed.success).toBe(false)
    })

    it('rejects invalid uuid ids', () => {
      const invalid = { ...validEntry, id: 'not-a-uuid' }
      const parsed = auditEntrySchema.safeParse(invalid)
      expect(parsed.success).toBe(false)
    })
  })

  describe('paginatedAuditEntriesSchema', () => {
    it('successfully parses valid paginated responses', () => {
      const paginated = {
        data: [validEntry],
        total: 1,
        page: 1,
        pageSize: 25,
        totalPages: 1,
      }
      const parsed = paginatedAuditEntriesSchema.safeParse(paginated)
      expect(parsed.success).toBe(true)
    })

    it('rejects missing totalPages', () => {
      const paginated = {
        data: [validEntry],
        total: 1,
        page: 1,
        pageSize: 25,
      }
      const parsed = paginatedAuditEntriesSchema.safeParse(paginated)
      expect(parsed.success).toBe(false)
    })
  })
})
