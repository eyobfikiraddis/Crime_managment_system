import { z } from 'zod'

import { apiClient } from '@services/api/client'

const crimeTypeSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  code: z.string().optional(),
})

const crimeTypeListSchema = z.array(crimeTypeSchema)

export async function getCrimeTypes(params?: { search?: string }) {
  const p = new URLSearchParams()
  if (params?.search) p.set('search', params.search)
  const query = p.toString()
  const raw = await apiClient.get(
    `/api/v1/admin/crime-types${query ? `?${query}` : ''}`,
  )
  return crimeTypeListSchema.parse(raw)
}
