import { useQuery } from '@tanstack/react-query'
import { getLocations } from '@services/domain/admin.service'
import { adminKeys } from '@services/query/keys/adminKeys'
import type { LocationFilters } from '../types/admin.types'

export function useLocationList(filters: LocationFilters) {
  return useQuery({
    queryKey: adminKeys.locationListFiltered(filters as Record<string, unknown>),
    queryFn: () => getLocations(filters),
    staleTime: 5 * 60 * 1000,     // Reference data changes infrequently
    placeholderData: (prev) => prev,
  })
}
