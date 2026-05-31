import { useQuery } from '@tanstack/react-query'
import { getEvidenceTypeBreakdown } from '@services/domain/reports.service'
import { reportKeys } from '@services/query/keys/reportKeys'
import type { ReportFilters } from '../types/reports.types'

export function useEvidenceTypeBreakdown(filters: ReportFilters) {
  return useQuery({
    queryKey: reportKeys.evidenceTypeBreakdown(filters),
    queryFn: () => getEvidenceTypeBreakdown(filters),
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
    enabled: Boolean(filters.dateFrom && filters.dateTo),
  })
}
