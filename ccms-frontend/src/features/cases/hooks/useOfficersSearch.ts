import { useQuery } from '@tanstack/react-query'
import { searchOfficers } from '@services/domain/personnel.service'
import { personnelKeys } from '@services/query/keys/personnelKeys'

export function useOfficersSearch(search?: string) {
  return useQuery({
    queryKey: personnelKeys.officerListFiltered({
      search: search ?? '',
      page: 1,
      pageSize: 10,
    }),
    queryFn: () => searchOfficers(search),
    staleTime: 5 * 60 * 1000,
  })
}
