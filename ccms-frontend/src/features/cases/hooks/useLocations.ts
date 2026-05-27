import { useQuery } from '@tanstack/react-query'
import { getLocations } from '@services/domain/cases.service'
import { caseKeys } from '@services/query/keys/caseKeys'

export function useLocations() {
  return useQuery({
    queryKey: caseKeys.locations(),
    queryFn: getLocations,
    staleTime: 30 * 60 * 1000,
  })
}
