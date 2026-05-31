import { useQuery } from '@tanstack/react-query'
import { getPersonCases } from '@services/domain/personnel.service'
import { personnelKeys } from '@services/query/keys/personnelKeys'

export function usePersonCases(
  personId: string,
  params: { page?: number; pageSize?: number } = {},
) {
  return useQuery({
    queryKey: [...personnelKeys.personCases(personId), params],
    queryFn: () => getPersonCases(personId, params),
    staleTime: 2 * 60 * 1000,
    placeholderData: (prev) => prev,
    enabled: Boolean(personId),
  })
}
