import { useQuery } from '@tanstack/react-query'
import { getUnreviewedEvidenceReport } from '@services/domain/reports.service'
import { reportKeys } from '@services/query/keys/reportKeys'
import type { ReportFilters } from '../types/reports.types'

export function useUnreviewedEvidenceReport(filters: ReportFilters) {
  return useQuery({
    queryKey: reportKeys.unreviewedEvidence(filters),
    queryFn: () => getUnreviewedEvidenceReport(filters),
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
    enabled: Boolean(filters.dateFrom && filters.dateTo),
  })
}
