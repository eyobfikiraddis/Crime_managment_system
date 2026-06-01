import { useQuery } from '@tanstack/react-query'
import { getCaseTimeline } from '@services/domain/audit.service'
import { auditKeys } from '@services/query/keys/auditKeys'
import type { AuditFilters } from '../types/audit.types'

export function useCaseTimeline(caseId: string, filters: AuditFilters) {
  return useQuery({
    queryKey: auditKeys.caseTimelineFiltered(caseId, filters),
    queryFn: () => getCaseTimeline(caseId, filters),
    // No staleTime — case timeline is always considered stale (append-only stream)
    staleTime: 0,
    // 30s poll while the tab is in the foreground
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    placeholderData: (prev) => prev,
    enabled: Boolean(caseId),
  })
}
