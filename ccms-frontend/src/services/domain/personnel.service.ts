import { apiClient } from '@services/api/client'
import {
  paginatedPersonsSchema,
  personDetailSchema,
  personCasesResponseSchema,
  paginatedOfficersSchema,
  officerDetailSchema,
  officerCasesResponseSchema,
} from '@features/personnel/schemas/personnel-api.schema'
import type {
  Person,
  PersonListItem,
  PersonFilters,
  PersonCaseSummary,
  CreatePersonPayload,
  PromoteToSuspectPayload,
  PromoteToVictimPayload,
  PromoteToWitnessPayload,
  Officer,
  OfficerListItem,
  OfficerFilters,
  OfficerCaseSummary,
  CreateOfficerPayload,
  PersonRole,
} from '@features/personnel/types/personnel.types'
import type { PaginatedResponse } from '@shared/types/api.types'

export interface OfficerSearchItem {
  id: string
  badgeNumber: string
  firstName: string
  lastName: string
}

export async function getPersons(
  filters: PersonFilters,
): Promise<PaginatedResponse<PersonListItem>> {
  const params = buildPersonParams(filters)
  const raw = await apiClient.get(`/api/v1/personnel/persons?${params}`)
  return paginatedPersonsSchema.parse(raw)
}

export async function getPerson(personId: string): Promise<Person> {
  const raw = await apiClient.get(`/api/v1/personnel/persons/${personId}`)
  return personDetailSchema.parse(raw)
}

export async function createPerson(
  payload: CreatePersonPayload,
): Promise<Person> {
  const raw = await apiClient.post('/api/v1/personnel/persons', payload)
  return personDetailSchema.parse(raw)
}

export async function promoteToSuspect(
  personId: string,
  payload: PromoteToSuspectPayload,
): Promise<Person> {
  const raw = await apiClient.post(
    `/api/v1/personnel/persons/${personId}/suspect`,
    payload,
  )
  return personDetailSchema.parse(raw)
}

export async function promoteToVictim(
  personId: string,
  payload: PromoteToVictimPayload,
): Promise<Person> {
  const raw = await apiClient.post(
    `/api/v1/personnel/persons/${personId}/victim`,
    payload,
  )
  return personDetailSchema.parse(raw)
}

export async function promoteToWitness(
  personId: string,
  payload: PromoteToWitnessPayload,
): Promise<Person> {
  const raw = await apiClient.post(
    `/api/v1/personnel/persons/${personId}/witness`,
    payload,
  )
  return personDetailSchema.parse(raw)
}

export async function getPersonCases(
  personId: string,
  params: { page?: number; pageSize?: number } = {},
): Promise<{ data: PersonCaseSummary[]; total: number }> {
  const p = new URLSearchParams()
  p.set('page', String(params.page ?? 1))
  p.set('pageSize', String(params.pageSize ?? 25))
  const raw = await apiClient.get(
    `/api/v1/personnel/persons/${personId}/cases?${p.toString()}`,
  )
  return personCasesResponseSchema.parse(raw)
}

export async function getOfficers(
  filters: OfficerFilters,
): Promise<PaginatedResponse<OfficerListItem>> {
  const params = buildOfficerParams(filters)
  const raw = await apiClient.get(`/api/v1/personnel/officers?${params}`)
  return paginatedOfficersSchema.parse(raw)
}

export async function getOfficer(officerId: string): Promise<Officer> {
  const raw = await apiClient.get(`/api/v1/personnel/officers/${officerId}`)
  return officerDetailSchema.parse(raw)
}

export async function createOfficer(
  payload: CreateOfficerPayload,
): Promise<Officer> {
  const raw = await apiClient.post('/api/v1/personnel/officers', payload)
  return officerDetailSchema.parse(raw)
}

export async function activateOfficer(officerId: string): Promise<Officer> {
  const raw = await apiClient.post(
    `/api/v1/personnel/officers/${officerId}/activate`,
  )
  return officerDetailSchema.parse(raw)
}

export async function deactivateOfficer(officerId: string): Promise<Officer> {
  const raw = await apiClient.post(
    `/api/v1/personnel/officers/${officerId}/deactivate`,
  )
  return officerDetailSchema.parse(raw)
}

export async function resetOfficerPassword(officerId: string): Promise<void> {
  await apiClient.post(`/api/v1/personnel/officers/${officerId}/reset-password`)
}

export async function getOfficerCases(
  officerId: string,
): Promise<{ data: OfficerCaseSummary[]; total: number }> {
  const raw = await apiClient.get(
    `/api/v1/personnel/officers/${officerId}/cases?pageSize=10&sortField=assignedAt&sortDirection=desc`,
  )
  return officerCasesResponseSchema.parse(raw)
}

export async function searchOfficers(search?: string): Promise<OfficerSearchItem[]> {
  const params = buildOfficerParams({
    ...(search ? { search } : {}),
    page: 1,
    pageSize: 10,
  })
  const raw = await apiClient.get(`/api/v1/personnel/officers?${params}`)
  const parsed = paginatedOfficersSchema.parse(raw)
  return parsed.data.map((officer) => ({
    id: officer.id,
    badgeNumber: officer.badgeNumber,
    firstName: officer.firstName,
    lastName: officer.lastName,
  }))
}

function buildPersonParams(filters: Partial<PersonFilters>): string {
  const p = new URLSearchParams()
  if (filters.search) p.set('search', filters.search)
  if (filters.roles?.length) p.set('roles', filters.roles.join(','))
  if (filters.riskLevel?.length) p.set('riskLevel', filters.riskLevel.join(','))
  if (filters.isProtectedWitness !== undefined) {
    p.set('isProtectedWitness', String(filters.isProtectedWitness))
  }
  p.set('page', String(filters.page ?? 1))
  p.set('pageSize', String(filters.pageSize ?? 25))
  if (filters.sortField) p.set('sortField', filters.sortField)
  if (filters.sortDirection) p.set('sortDirection', filters.sortDirection)
  return p.toString()
}

function buildOfficerParams(filters: Partial<OfficerFilters>): string {
  const p = new URLSearchParams()
  if (filters.search) p.set('search', filters.search)
  if (filters.status?.length) p.set('status', filters.status.join(','))
  if (filters.role?.length) p.set('role', filters.role.join(','))
  if (filters.departmentId) p.set('departmentId', filters.departmentId)
  p.set('page', String(filters.page ?? 1))
  p.set('pageSize', String(filters.pageSize ?? 25))
  if (filters.sortField) p.set('sortField', filters.sortField)
  if (filters.sortDirection) p.set('sortDirection', filters.sortDirection)
  return p.toString()
}

/**
 * DELETE /api/v1/personnel/persons/{personId}/roles/{role}
 * Removes a specific role designation from a person. Admin+ only.
 * Returns the updated Person.
 */
export async function demotePersonRole(
  personId: string,
  role: PersonRole,
): Promise<Person> {
  const raw = await apiClient.delete(
    `/api/v1/personnel/persons/${personId}/roles/${role}`,
  )
  return personDetailSchema.parse(raw)
}
