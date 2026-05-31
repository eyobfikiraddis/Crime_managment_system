import { useQuery } from '@tanstack/react-query'
import { getPerson } from '@services/domain/personnel.service'
import { personnelKeys } from '@services/query/keys/personnelKeys'

export function usePersonDetail(personId: string) {
  return useQuery({
    queryKey: personnelKeys.person(personId),
    queryFn: () => getPerson(personId),
    staleTime: 2 * 60 * 1000,
    enabled: Boolean(personId),
  })
}
