import { useQuery } from '@tanstack/react-query'
import { getLegalDashboard } from '@services/domain/dashboard.service'
import { dashboardKeys } from '@services/query/keys/dashboardKeys'

export function useLegalDashboard() {
  return useQuery({
    queryKey: dashboardKeys.legal(),
    queryFn: getLegalDashboard,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  })
}
