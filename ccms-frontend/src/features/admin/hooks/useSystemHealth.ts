import { useQuery } from '@tanstack/react-query'
import { getSystemHealth } from '@services/domain/admin.service'
import { adminKeys } from '@services/query/keys/adminKeys'

export function useSystemHealth() {
  return useQuery({
    queryKey: adminKeys.health(),
    queryFn: getSystemHealth,
    refetchInterval: 15_000,           // Poll every 15 seconds
    refetchIntervalInBackground: false, // Stop polling when tab is inactive
    staleTime: 0,                       // Health data is always considered stale
    retry: 1,                          // Only one retry — avoid hammering a down system
  })
}
