import { describe, it, expect } from 'vitest'
import {
  isSecurityEvent,
  isDiffProducingEvent,
  isCustodyEvent,
  formatCustodyGapHours,
  getEventTypesByCategory,
} from './auditUtils'
import { AuditEventType, AuditEventCategory } from '../types/audit.types'

describe('auditUtils', () => {
  describe('isSecurityEvent', () => {
    it('should return true for security events', () => {
      expect(isSecurityEvent(AuditEventType.LOGIN_FAILURE)).toBe(true)
      expect(isSecurityEvent(AuditEventType.ROLE_CHANGED)).toBe(true)
    })

    it('should return false for non-security events', () => {
      expect(isSecurityEvent(AuditEventType.CASE_CREATED)).toBe(false)
    })
  })

  describe('isDiffProducingEvent', () => {
    it('should return true for events expected to carry a diff', () => {
      expect(isDiffProducingEvent(AuditEventType.CASE_UPDATED)).toBe(true)
      expect(isDiffProducingEvent(AuditEventType.OFFICER_UPDATED)).toBe(true)
    })

    it('should return false for non-diff producing events', () => {
      expect(isDiffProducingEvent(AuditEventType.CASE_CREATED)).toBe(false)
    })
  })

  describe('isCustodyEvent', () => {
    it('should return true for custody events', () => {
      expect(isCustodyEvent(AuditEventType.CUSTODY_TRANSFERRED)).toBe(true)
      expect(isCustodyEvent(AuditEventType.EVIDENCE_ADDED)).toBe(true)
    })

    it('should return false for non-custody events', () => {
      expect(isCustodyEvent(AuditEventType.CASE_UPDATED)).toBe(false)
    })
  })

  describe('formatCustodyGapHours', () => {
    it('formats hours under 24 correctly', () => {
      expect(formatCustodyGapHours(6)).toBe('6 hours')
      expect(formatCustodyGapHours(1)).toBe('1 hour')
    })

    it('formats exact days correctly', () => {
      expect(formatCustodyGapHours(24)).toBe('1 day')
      expect(formatCustodyGapHours(48)).toBe('2 days')
    })

    it('formats days and remaining hours correctly', () => {
      expect(formatCustodyGapHours(36)).toBe('1 day, 12 hours')
    })
  })

  describe('getEventTypesByCategory', () => {
    it('returns types belonging to a category', () => {
      const securityTypes = getEventTypesByCategory(AuditEventCategory.SECURITY)
      expect(securityTypes).toContain(AuditEventType.LOGIN_FAILURE)
      expect(securityTypes).toContain(AuditEventType.ROLE_CHANGED)

      const annotationTypes = getEventTypesByCategory(AuditEventCategory.ANNOTATION)
      expect(annotationTypes).toEqual([AuditEventType.CASE_NOTE_ADDED])
    })
  })
})
