import { useQuery } from '@tanstack/react-query'
import { getOfficer } from '@services/domain/personnel.service'
import { personnelKeys } from '@services/query/keys/personnelKeys'

export function useOfficerDetail(officerId: string) {
  return useQuery({
    queryKey: personnelKeys.officer(officerId),
    queryFn: () => getOfficer(officerId),
    staleTime: 2 * 60 * 1000,
    enabled: Boolean(officerId),
  })
}
