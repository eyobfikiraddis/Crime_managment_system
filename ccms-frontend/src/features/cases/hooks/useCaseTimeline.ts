import { useQuery } from '@tanstack/react-query'
import { getCaseTimeline } from '@services/domain/cases.service'
import { caseKeys } from '@services/query/keys/caseKeys'
import type { TimelineFilters } from '../types/case.types'

interface UseCaseTimelineOptions {
  caseId: string
  filters?: TimelineFilters & { page?: number; pageSize?: number }
  enabled?: boolean
}

export function useCaseTimeline({ caseId, filters = {}, enabled = true }: UseCaseTimelineOptions) {
  return useQuery({
    queryKey: caseKeys.timelineFiltered(caseId, filters as Record<string, unknown>),
    queryFn: () => getCaseTimeline(caseId, filters),
    staleTime: 0,                        // Always considered stale — timeline is real-time
    refetchInterval: enabled ? 30_000 : false,  // Poll every 30s only when tab is active
    enabled: Boolean(caseId) && enabled,
  })
}
