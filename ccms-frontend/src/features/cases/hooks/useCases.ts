import { useQuery } from '@tanstack/react-query'
import { getCases } from '@services/domain/cases.service'
import { caseKeys } from '@services/query/keys/caseKeys'
import type { CaseFilters } from '../types/case.types'

export function useCases(filters: CaseFilters) {
  return useQuery({
    queryKey: caseKeys.list(filters as Record<string, unknown>),
    queryFn: () => getCases(filters),
    staleTime: 2 * 60 * 1000,
    placeholderData: (prev) => prev, // Keep previous page data visible during refetch
  })
}
