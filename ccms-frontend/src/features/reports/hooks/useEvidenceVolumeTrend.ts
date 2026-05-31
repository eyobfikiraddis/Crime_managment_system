import { useQuery } from '@tanstack/react-query'
import { getEvidenceVolumeTrend } from '@services/domain/reports.service'
import { reportKeys } from '@services/query/keys/reportKeys'
import type { ReportFilters } from '../types/reports.types'

export function useEvidenceVolumeTrend(filters: ReportFilters) {
  return useQuery({
    queryKey: reportKeys.evidenceVolumeTrend(filters),
    queryFn: () => getEvidenceVolumeTrend(filters),
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
    enabled: Boolean(filters.dateFrom && filters.dateTo),
  })
}
