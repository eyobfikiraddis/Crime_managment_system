import { useQuery } from '@tanstack/react-query'
import { getGlobalAuditLog } from '@services/domain/audit.service'
import { auditKeys } from '@services/query/keys/auditKeys'
import type { AuditFilters } from '../types/audit.types'

export function useGlobalAuditLog(filters: AuditFilters) {
  return useQuery({
    queryKey: auditKeys.globalFiltered(filters),
    queryFn: () => getGlobalAuditLog(filters),
    staleTime: 60_000,
    placeholderData: (prev) => prev,
    enabled: Boolean(filters.dateFrom),
  })
}
