import { useQuery } from '@tanstack/react-query'
import { getAdminDashboard } from '@services/domain/dashboard.service'
import { dashboardKeys } from '@services/query/keys/dashboardKeys'

export function useAdminDashboard() {
  return useQuery({
    queryKey: dashboardKeys.admin(),
    queryFn: getAdminDashboard,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  })
}
