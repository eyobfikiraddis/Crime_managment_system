import { describe, it, expect } from 'vitest'
import { createPersonSchema, promoteToSuspectSchema, promoteToWitnessSchema } from './person.schema'
import { createOfficerSchema } from './officer.schema'

describe('Personnel module Zod schemas validation tests', () => {
  describe('createPersonSchema', () => {
    it('should validate a valid payload with required fields only', () => {
      const result = createPersonSchema.safeParse({
        firstName: 'Sara',
        lastName: 'Haile',
      })
      expect(result.success).toBe(true)
    })

    it('should fail when firstName is missing', () => {
      const result = createPersonSchema.safeParse({
        lastName: 'Haile',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        const error = result.error.format()
        expect(error.firstName).toBeDefined()
      }
    })

    it('should fail when lastName is missing', () => {
      const result = createPersonSchema.safeParse({
        firstName: 'Sara',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        const error = result.error.format()
        expect(error.lastName).toBeDefined()
      }
    })

    it('should succeed when optional fields are present', () => {
      const result = createPersonSchema.safeParse({
        firstName: 'Sara',
        lastName: 'Haile',
        gender: 'FEMALE',
        nationalId: '123-456',
        phone: '+251911223344',
        address: 'Bole, Addis Ababa',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('promoteToSuspectSchema', () => {
    it('should succeed with a valid riskLevel', () => {
      const result = promoteToSuspectSchema.safeParse({
        riskLevel: 'HIGH',
        notes: 'High risk suspect',
      })
      expect(result.success).toBe(true)
    })

    it('should fail when riskLevel is missing', () => {
      const result = promoteToSuspectSchema.safeParse({
        notes: 'No risk level',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        const error = result.error.format()
        expect(error.riskLevel).toBeDefined()
      }
    })

    it('should fail with an invalid riskLevel value', () => {
      const result = promoteToSuspectSchema.safeParse({
        riskLevel: 'CRITICAL',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('promoteToWitnessSchema', () => {
    it('should succeed when isProtected is false and protectionLevel is absent', () => {
      const result = promoteToWitnessSchema.safeParse({
        isProtected: false,
        credibilityNotes: 'Reliable witness',
      })
      expect(result.success).toBe(true)
    })

    it('should succeed when isProtected is true and protectionLevel is present', () => {
      const result = promoteToWitnessSchema.safeParse({
        isProtected: true,
        protectionLevel: 'HIGH',
      })
      expect(result.success).toBe(true)
    })

    it('should fail when isProtected is true but protectionLevel is absent', () => {
      const result = promoteToWitnessSchema.safeParse({
        isProtected: true,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        const error = result.error.format()
        expect(error.protectionLevel).toBeDefined()
      }
    })

    it('should succeed when isProtected is false even if protectionLevel is present', () => {
      const result = promoteToWitnessSchema.safeParse({
        isProtected: false,
        protectionLevel: 'HIGH',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('createOfficerSchema', () => {
    it('should validate a valid officer payload', () => {
      const result = createOfficerSchema.safeParse({
        badgeNumber: 'BD-00142',
        firstName: 'Sara',
        lastName: 'Haile',
        email: 'sara.haile@police.gov.et',
        role: 'INVESTIGATOR',
        departmentId: '123e4567-e89b-12d3-a456-426614174000',
        phone: '+251911223344',
      })
      expect(result.success).toBe(true)
    })

    it('should fail when badgeNumber contains lowercase characters', () => {
      const result = createOfficerSchema.safeParse({
        badgeNumber: 'bd-00142', // lowercase
        firstName: 'Sara',
        lastName: 'Haile',
        email: 'sara.haile@police.gov.et',
        role: 'INVESTIGATOR',
        departmentId: '123e4567-e89b-12d3-a456-426614174000',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        const error = result.error.format()
        expect(error.badgeNumber).toBeDefined()
      }
    })

    it('should fail when email address is invalid', () => {
      const result = createOfficerSchema.safeParse({
        badgeNumber: 'BD-00142',
        firstName: 'Sara',
        lastName: 'Haile',
        email: 'invalid-email-address',
        role: 'INVESTIGATOR',
        departmentId: '123e4567-e89b-12d3-a456-426614174000',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        const error = result.error.format()
        expect(error.email).toBeDefined()
      }
    })

    it('should fail when departmentId is missing', () => {
      const result = createOfficerSchema.safeParse({
        badgeNumber: 'BD-00142',
        firstName: 'Sara',
        lastName: 'Haile',
        email: 'sara.haile@police.gov.et',
        role: 'INVESTIGATOR',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        const error = result.error.format()
        expect(error.departmentId).toBeDefined()
      }
    })
  })
})
