import { useQuery } from '@tanstack/react-query'
import { getDepartmentComparisonReport } from '@services/domain/reports.service'
import { reportKeys } from '@services/query/keys/reportKeys'
import type { ReportFilters } from '../types/reports.types'

export function useDepartmentComparisonReport(filters: ReportFilters, isAdmin: boolean) {
  return useQuery({
    queryKey: reportKeys.deptComparison(filters),
    queryFn: () => getDepartmentComparisonReport(filters),
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
    enabled: Boolean(filters.dateFrom && filters.dateTo) && isAdmin,
  })
}
