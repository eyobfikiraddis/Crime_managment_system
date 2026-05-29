import { useQuery } from '@tanstack/react-query'
import { getCaseArrests } from '@services/domain/arrests.service'
import { arrestKeys } from '@services/query/keys/arrestKeys'
import type { ArrestFilters } from '../types/arrest.types'

export function useArrestList(caseId: string, filters: ArrestFilters) {
  return useQuery({
    queryKey: arrestKeys.caseArrestList(caseId, filters as Record<string, unknown>),
    queryFn: () => getCaseArrests(caseId, filters),
    staleTime: 2 * 60 * 1000,
    placeholderData: (prev) => prev,
    enabled: Boolean(caseId),
  })
}
