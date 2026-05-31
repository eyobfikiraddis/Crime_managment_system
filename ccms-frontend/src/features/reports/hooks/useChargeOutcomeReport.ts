import { useQuery } from '@tanstack/react-query'
import { getChargeOutcomeReport } from '@services/domain/reports.service'
import { reportKeys } from '@services/query/keys/reportKeys'
import type { ReportFilters } from '../types/reports.types'

export function useChargeOutcomeReport(filters: ReportFilters) {
  return useQuery({
    queryKey: reportKeys.chargeOutcomes(filters),
    queryFn: () => getChargeOutcomeReport(filters),
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
    enabled: Boolean(filters.dateFrom && filters.dateTo),
  })
}
