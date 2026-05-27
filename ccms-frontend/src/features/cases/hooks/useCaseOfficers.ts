import { useQuery } from '@tanstack/react-query'
import { getCaseMembers } from '@services/domain/cases.service'
import { caseKeys } from '@services/query/keys/caseKeys'

export function useCaseOfficers(caseId: string) {
  return useQuery({
    queryKey: caseKeys.officers(caseId),
    queryFn: () => getCaseMembers(caseId),
    staleTime: 2 * 60 * 1000,
    enabled: Boolean(caseId),
  })
}
