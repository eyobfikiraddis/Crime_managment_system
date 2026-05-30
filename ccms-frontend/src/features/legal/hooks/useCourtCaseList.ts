import { useQuery } from '@tanstack/react-query'
import { getCourtCases } from '@services/domain/legal.service'
import { legalKeys } from '@services/query/keys/legalKeys'
import type { CourtCaseFilters } from '../types/legal.types'

export function useCourtCaseList(filters: CourtCaseFilters) {
  return useQuery({
    queryKey: legalKeys.courtCaseListFiltered(filters as Record<string, unknown>),
    queryFn: () => getCourtCases(filters),
    staleTime: 2 * 60 * 1000,
    placeholderData: (prev) => prev,
  })
}
