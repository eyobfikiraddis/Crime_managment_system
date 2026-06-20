import { z } from 'zod'
import { CrimeSeverity } from '../types/admin.types'

// ─── Location schemas ─────────────────────────────────────────────────────────
export const locationSchema = z.object({
  id: z.string(),
  name: z.string(),
  region: z.string().nullable(),
  country: z.string(),
  createdAt: z.string(),
})

export const paginatedLocationsSchema = z.object({
  data: z.array(locationSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  totalPages: z.number(),
})

// ─── Crime Type schemas ───────────────────────────────────────────────────────
export const crimeTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  category: z.string().nullable(),
  severity: z.nativeEnum(CrimeSeverity).nullable(),
  createdAt: z.string(),
})

export const paginatedCrimeTypesSchema = z.object({
  data: z.array(crimeTypeSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  totalPages: z.number(),
})

// ─── System Health schemas ────────────────────────────────────────────────────
const serviceHealthSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'down']),
  responseTimeMs: z.number().nullable(),
  message: z.string().nullable(),
  checkedAt: z.string(),
})

export const systemHealthSchema = z.object({
  overall: z.enum(['healthy', 'degraded', 'down']),
  timestamp: z.string(),
  services: z.object({
    database: serviceHealthSchema,
    redis: serviceHealthSchema,
    api: serviceHealthSchema,
  }),
  metrics: z.object({
    activeSessionCount: z.number(),
    apiResponseTimeP95Ms: z.number().nullable(),
    lastBackupAt: z.string().nullable(),
  }),
})

export const systemReadinessSchema = z.object({
  ready: z.boolean(),
  timestamp: z.string(),
})
