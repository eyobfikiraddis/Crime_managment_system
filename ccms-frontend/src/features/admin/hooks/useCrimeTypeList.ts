import { useQuery } from '@tanstack/react-query'
import { getCrimeTypes } from '@services/domain/admin.service'
import { adminKeys } from '@services/query/keys/adminKeys'
import type { CrimeTypeFilters } from '../types/admin.types'

export function useCrimeTypeList(filters: CrimeTypeFilters) {
  return useQuery({
    queryKey: adminKeys.crimeTypeListFiltered(filters as Record<string, unknown>),
    queryFn: () => getCrimeTypes(filters),
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  })
}
