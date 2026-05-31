import { z } from 'zod'
import {
  Gender,
  RiskLevel,
  PersonRole,
  OfficerRole,
  OfficerStatus,
} from '../types/personnel.types'

const suspectProfileSchema = z.object({
  riskLevel: z.nativeEnum(RiskLevel),
  notes: z.string().nullable(),
  promotedAt: z.string(),
  promotedByOfficerId: z.string().uuid(),
})

const victimProfileSchema = z.object({
  notes: z.string().nullable(),
  promotedAt: z.string(),
  promotedByOfficerId: z.string().uuid(),
})

const witnessProfileSchema = z.object({
  credibilityNotes: z.string().nullable(),
  isProtected: z.boolean(),
  protectionLevel: z.string().nullable(),
  promotedAt: z.string(),
  promotedByOfficerId: z.string().uuid(),
})

const personPIISchema = z.object({
  nationalId: z.string().nullable(),
  dateOfBirth: z.string().nullable(),
  phone: z.string().nullable(),
})

export const personListItemSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
  nationalIdMasked: z.string().nullable(),
  gender: z.nativeEnum(Gender).nullable(),
  roles: z.array(z.nativeEnum(PersonRole)),
  riskLevel: z.nativeEnum(RiskLevel).nullable(),
  isProtectedWitness: z.boolean(),
  createdAt: z.string(),
})

export const personDetailSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
  gender: z.nativeEnum(Gender).nullable(),
  pii: personPIISchema,
  address: z.string().nullable(),
  photoUrl: z.string().nullable(),
  roles: z.array(z.nativeEnum(PersonRole)),
  riskLevel: z.nativeEnum(RiskLevel).nullable(),
  isProtectedWitness: z.boolean(),
  suspectProfile: suspectProfileSchema.nullable(),
  victimProfile: victimProfileSchema.nullable(),
  witnessProfile: witnessProfileSchema.nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const paginatedPersonsSchema = z.object({
  data: z.array(personListItemSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  totalPages: z.number(),
})

export const personCaseSummarySchema = z.object({
  caseId: z.string().uuid(),
  caseNumber: z.string(),
  title: z.string(),
  roleOnCase: z.nativeEnum(PersonRole),
  caseStatus: z.string(),
  createdAt: z.string(),
})

export const personCasesResponseSchema = z.object({
  data: z.array(personCaseSummarySchema),
  total: z.number(),
})

export const officerListItemSchema = z.object({
  id: z.string().uuid(),
  badgeNumber: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  role: z.nativeEnum(OfficerRole),
  status: z.nativeEnum(OfficerStatus),
  departmentId: z.string().uuid(),
  departmentName: z.string(),
  lastActivityAt: z.string().nullable(),
  createdAt: z.string(),
})

export const officerDetailSchema = officerListItemSchema.extend({
  phone: z.string().nullable(),
  activeCaseCount: z.number(),
  totalCaseCount: z.number(),
})

export const paginatedOfficersSchema = z.object({
  data: z.array(officerListItemSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  totalPages: z.number(),
})

export const officerCaseSummarySchema = z.object({
  caseId: z.string().uuid(),
  caseNumber: z.string(),
  title: z.string(),
  status: z.string(),
  assignedAt: z.string(),
})

export const officerCasesResponseSchema = z.object({
  data: z.array(officerCaseSummarySchema),
  total: z.number(),
})
