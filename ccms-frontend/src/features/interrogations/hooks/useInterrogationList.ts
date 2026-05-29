import { useQuery } from '@tanstack/react-query'
import { getCaseInterrogations } from '@services/domain/interrogations.service'
import { interrogationKeys } from '@services/query/keys/interrogationKeys'
import type { InterrogationFilters } from '../types/interrogation.types'

export function useInterrogationList(caseId: string, filters: InterrogationFilters) {
  return useQuery({
    queryKey: interrogationKeys.caseInterrogationList(
      caseId,
      filters as Record<string, unknown>,
    ),
    queryFn: () => getCaseInterrogations(caseId, filters),
    staleTime: 2 * 60 * 1000,
    placeholderData: (prev) => prev,
    enabled: Boolean(caseId),
  })
}
