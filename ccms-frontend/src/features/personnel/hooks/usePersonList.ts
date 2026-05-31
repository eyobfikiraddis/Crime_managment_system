import { useQuery } from '@tanstack/react-query'
import { getPersons } from '@services/domain/personnel.service'
import { personnelKeys } from '@services/query/keys/personnelKeys'
import type { PersonFilters } from '../types/personnel.types'

export function usePersonList(filters: PersonFilters) {
  return useQuery({
    queryKey: personnelKeys.personListFiltered(filters as Record<string, unknown>),
    queryFn: () => getPersons(filters),
    staleTime: 2 * 60 * 1000,
    placeholderData: (prev) => prev,
  })
}
