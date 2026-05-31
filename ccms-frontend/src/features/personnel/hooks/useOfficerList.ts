import { useQuery } from '@tanstack/react-query'
import { getOfficers } from '@services/domain/personnel.service'
import { personnelKeys } from '@services/query/keys/personnelKeys'
import type { OfficerFilters } from '../types/personnel.types'

export function useOfficerList(filters: OfficerFilters) {
  return useQuery({
    queryKey: personnelKeys.officerListFiltered(filters as Record<string, unknown>),
    queryFn: () => getOfficers(filters),
    staleTime: 2 * 60 * 1000,
    placeholderData: (prev) => prev,
  })
}
