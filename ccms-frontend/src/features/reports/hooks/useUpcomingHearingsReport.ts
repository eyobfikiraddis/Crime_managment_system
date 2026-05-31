import { useQuery } from '@tanstack/react-query'
import { getUpcomingHearingsReport } from '@services/domain/reports.service'
import { reportKeys } from '@services/query/keys/reportKeys'
import type { ReportFilters } from '../types/reports.types'

export function useUpcomingHearingsReport(filters: ReportFilters) {
  return useQuery({
    queryKey: reportKeys.upcomingHearings(filters),
    queryFn: () => getUpcomingHearingsReport(filters),
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
    enabled: Boolean(filters.dateFrom && filters.dateTo),
  })
}
