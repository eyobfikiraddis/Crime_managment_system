import { useQuery } from '@tanstack/react-query'
import { getCaseSummary } from '@services/domain/cases.service'
import { caseKeys } from '@services/query/keys/caseKeys'

export function useCaseSummary(caseId: string) {
  return useQuery({
    queryKey: caseKeys.summary(caseId),
    queryFn: () => getCaseSummary(caseId),
    staleTime: 2 * 60 * 1000,
    enabled: Boolean(caseId),
  })
}
