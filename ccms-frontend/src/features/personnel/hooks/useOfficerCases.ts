import { useQuery } from '@tanstack/react-query'
import { getOfficerCases } from '@services/domain/personnel.service'
import { personnelKeys } from '@services/query/keys/personnelKeys'

export function useOfficerCases(officerId: string) {
  return useQuery({
    queryKey: personnelKeys.officerCases(officerId),
    queryFn: () => getOfficerCases(officerId),
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(officerId),
  })
}
