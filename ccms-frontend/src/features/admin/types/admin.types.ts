// ─── Location ─────────────────────────────────────────────────────────────────
export interface Location {
  id: string
  name: string
  region: string | null
  country: string
  createdAt: string
}

export interface LocationFilters {
  search?: string | undefined
  page?: number | undefined
  pageSize?: number | undefined
  sortField?: 'name' | 'country' | 'createdAt' | undefined
  sortDirection?: 'asc' | 'desc' | undefined
}

export interface CreateLocationPayload {
  name: string
  region?: string | undefined
  country: string
}

// ─── Crime Severity enum ──────────────────────────────────────────────────────
export const CrimeSeverity = {
  MISDEMEANOR: 'MISDEMEANOR',
  FELONY:      'FELONY',
  CAPITAL:     'CAPITAL',
} as const
export type CrimeSeverity = (typeof CrimeSeverity)[keyof typeof CrimeSeverity]

// ─── Crime Type ───────────────────────────────────────────────────────────────
export interface CrimeType {
  id: string
  name: string
  code: string                     // Short uppercase code e.g. "ROB", "ASSAULT", "HOMICIDE"
  category: string | null          // Free-text category grouping
  severity: CrimeSeverity | null
  createdAt: string
}

export interface CrimeTypeFilters {
  search?: string | undefined
  category?: string | undefined
  severity?: CrimeSeverity[] | undefined
  page?: number | undefined
  pageSize?: number | undefined
  sortField?: 'name' | 'code' | 'category' | 'severity' | 'createdAt' | undefined
  sortDirection?: 'asc' | 'desc' | undefined
}

export interface CreateCrimeTypePayload {
  name: string
  code: string                     // Must be unique, uppercase alphanumeric, max 20 chars
  category?: string | undefined
  severity?: CrimeSeverity | undefined
}

// ─── Health Status enum ───────────────────────────────────────────────────────
export const HealthStatus = {
  HEALTHY:  'healthy',
  DEGRADED: 'degraded',
  DOWN:     'down',
} as const
export type HealthStatus = (typeof HealthStatus)[keyof typeof HealthStatus]

// ─── Per-service health entry ─────────────────────────────────────────────────
export interface ServiceHealth {
  status: HealthStatus
  responseTimeMs: number | null
  message: string | null
  checkedAt: string                // ISO 8601
}

// ─── Full system health (from GET /api/v1/health) ────────────────────────────
export interface SystemHealth {
  overall: HealthStatus
  timestamp: string
  services: {
    database: ServiceHealth
    redis: ServiceHealth
    api: ServiceHealth
  }
  metrics: {
    activeSessionCount: number
    apiResponseTimeP95Ms: number | null
    lastBackupAt: string | null    // ISO 8601; null if never backed up
  }
}

// ─── System readiness (from GET /api/v1/readiness) ───────────────────────────
export interface SystemReadiness {
  ready: boolean
  timestamp: string
}
