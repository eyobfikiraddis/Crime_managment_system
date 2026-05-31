import { useQuery } from '@tanstack/react-query'
import { getInvestigatorDashboard } from '@services/domain/dashboard.service'
import { dashboardKeys } from '@services/query/keys/dashboardKeys'

export function useInvestigatorDashboard() {
  return useQuery({
    queryKey: dashboardKeys.investigator(),
    queryFn: getInvestigatorDashboard,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  })
}
