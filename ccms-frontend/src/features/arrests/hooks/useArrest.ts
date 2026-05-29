import { useQuery } from '@tanstack/react-query'
import { getArrest } from '@services/domain/arrests.service'
import { arrestKeys } from '@services/query/keys/arrestKeys'

export function useArrest(arrestId: string) {
  return useQuery({
    queryKey: arrestKeys.detail(arrestId),
    queryFn: () => getArrest(arrestId),
    staleTime: 2 * 60 * 1000,
    enabled: Boolean(arrestId),
  })
}
