import { useQuery } from '@tanstack/react-query'
import { getCase } from '@services/domain/cases.service'
import { caseKeys } from '@services/query/keys/caseKeys'

export function useCase(caseId: string) {
  return useQuery({
    queryKey: caseKeys.detail(caseId),
    queryFn: () => getCase(caseId),
    staleTime: 2 * 60 * 1000,
    enabled: Boolean(caseId),
  })
}
