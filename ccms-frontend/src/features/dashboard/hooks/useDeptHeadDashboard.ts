import { useQuery } from '@tanstack/react-query'
import { getDeptHeadDashboard } from '@services/domain/dashboard.service'
import { dashboardKeys } from '@services/query/keys/dashboardKeys'

export function useDeptHeadDashboard() {
  return useQuery({
    queryKey: dashboardKeys.deptHead(),
    queryFn: getDeptHeadDashboard,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  })
}
