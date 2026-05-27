import { apiClient } from '@services/api/client'

export interface OfficerSearchItem {
  id: string
  badgeNumber: string
  firstName: string
  lastName: string
}

export async function searchOfficers(search?: string): Promise<OfficerSearchItem[]> {
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  return apiClient.get(`/api/v1/personnel/officers?${params.toString()}`)
}
