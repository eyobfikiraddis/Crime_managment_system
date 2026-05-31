import { describe, it, expect } from 'vitest'
import {
  hasRole,
  getUnassignedRoles,
  getFullName,
  getOfficerDisplayName,
  RISK_LEVEL_VARIANTS,
  OFFICER_STATUS_VARIANTS,
} from './personnelUtils'

describe('personnelUtils unit tests', () => {
  describe('hasRole', () => {
    it('should return true if the person has the role', () => {
      expect(hasRole(['SUSPECT', 'VICTIM'], 'SUSPECT')).toBe(true)
    })

    it('should return false if the person does not have the role', () => {
      expect(hasRole(['SUSPECT', 'VICTIM'], 'WITNESS')).toBe(false)
    })

    it('should return false if roles array is empty', () => {
      expect(hasRole([], 'SUSPECT')).toBe(false)
    })
  })

  describe('getUnassignedRoles', () => {
    it('should return unassigned roles when some are assigned', () => {
      expect(getUnassignedRoles(['SUSPECT'])).toEqual(['VICTIM', 'WITNESS'])
    })

    it('should return empty array when all are assigned', () => {
      expect(getUnassignedRoles(['SUSPECT', 'VICTIM', 'WITNESS'])).toEqual([])
    })

    it('should return all roles when none are assigned', () => {
      expect(getUnassignedRoles([])).toEqual(['SUSPECT', 'VICTIM', 'WITNESS'])
    })
  })

  describe('getFullName', () => {
    it('should format full name correctly', () => {
      expect(getFullName('Sara', 'Haile')).toBe('Sara Haile')
    })
  })

  describe('getOfficerDisplayName', () => {
    it('should format officer display name with badge number', () => {
      expect(getOfficerDisplayName('Sara', 'Haile', 'BD-082')).toBe('Sara Haile (BD-082)')
    })
  })

  describe('Badge variant maps', () => {
    it('should map LOW risk level to success variant', () => {
      expect(RISK_LEVEL_VARIANTS.LOW).toBe('success')
    })

    it('should map HIGH risk level to destructive variant', () => {
      expect(RISK_LEVEL_VARIANTS.HIGH).toBe('destructive')
    })

    it('should map ACTIVE status to success variant', () => {
      expect(OFFICER_STATUS_VARIANTS.ACTIVE).toBe('success')
    })

    it('should map INACTIVE status to muted variant', () => {
      expect(OFFICER_STATUS_VARIANTS.INACTIVE).toBe('muted')
    })
  })
})
