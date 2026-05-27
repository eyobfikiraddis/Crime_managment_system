import { apiClient } from '@services/api/client'

export async function getDepartments(): Promise<Array<{ id: string; name: string }>> {
  return apiClient.get('/api/v1/departments')
}
