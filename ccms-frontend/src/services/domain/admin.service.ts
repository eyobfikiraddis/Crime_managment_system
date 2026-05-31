import { apiClient } from '@services/api/client'
import {
  paginatedLocationsSchema,
  locationSchema,
  paginatedCrimeTypesSchema,
  crimeTypeSchema,
  systemHealthSchema,
  systemReadinessSchema,
} from '@features/admin/schemas/admin-api.schema'
import type {
  Location,
  LocationFilters,
  CreateLocationPayload,
  CrimeType,
  CrimeTypeFilters,
  CreateCrimeTypePayload,
  SystemHealth,
  SystemReadiness,
} from '@features/admin/types/admin.types'
import type { PaginatedResponse } from '@shared/types/api.types'

// ═══════════════════════════════════════════════════════════════════════════════
// SYSTEM HEALTH (2 endpoints)
// ═══════════════════════════════════════════════════════════════════════════════

/** GET /api/v1/health — overall system health with per-service status */
export async function getSystemHealth(): Promise<SystemHealth> {
  const raw = await apiClient.get('/api/v1/health')
  return systemHealthSchema.parse(raw)
}

/** GET /api/v1/readiness — simple readiness probe */
export async function getSystemReadiness(): Promise<SystemReadiness> {
  const raw = await apiClient.get('/api/v1/readiness')
  return systemReadinessSchema.parse(raw)
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOCATIONS (3 endpoints)
// ═══════════════════════════════════════════════════════════════════════════════

/** GET /api/v1/admin/locations — list with filters */
export async function getLocations(
  filters: LocationFilters,
): Promise<PaginatedResponse<Location>> {
  const p = new URLSearchParams()
  if (filters.search) p.set('search', filters.search)
  p.set('page', String(filters.page ?? 1))
  p.set('pageSize', String(filters.pageSize ?? 25))
  if (filters.sortField) p.set('sortField', filters.sortField)
  if (filters.sortDirection) p.set('sortDirection', filters.sortDirection)
  const raw = await apiClient.get(`/api/v1/admin/locations?${p.toString()}`)
  return paginatedLocationsSchema.parse(raw)
}

/** POST /api/v1/admin/locations — create new location (admin+) */
export async function createLocation(
  payload: CreateLocationPayload,
): Promise<Location> {
  const raw = await apiClient.post('/api/v1/admin/locations', payload)
  return locationSchema.parse(raw)
}

/** DELETE /api/v1/admin/locations/:id — delete location (admin+) */
export async function deleteLocation(locationId: string): Promise<void> {
  await apiClient.delete(`/api/v1/admin/locations/${locationId}`)
}

// ═══════════════════════════════════════════════════════════════════════════════
// CRIME TYPES (3 endpoints)
// ═══════════════════════════════════════════════════════════════════════════════

/** GET /api/v1/admin/crime-types — list with filters */
export async function getCrimeTypes(
  filters: CrimeTypeFilters,
): Promise<PaginatedResponse<CrimeType>> {
  const p = new URLSearchParams()
  if (filters.search) p.set('search', filters.search)
  if (filters.category) p.set('category', filters.category)
  if (filters.severity?.length) p.set('severity', filters.severity.join(','))
  p.set('page', String(filters.page ?? 1))
  p.set('pageSize', String(filters.pageSize ?? 25))
  if (filters.sortField) p.set('sortField', filters.sortField)
  if (filters.sortDirection) p.set('sortDirection', filters.sortDirection)
  const raw = await apiClient.get(`/api/v1/admin/crime-types?${p.toString()}`)
  return paginatedCrimeTypesSchema.parse(raw)
}

/** POST /api/v1/admin/crime-types — create new crime type (admin+) */
export async function createCrimeType(
  payload: CreateCrimeTypePayload,
): Promise<CrimeType> {
  const raw = await apiClient.post('/api/v1/admin/crime-types', payload)
  return crimeTypeSchema.parse(raw)
}

/** DELETE /api/v1/admin/crime-types/:id — delete crime type (admin+) */
export async function deleteCrimeType(crimeTypeId: string): Promise<void> {
  await apiClient.delete(`/api/v1/admin/crime-types/${crimeTypeId}`)
}
