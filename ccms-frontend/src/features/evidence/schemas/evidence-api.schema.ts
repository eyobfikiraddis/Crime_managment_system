import { z } from 'zod'
import { CustodyEventType, EvidenceType } from '../types/evidence.types'

const custodyOfficerSchema = z.object({
  id: z.string(),
  badgeNumber: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  departmentName: z.string(),
})

const custodyEventSchema = z.object({
  id: z.string(),
  eventType: z.nativeEnum(CustodyEventType),
  fromOfficer: custodyOfficerSchema.nullable(),
  toOfficer: custodyOfficerSchema,
  location: z.string(),
  reason: z.string().nullable(),
  notes: z.string().nullable(),
  timestamp: z.string(),
  isImmutable: z.literal(true),
})

export const custodyChainSchema = z.object({
  events: z.array(custodyEventSchema),
  gaps: z.array(z.object({ afterEventId: z.string(), gapHours: z.number() })),
  isIntact: z.boolean(),
})

export const evidenceListItemSchema = z.object({
  id: z.string(),
  evidenceNumber: z.string(),
  caseId: z.string(),
  evidenceType: z.nativeEnum(EvidenceType),
  description: z.string(),
  collectedBy: custodyOfficerSchema,
  collectedAt: z.string(),
  storageLocation: z.string(),
  custodyStatus: z.nativeEnum(CustodyEventType),
  hasMedia: z.boolean(),
  mediaUrl: z.string().nullable(),
  thumbnailUrl: z.string().nullable(),
  createdAt: z.string(),
})

export const evidenceDetailSchema = evidenceListItemSchema.extend({
  notes: z.string().nullable(),
  custodyChain: custodyChainSchema,
  forensicReport: z
    .object({
      id: z.string(),
      reportNumber: z.string(),
      submittedBy: custodyOfficerSchema,
      labName: z.string(),
      findings: z.string(),
      conclusion: z.string(),
      submittedAt: z.string(),
    })
    .nullable(),
  vehicleDetails: z
    .object({
      make: z.string(),
      model: z.string(),
      year: z.number().nullable(),
      licensePlate: z.string(),
      color: z.string(),
      vin: z.string().nullable(),
    })
    .nullable(),
  weaponDetails: z
    .object({
      weaponType: z.string(),
      make: z.string(),
      model: z.string(),
      serialNumber: z.string().nullable(),
      caliber: z.string().nullable(),
    })
    .nullable(),
})

export const paginatedEvidenceSchema = z.object({
  data: z.array(evidenceListItemSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  totalPages: z.number(),
})

export const cloudinarySignatureSchema = z.object({
  signature: z.string(),
  timestamp: z.number(),
  cloudName: z.string(),
  apiKey: z.string(),
  uploadPreset: z.string(),
  folder: z.string(),
})
