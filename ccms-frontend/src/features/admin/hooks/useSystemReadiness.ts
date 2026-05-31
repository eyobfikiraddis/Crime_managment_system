import { useQuery } from '@tanstack/react-query'
import { getSystemReadiness } from '@services/domain/admin.service'
import { adminKeys } from '@services/query/keys/adminKeys'

export function useSystemReadiness() {
  return useQuery({
    queryKey: adminKeys.readiness(),
    queryFn: getSystemReadiness,
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
    staleTime: 0,
    retry: 1,
  })
}
